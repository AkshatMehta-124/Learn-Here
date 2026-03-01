import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Settings, BookOpen, MessageSquare, Trophy, BrainCircuit, Users } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Learn Here</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-6 mr-4">
                  <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm transition-colors">
                    <Trophy size={18} /> Dashboard
                  </Link>
                  <Link to="/lessons" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm transition-colors">
                    <BookOpen size={18} /> Lessons
                  </Link>
                  <Link to="/flashcards" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm transition-colors">
                    <BrainCircuit size={18} /> Flashcards
                  </Link>
                  <Link to="/ai-conversation" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm transition-colors">
                    <MessageSquare size={18} /> AI Practice
                  </Link>
                  <Link to="/community" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1 font-medium text-sm transition-colors">
                    <Users size={18} /> Community
                  </Link>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full">
                    <Trophy size={16} /> {user.xp} XP
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-sm bg-orange-50 px-3 py-1 rounded-full">
                    🔥 {user.streak}
                  </div>
                </div>

                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-500 hover:text-gray-900">
                    <Settings size={20} />
                  </Link>
                )}
                
                <div className="relative group">
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <UserIcon size={16} />
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500">Level {user.level}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings size={16} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
