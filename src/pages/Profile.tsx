import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, token, updateProfile } = useAuth();
  const [nativeLanguage, setNativeLanguage] = useState(user?.native_language || 'English (US)');
  const [targetLanguage, setTargetLanguage] = useState(user?.target_language || 'Spanish');
  const [proficiency, setProficiency] = useState(user?.proficiency || 'Beginner');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ native_language: nativeLanguage, target_language: targetLanguage, proficiency })
      });

      if (!res.ok) throw new Error('Failed to update profile');
      
      updateProfile({ native_language: nativeLanguage, target_language: targetLanguage, proficiency });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-3">
        <User className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-gray-500" /> Learning Preferences
          </h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Globe size={16} className="text-gray-400" /> Native Language
              </label>
              <select 
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Russian">Russian</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">The language AI will use to explain concepts to you.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Globe size={16} className="text-indigo-400" /> Target Language
              </label>
              <select 
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Russian">Russian</option>
                <option value="Hindi">Hindi</option>
                <option value="Japanese">Japanese</option>
                <option value="English (US)">English (US)</option>
                <option value="English (UK)">English (UK)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">The language you want to learn and practice.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Proficiency Level
              </label>
              <select 
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value)}
                className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="Beginner">Beginner (Start from basics)</option>
                <option value="Intermediate">Intermediate (I know some words)</option>
                <option value="Expert">Expert (I want to master it)</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {proficiency === 'Beginner' && 'AI will speak simply and explain everything in your native language.'}
                {proficiency === 'Intermediate' && 'AI will mix both languages and challenge you slightly.'}
                {proficiency === 'Expert' && 'AI will speak almost entirely in your target language with advanced vocabulary.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
