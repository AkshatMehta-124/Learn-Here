import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Lesson {
  id: number;
  level: string;
  title: string;
  content: string;
  xp_reward: number;
}

export default function Lessons() {
  const { token, user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetch('/api/lessons', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      });
  }, [token]);

  const completeLesson = async (lesson: Lesson) => {
    try {
      await fetch('/api/user/xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: lesson.xp_reward })
      });
      alert(`Lesson completed! You earned ${lesson.xp_reward} XP.`);
      setActiveLesson(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading lessons...</div>;

  if (activeLesson) {
    const content = JSON.parse(activeLesson.content);
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => setActiveLesson(null)} className="text-indigo-600 font-medium mb-6 hover:underline">
          &larr; Back to Lessons
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{activeLesson.title}</h2>
          <p className="text-gray-500 mb-8">Level: {activeLesson.level}</p>

          <div className="space-y-6 mb-12 text-left">
            {content.words?.map((item: any, i: number) => (
              <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">{item.word}</span>
                <span className="text-lg text-gray-600">{item.translation}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => completeLesson(activeLesson)}
            className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={24} /> Complete Lesson (+{activeLesson.xp_reward} XP)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-3">
        <BookOpen className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Your Lessons</h1>
      </div>
      <p className="text-gray-600 mb-8">Learning path for: <span className="font-bold text-indigo-600">{user?.target_language}</span></p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                lesson.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' :
                lesson.level === 'Intermediate' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {lesson.level}
              </span>
              <span className="text-sm font-bold text-indigo-600">+{lesson.xp_reward} XP</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">Learn essential vocabulary and concepts for this topic.</p>
            
            <button
              onClick={() => setActiveLesson(lesson)}
              className="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-bold text-gray-900 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={18} /> Start Lesson
            </button>
          </motion.div>
        ))}
        {lessons.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">No lessons available for this language yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
