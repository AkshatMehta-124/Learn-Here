import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-learn-here";

app.use(express.json());

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.sendStatus(403);
  next();
};

// Initialize default admin user
const initializeAdmin = async () => {
  try {
    const adminEmail = 'admin@learnhere.com';
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(adminEmail, hashedPassword, 'admin');
      console.log('Default admin user created: admin@learnhere.com / adminpassword');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};
initializeAdmin();

// --- API Routes ---

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, native_language, target_language, proficiency } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, native_language, target_language, proficiency) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(email, hashedPassword, native_language || 'English (US)', target_language || 'Spanish', proficiency || 'Beginner');
    
    const token = jwt.sign({ id: result.lastInsertRowid, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: result.lastInsertRowid, email, role: 'user', xp: 0, level: 1, streak: 0, native_language, target_language, proficiency } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update streak logic here (simplified for now)
    const now = new Date();
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    let newStreak = user.streak;
    
    if (lastLogin) {
      const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 0;
    } else {
      newStreak = 1;
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, streak = ? WHERE id = ?').run(newStreak, user.id);
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, xp: user.xp, level: user.level, streak: newStreak, native_language: user.native_language, target_language: user.target_language, proficiency: user.proficiency } });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/me", authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, email, role, xp, level, streak, native_language, target_language, proficiency FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

