import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Star, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  id: number;
  email: string;
  xp: number;
  level: number;
  streak: number;
}

interface Language {
  id: number;
  name: string;
  code: string;
}

export default function Leaderboard() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => setLanguages(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedLanguage === 'all' 
      ? '/api/leaderboard' 
      : `/api/leaderboard?language=${encodeURIComponent(selectedLanguage)}`;
      
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  }, [token, selectedLanguage]);

  if (loading) return <div className="p-8 text-center">Loading leaderboard...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-3 justify-center">
        <Trophy className="text-amber-500" size={40} />
        <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
      </div>
      <p className="text-center text-gray-600 mb-8">Top learners by XP. Keep practicing to climb the ranks!</p>

      <div className="flex justify-center mb-12">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
          <Globe className="text-indigo-500" size={20} />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none"
          >
            <option value="all">Global Leaderboard</option>
            {languages.map(lang => (
              <option key={lang.id} value={lang.name}>{lang.name} Learners</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {users.map((u, index) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-6 border-b border-gray-100 last:border-0 ${
              u.id === currentUser?.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
            } transition-colors`}
          >
            <div className="flex items-center gap-6">
              <div className="w-8 font-bold text-gray-400 text-xl text-center">
                {index === 0 ? <Medal className="text-yellow-500 mx-auto" size={28} /> : 
                 index === 1 ? <Medal className="text-gray-400 mx-auto" size={28} /> : 
                 index === 2 ? <Medal className="text-amber-700 mx-auto" size={28} /> : 
                 `#${index + 1}`}
              </div>
              <div>
                <p className={`font-bold text-lg ${u.id === currentUser?.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                  {u.email.split('@')[0]} {u.id === currentUser?.id && '(You)'}
                </p>
                <div className="flex items-center gap-4 text-sm mt-1">
                  <span className="text-gray-500 flex items-center gap-1"><Star size={14} className="text-indigo-400"/> Lvl {u.level}</span>
                  <span className="text-orange-500 font-medium">🔥 {u.streak} days</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">{u.xp}</p>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">XP</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
