import { useState, useEffect } from 'react';
import { Github, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface UsernameInputProps {
  onRoast: (username: string) => void;
  isLoading: boolean;
}

export function UsernameInput({ onRoast, isLoading }: UsernameInputProps) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (username.trim().length > 0) {
      setAvatar(`https://github.com/${username.trim()}.png`);
    } else {
      setAvatar('');
    }
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && !isLoading) {
      onRoast(username.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Github size={24} />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username..."
              disabled={isLoading}
              className="w-full pl-16 pr-6 py-5 bg-black/30 border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 text-lg focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 disabled:opacity-50"
            />
            {avatar && (
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={avatar}
                alt=""
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
          
          <motion.button
            type="submit"
            disabled={!username.trim() || isLoading}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Flame size={24} />
            <span>{isLoading ? 'Roasting...' : 'Roast Me'}</span>
            <Flame size={24} />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
