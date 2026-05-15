"use client";

import { motion } from 'motion/react';
import { Plus, Users } from 'lucide-react';

export default function Agents() {
  return (
    <div className="max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <h1 className="text-4xl font-bold" style={{ color: '#FFF7E8' }}>Agents</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-7 py-4 rounded-lg font-semibold relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
            color: '#050403',
            boxShadow: '0 8px 24px rgba(255, 90, 18, 0.4)'
          }}
        >
          <Plus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Create Agent</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-xl mb-8"
        style={{ background: 'rgba(255, 179, 49, 0.12)', border: '1px solid rgba(255, 129, 32, 0.35)' }}
      >
        <p className="text-sm font-medium leading-relaxed" style={{ color: '#FFF7E8' }}>
          Each agent gets a wallet policy, a clear role, and proof records before it can act.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col items-center justify-center py-24 rounded-xl glass-panel-elevated"
      >
        <Users className="w-14 h-14 mb-6" style={{ color: 'rgba(255, 179, 49, 0.4)' }} />
        <p className="text-lg font-semibold mb-2" style={{ color: 'rgba(255, 247, 232, 0.7)' }}>No agents yet</p>
        <p className="text-sm text-center max-w-xs" style={{ color: 'rgba(255, 246, 232, 0.45)' }}>
          Create your first agent to assign a spending policy and start issuing card requests.
        </p>
      </motion.div>
    </div>
  );
}
