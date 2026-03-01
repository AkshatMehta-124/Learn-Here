import Database from 'better-sqlite3';

const db = new Database('database.sqlite', { verbose: console.log });

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    native_language TEXT DEFAULT 'English (US)',
    target_language TEXT DEFAULT 'Spanish',
    proficiency TEXT DEFAULT 'Beginner',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_languages (
    user_id INTEGER,
    language_id INTEGER,
    proficiency_level TEXT DEFAULT 'Beginner',
    PRIMARY KEY (user_id, language_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_id INTEGER,
    level TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON string for lesson content (flashcards, quizzes)
    xp_reward INTEGER DEFAULT 10,
    FOREIGN KEY (language_id) REFERENCES languages(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER,
    lesson_id INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    language_id INTEGER,
    topic TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    role TEXT NOT NULL, -- 'user' or 'ai'
    content TEXT NOT NULL,
    grammar_correction TEXT,
    fluency_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    language_id INTEGER,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
    interval INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    user_id INTEGER,
    badge_id INTEGER,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
  );

  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    language_id INTEGER,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id)
  );
`);

// Insert default languages if they don't exist
const insertLanguage = db.prepare('INSERT OR IGNORE INTO languages (name, code) VALUES (?, ?)');
const insertLesson = db.prepare('INSERT OR IGNORE INTO lessons (language_id, level, title, content, xp_reward) VALUES (?, ?, ?, ?, ?)');

const languages = [
  ['English (US)', 'en-US'], ['English (UK)', 'en-GB'], ['Spanish', 'es'], ['French', 'fr'],
  ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'], ['Russian', 'ru'],
  ['Japanese', 'ja'], ['Korean', 'ko'], ['Chinese (Mandarin)', 'zh'], ['Hindi', 'hi'],
  ['Arabic', 'ar'], ['Bengali', 'bn'], ['Punjabi', 'pa'], ['Telugu', 'te'],
  ['Marathi', 'mr'], ['Tamil', 'ta'], ['Urdu', 'ur'], ['Gujarati', 'gu'],
  ['Kannada', 'kn'], ['Odia', 'or'], ['Malayalam', 'ml'], ['Assamese', 'as'],
  ['Maithili', 'mai'], ['Bhili', 'bhb'], ['Santali', 'sat'], ['Kashmiri', 'ks'],
  ['Nepali', 'ne'], ['Sindhi', 'sd'], ['Konkani', 'kok'], ['Dogri', 'doi'],
  ['Bodo', 'brx'], ['Turkish', 'tr'], ['Vietnamese', 'vi'], ['Polish', 'pl'],
  ['Ukrainian', 'uk'], ['Dutch', 'nl'], ['Thai', 'th'], ['Swedish', 'sv'],
  ['Indonesian', 'id'], ['Tagalog', 'tl'], ['Swahili', 'sw'], ['Persian', 'fa'],
  ['Romanian', 'ro'], ['Greek', 'el'], ['Czech', 'cs'], ['Hungarian', 'hu'],
  ['Finnish', 'fi'], ['Danish', 'da'], ['Hebrew', 'he'], ['Norwegian', 'no']
];

const insertMany = db.transaction((langs) => {
  for (const lang of langs) {
    insertLanguage.run(lang[0], lang[1]);
    const row = db.prepare('SELECT id FROM languages WHERE name = ?').get(lang[0]) as any;
    const langId = row.id;
    
    // Check if lessons exist for this language to avoid duplicates
    const existingLessons = db.prepare('SELECT count(*) as count FROM lessons WHERE language_id = ?').get(langId) as any;
    if (existingLessons.count === 0) {
      insertLesson.run(langId, 'Beginner', `Basics 1 (${lang[0]})`, '{"type": "basics", "words": [{"word": "hello", "translation": "hello"}, {"word": "goodbye", "translation": "goodbye"}]}', 20);
      insertLesson.run(langId, 'Beginner', `Common Verbs (${lang[0]})`, '{"type": "verbs", "words": [{"word": "run", "translation": "run"}, {"word": "eat", "translation": "eat"}]}', 25);
      insertLesson.run(langId, 'Intermediate', `Travel & Directions (${lang[0]})`, '{"type": "travel", "words": [{"word": "airport", "translation": "airport"}, {"word": "hotel", "translation": "hotel"}]}', 30);
    }
  }
});
insertMany(languages);

// Add columns safely if they don't exist
try { db.exec(`ALTER TABLE users ADD COLUMN native_language TEXT DEFAULT 'English (US)'`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN target_language TEXT DEFAULT 'Spanish'`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN proficiency TEXT DEFAULT 'Beginner'`); } catch (e) {}

// Seed badges
db.exec(`
  INSERT OR IGNORE INTO badges (id, name, description, icon, requirement_type, requirement_value) VALUES
  (1, 'First Steps', 'Earn your first 50 XP', 'Award', 'xp', 50),
  (2, 'Dedicated Learner', 'Reach a 3-day streak', 'Flame', 'streak', 3),
  (3, 'Polyglot in Training', 'Reach Level 5', 'Star', 'level', 5);
`);

export default db;
