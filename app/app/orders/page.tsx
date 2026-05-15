"use client";

import { motion } from 'motion/react';
import { CreditCard } from 'lucide-react';

export default function CardOrders() {
  return (
    <div className="max-w-7xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10"
        style={{ color: '#FFF7E8' }}
      >
        Card Orders
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col items-center justify-center py-24 rounded-xl glass-panel-elevated mb-10"
      >
        <CreditCard className="w-14 h-14 mb-6" style={{ color: 'rgba(255, 179, 49, 0.4)' }} />
        <p className="text-lg font-semibold mb-2" style={{ color: 'rgba(255, 247, 232, 0.7)' }}>No card orders yet</p>
        <p className="text-sm text-center max-w-xs" style={{ color: 'rgba(255, 246, 232, 0.45)' }}>
          Card requests submitted by your agents will appear here with their policy checks and receipt roots.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-7 rounded-xl"
        style={{
          background: 'rgba(16, 8, 5, 0.3)',
          border: '1px solid rgba(255, 129, 32, 0.12)',
          opacity: 0.6
        }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>Issuer-Backed Adapter</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.5)' }}>
          Stripe remains a future adapter for approved issuer-backed card expansion after compliance access is available.
        </p>
      </motion.div>
    </div>
  );
}
