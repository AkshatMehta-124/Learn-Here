import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Plus, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Flashcard {
  id: number;
  front: string;
  back: string;
}

export default function Flashcards() {
  const { token } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const fetchCards = () => {
    fetch('/api/flashcards', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCards();
  }, [token]);

  const handleReview = async (quality: number) => {
    const card = cards[currentCardIndex];
    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cardId: card.id, quality })
    });
    
    setIsFlipped(false);
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      fetchCards(); // Fetch next batch or show empty state
      setCurrentCardIndex(0);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ front: newFront, back: newBack })
    });
    setNewFront('');
    setNewBack('');
    setShowAdd(false);
    fetchCards();
  };

  if (loading) return <div className="p-8 text-center">Loading flashcards...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-indigo-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Spaced Repetition</h1>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors"
        >
          <Plus size={18} /> Add Card
        </button>
      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8"
          onSubmit={handleAddCard}
        >
          <h3 className="font-bold text-lg mb-4">Create New Flashcard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Front (Target Language)</label>
              <input required value={newFront} onChange={e => setNewFront(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Back (Native Language)</label>
              <input required value={newBack} onChange={e => setNewBack(e.target.value)} className="w-full border-gray-300 rounded-lg p-2 border" />
            </div>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Save Card</button>
        </motion.form>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 border-dashed">
          <Layers size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-500">No cards due for review right now. Add some new cards to keep learning.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-gray-500 font-medium mb-6">Card {currentCardIndex + 1} of {cards.length} due today</p>
          
          <div 
            className="w-full max-w-2xl aspect-[3/2] perspective-1000 cursor-pointer mb-8"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateX: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-md border border-gray-200 flex items-center justify-center p-8 text-center">
                <h2 className="text-4xl font-bold text-gray-900">{cards[currentCardIndex].front}</h2>
                <p className="absolute bottom-6 text-gray-400 text-sm font-medium">Click to flip</p>
              </div>
              
              <div className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl shadow-md border border-indigo-100 flex items-center justify-center p-8 text-center" style={{ transform: 'rotateX(180deg)' }}>
                <h2 className="text-4xl font-bold text-indigo-900">{cards[currentCardIndex].back}</h2>
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 w-full max-w-2xl"
              >
                <button onClick={(e) => { e.stopPropagation(); handleReview(1); }} className="flex-1 bg-red-100 text-red-700 py-4 rounded-xl font-bold hover:bg-red-200 transition-colors">Hard</button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="flex-1 bg-amber-100 text-amber-700 py-4 rounded-xl font-bold hover:bg-amber-200 transition-colors">Good</button>
                <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="flex-1 bg-emerald-100 text-emerald-700 py-4 rounded-xl font-bold hover:bg-emerald-200 transition-colors">Easy</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