app.post("/api/user/update", authenticateToken, (req: any, res) => {
  try {
    const { native_language, target_language, proficiency } = req.body;
    db.prepare('UPDATE users SET native_language = ?, target_language = ?, proficiency = ? WHERE id = ?')
      .run(native_language, target_language, proficiency, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Google OAuth
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    
    // If no client secret, simulate login for demo purposes
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo.google@example.com') as any;
      if (!user) {
        const stmt = db.prepare('INSERT INTO users (email, password_hash, native_language, target_language, proficiency) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run('demo.google@example.com', 'oauth', 'English (US)', 'Spanish', 'Beginner');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.send(`<html><body><script>window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: '${token}', user: ${JSON.stringify(user)} }, '*'); window.close();</script></body></html>`);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get access token');
    
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    if (!userData.email) throw new Error('Failed to get user email');
    
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userData.email) as any;
    if (!user) {
      const stmt = db.prepare('INSERT INTO users (email, password_hash, native_language, target_language, proficiency) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(userData.email, 'oauth', 'English (US)', 'Spanish', 'Beginner');
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.send(`<html><body><script>window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: '${token}', user: ${JSON.stringify(user)} }, '*'); window.close();</script></body></html>`);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.send(`<html><body><script>alert('Authentication failed. Please check your Google Client ID and Secret.'); window.close();</script></body></html>`);
  }
});

// Languages
app.get("/api/languages", (req, res) => {
  const languages = db.prepare('SELECT * FROM languages ORDER BY name').all();
  res.json(languages);
});

// Lessons
app.get("/api/lessons", authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT target_language FROM users WHERE id = ?').get(req.user.id) as any;
  const lang = db.prepare('SELECT id FROM languages WHERE name = ?').get(user?.target_language || 'Spanish') as any;
  
  // If no specific language lessons, return all for now
  const lessons = db.prepare('SELECT id, level, title, content, xp_reward FROM lessons WHERE language_id = ?').all(lang?.id || 4);
  res.json(lessons);
});

// Add XP
app.post("/api/user/xp", authenticateToken, (req: any, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number') return res.status(400).json({ error: "Invalid amount" });
    
    db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(amount, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin Routes
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, role, xp, level, streak, created_at FROM users').all();
  res.json(users);
});

// Leaderboard
app.get("/api/leaderboard", authenticateToken, (req, res) => {
  const { language } = req.query;
  let topUsers;
  
  if (language) {
    topUsers = db.prepare('SELECT id, email, xp, level, streak FROM users WHERE target_language = ? ORDER BY xp DESC LIMIT 10').all(language);
  } else {
    topUsers = db.prepare('SELECT id, email, xp, level, streak FROM users ORDER BY xp DESC LIMIT 10').all();
  }
  
  res.json(topUsers);
});

// Badges
app.get("/api/badges", authenticateToken, (req: any, res) => {
  // Check and award badges
  const user = db.prepare('SELECT xp, streak, level FROM users WHERE id = ?').get(req.user.id) as any;
  const allBadges = db.prepare('SELECT * FROM badges').all() as any[];
  
  for (const badge of allBadges) {
    let earned = false;
    if (badge.requirement_type === 'xp' && user.xp >= badge.requirement_value) earned = true;
    if (badge.requirement_type === 'streak' && user.streak >= badge.requirement_value) earned = true;
    if (badge.requirement_type === 'level' && user.level >= badge.requirement_value) earned = true;
    
    if (earned) {
      db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(req.user.id, badge.id);
    }
  }

  const userBadges = db.prepare(`
    SELECT b.*, ub.earned_at 
    FROM badges b 
    JOIN user_badges ub ON b.id = ub.badge_id 
    WHERE ub.user_id = ?
  `).all(req.user.id);
  
  res.json(userBadges);
});

// Flashcards (SRS)
app.get("/api/flashcards", authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT target_language FROM users WHERE id = ?').get(req.user.id) as any;
  const lang = db.prepare('SELECT id FROM languages WHERE name = ?').get(user?.target_language || 'Spanish') as any;
  
  // Get due flashcards
  const dueCards = db.prepare(`
    SELECT * FROM flashcards 
    WHERE user_id = ? AND language_id = ? AND next_review <= CURRENT_TIMESTAMP
    ORDER BY next_review ASC LIMIT 20
  `).all(req.user.id, lang?.id || 4);
  
  res.json(dueCards);
});

app.post("/api/flashcards", authenticateToken, (req: any, res) => {
  const { front, back } = req.body;
  const user = db.prepare('SELECT target_language FROM users WHERE id = ?').get(req.user.id) as any;
  const lang = db.prepare('SELECT id FROM languages WHERE name = ?').get(user?.target_language || 'Spanish') as any;
  
  db.prepare('INSERT INTO flashcards (user_id, language_id, front, back) VALUES (?, ?, ?, ?)').run(req.user.id, lang?.id || 4, front, back);
  res.json({ success: true });
});

app.post("/api/flashcards/review", authenticateToken, (req: any, res) => {
  const { cardId, quality } = req.body; // quality 0-5
  const card = db.prepare('SELECT * FROM flashcards WHERE id = ? AND user_id = ?').get(cardId, req.user.id) as any;
  
  if (!card) return res.status(404).json({ error: "Card not found" });

  let { interval, ease_factor } = card;
  
  if (quality < 3) {
    interval = 1;
  } else {
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);
  }
  
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  // Calculate next review in days
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  db.prepare('UPDATE flashcards SET interval = ?, ease_factor = ?, next_review = ? WHERE id = ?')
    .run(interval, ease_factor, nextReview.toISOString(), cardId);
    
  res.json({ success: true });
});

// Forum
app.get("/api/forum", authenticateToken, (req: any, res) => {
  const posts = db.prepare(`
    SELECT f.*, u.email 
    FROM forum_posts f 
    JOIN users u ON f.user_id = u.id 
    ORDER BY f.created_at DESC LIMIT 50
  `).all();
  res.json(posts);
});

app.post("/api/forum", authenticateToken, (req: any, res) => {
  const { title, content } = req.body;
  const user = db.prepare('SELECT target_language FROM users WHERE id = ?').get(req.user.id) as any;
  const lang = db.prepare('SELECT id FROM languages WHERE name = ?').get(user?.target_language || 'Spanish') as any;
  
  db.prepare('INSERT INTO forum_posts (user_id, language_id, title, content) VALUES (?, ?, ?, ?)').run(req.user.id, lang?.id || 4, title, content);
  res.json({ success: true });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
