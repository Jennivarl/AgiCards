"use client";

import { motion } from 'motion/react';
import { Wallet, TrendingUp, Database, CheckCircle2 } from 'lucide-react';

const depositAmounts = [25, 50, 100, 250];

export default function WalletPage() {
  return (
    <div className="max-w-6xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10"
        style={{ color: '#FFF7E8' }}
      >
        Wallet
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl mb-10"
        style={{ background: 'rgba(255, 179, 49, 0.12)', border: '1px solid rgba(255, 129, 32, 0.35)' }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: '#FFF7E8' }}>Deposit first, delegate second.</p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>
          Agents can only request spend from funds the user has already placed inside the AgiCards wallet.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {[
          { icon: Wallet, label: 'Total Deposited', value: '$2,450.00', color: '#FFB331' },
          { icon: TrendingUp, label: 'Available Balance', value: '$1,875.00', color: '#43D483' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="p-8 rounded-xl glass-panel-elevated relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{stat.label}</span>
              <motion.div whileHover={{ scale: 1.1, rotate: 10 }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </motion.div>
            </div>
            <div className="text-5xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {[
          { label: 'Reserved Balance', value: '$425.00', desc: 'Locked for pending requests', color: '#FFB331' },
          { label: 'Total Spent', value: '$150.00', desc: 'This month', color: '#FFF7E8' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-7 rounded-xl glass-panel-elevated"
          >
            <div className="text-sm mb-3 font-medium" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{stat.label}</div>
            <div className="text-3xl font-bold mb-2" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{stat.desc}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="p-8 rounded-xl glass-panel-elevated mb-10"
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: '#FFF7E8' }}>Quick Deposit</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {depositAmounts.map((amount, idx) => (
            <motion.button
              key={amount}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-5 rounded-lg font-bold text-lg relative overflow-hidden group"
              style={{
                background: 'rgba(255, 179, 49, 0.15)',
                border: '1px solid rgba(255, 129, 32, 0.35)',
                color: '#FFB331'
              }}
            >
              <span className="relative z-10">${amount}</span>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-8 py-4 rounded-lg font-semibold relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
            color: '#050403',
            boxShadow: '0 8px 24px rgba(255, 90, 18, 0.4)'
          }}
        >
          <span className="relative z-10">Custom Deposit Amount</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="p-8 rounded-xl glass-panel-elevated"
      >
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#FFF7E8' }}>
          <Database className="w-6 h-6" style={{ color: '#FFB331' }} />
          0G Mainnet Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
            <span className="text-sm font-medium" style={{ color: 'rgba(255, 246, 232, 0.8)' }}>Deposit Proof Root</span>
            <span className="text-xs font-mono" style={{ color: '#FFB331' }}>0x5e80...a752</span>
          </div>
          {['Connected to 0G Chain Mainnet', 'Wallet transactions synced to 0G Storage'].map((status, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + idx * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 p-4 rounded-lg"
              style={{ background: 'rgba(67, 212, 131, 0.1)' }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: '#43D483' }} />
              <span className="text-sm font-medium" style={{ color: '#FFF7E8' }}>{status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
