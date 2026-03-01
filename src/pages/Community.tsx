import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Post {
  id: number;
  email: string;
  title: string;
  content: string;
  created_at: string;
}

export default function Community() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchPosts = () => {
    fetch('/api/forum', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await fetch('/api/forum', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });

    setTitle('');
    setContent('');
    setShowForm(false);
    fetchPosts();
  };

  if (loading) return <div className="p-8 text-center">Loading community...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-indigo-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          New Post
        </button>
      </div>

      {showForm && (
        <motion.form 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
              placeholder="What's on your mind?"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea 
              required 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="w-full border-gray-300 rounded-lg p-3 border h-32 resize-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent" 
              placeholder="Share your language learning journey, ask questions, or practice writing..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
              Post <Send size={16} />
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-6">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {post.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{post.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </motion.div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <p className="text-gray-500">No posts yet. Be the first to start a discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
