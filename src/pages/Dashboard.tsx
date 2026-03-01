import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, BookOpen, ArrowRight, Medal, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Language {
  id: number;
  name: string;
  code: string;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [topLearners, setTopLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => {
        setLanguages(data);
      });

    fetch('/api/badges', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setBadges(data);
      });

    if (user?.target_language) {
      fetch(`/api/leaderboard?language=${encodeURIComponent(user.target_language)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setTopLearners(data.slice(0, 3));
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, user?.target_language]);

  // Mock data for the chart
  const xpData = [
    { name: 'Mon', xp: Math.max(0, (user?.xp || 0) - 120) },
    { name: 'Tue', xp: Math.max(0, (user?.xp || 0) - 90) },
    { name: 'Wed', xp: Math.max(0, (user?.xp || 0) - 70) },
    { name: 'Thu', xp: Math.max(0, (user?.xp || 0) - 40) },
    { name: 'Fri', xp: Math.max(0, (user?.xp || 0) - 20) },
    { name: 'Sat', xp: Math.max(0, (user?.xp || 0) - 10) },
    { name: 'Sun', xp: user?.xp || 0 },
  ];

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.email.split('@')[0]}!</h1>
        <p className="text-gray-600 mt-2">Ready to continue your language journey?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total XP</p>
            <p className="text-2xl font-bold text-gray-900">{user?.xp}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Day Streak</p>
            <p className="text-2xl font-bold text-gray-900">{user?.streak}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Current Level</p>
            <p className="text-2xl font-bold text-gray-900">{user?.level}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Learning Progress</h2>
            <Link to="/leaderboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View Leaderboard <ArrowRight size={16} />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xpData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="xp" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="text-indigo-500" size={24} /> Top {user?.target_language} Learners
            </h2>
          </div>
          <div className="space-y-4 mb-8">
            {topLearners.map((learner, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${learner.id === user?.id ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 font-bold text-gray-400 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${learner.id === user?.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {learner.email.split('@')[0]} {learner.id === user?.id && '(You)'}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600">{learner.xp} XP</p>
                </div>
              </div>
            ))}
            {topLearners.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No learners yet. Be the first!</p>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Medal className="text-amber-500" /> Your Badges
          </h2>
          <div className="space-y-4">
            {badges.length > 0 ? badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  {badge.icon === 'Award' && <Award size={24} />}
                  {badge.icon === 'Flame' && <Flame size={24} />}
                  {badge.icon === 'Star' && <Star size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{badge.name}</h3>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Award size={32} className="mx-auto text-gray-300 mb-2" />
                Complete lessons and maintain your streak to earn badges!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Start Learning</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {languages.map((lang, index) => (
          <motion.div
            key={lang.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index % 8) * 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-700 border border-gray-200">
                {lang.code.toUpperCase()}
              </div>
              <BookOpen className="text-gray-400 group-hover:text-indigo-600 transition-colors" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{lang.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Beginner to Advanced</p>
            
            <Link 
              to={`/lessons`}
              className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Start Lessons <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
