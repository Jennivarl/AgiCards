"use client";

import { motion } from 'motion/react';
import { Wallet, Users, Shield, CreditCard, Database, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-10" style={{ color: '#FFF7E8' }}>Dashboard</h1>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: Wallet, label: 'Wallet Balance', value: '$2,450.00', change: 'Available to spend', changeColor: '#43D483', color: '#FFB331' },
          { icon: Users, label: 'Active Agents', value: '1', change: '1 active · 0 paused', changeColor: 'rgba(255, 246, 232, 0.5)', color: '#FFB331' },
          { icon: CreditCard, label: 'Pending Requests', value: '0', change: 'All requests resolved', changeColor: 'rgba(255, 246, 232, 0.5)', color: '#FFB331' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-7 rounded-xl glass-panel-elevated relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{stat.label}</span>
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </motion.div>
            </div>
            <div className="text-4xl font-bold mb-2" style={{ color: '#FFF7E8' }}>{stat.value}</div>
            <div className="text-xs font-medium" style={{ color: stat.changeColor }}>{stat.change}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="p-7 rounded-xl glass-panel-elevated"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#FFF7E8' }}>
            <Users className="w-6 h-6" style={{ color: '#FFB331' }} />
            Active Agent
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Name', value: 'Research Agent' },
              { label: 'Purpose', value: 'AI tools & SaaS procurement' },
              { label: 'Daily Cap', value: '$80.00', highlight: true },
              { label: 'Status', value: 'Active', badge: true }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05, duration: 0.3 }}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ background: 'rgba(11, 7, 5, 0.5)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{item.label}</span>
                {item.badge ? (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(67, 212, 131, 0.15)', color: '#43D483' }}>
                    {item.value}
                  </span>
                ) : (
                  <span className="text-sm font-semibold"
                    style={{ color: item.highlight ? '#FFB331' : '#FFF7E8' }}>{item.value}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="p-7 rounded-xl glass-panel-elevated"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#FFF7E8' }}>
            <Shield className="w-6 h-6" style={{ color: '#FFB331' }} />
            Spend Policy
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Per-Request Cap', value: '$20.00' },
              { label: 'Auto-Approval', value: 'Under $8' },
              { label: 'Allowed Categories', value: 'SaaS, AI Tools' },
              { label: 'Policy Hash', value: '0xa9b3...1b1e', mono: true }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05, duration: 0.3 }}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ background: 'rgba(11, 7, 5, 0.5)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{item.label}</span>
                <span className={`text-sm ${item.mono ? 'font-mono' : 'font-semibold'}`}
                  style={{ color: item.mono ? 'rgba(255, 179, 49, 0.5)' : 'rgba(255, 247, 232, 0.5)' }}>
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="p-7 rounded-xl glass-panel-elevated"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#FFF7E8' }}>
            <Database className="w-6 h-6" style={{ color: '#FFB331' }} />
            0G Layer Status
          </h2>
          <div className="space-y-4">
            {['0G Chain contract deployed', '0G Storage roots recorded', '0G Compute decision root recorded'].map((status, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(67, 212, 131, 0.1)' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: '#43D483' }} />
                <span className="text-sm font-medium" style={{ color: '#FFF7E8' }}>{status}</span>
              </motion.div>
            ))}
            <div className="text-xs mt-4 p-3 rounded-lg"
              style={{ background: 'rgba(67, 212, 131, 0.05)', color: 'rgba(255, 246, 232, 0.7)' }}>
              Contract: 0xc757...668e &middot; Chain 16661
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="p-8 rounded-xl glass-panel-elevated"
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: '#FFF7E8' }}>Integration Status</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {[
            { name: 'Web3 Virtual Cards', active: true },
            { name: 'Stripe Adapter', active: false }
          ].map((integration, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + idx * 0.1, duration: 0.4 }}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{
                background: integration.active ? 'rgba(67, 212, 131, 0.1)' : 'rgba(11, 7, 5, 0.6)',
                opacity: integration.active ? 1 : 0.5
              }}
            >
              <span className="text-sm font-medium"
                style={{ color: integration.active ? '#FFF7E8' : 'rgba(255, 246, 232, 0.5)' }}>
                {integration.name}
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{
                  background: integration.active ? 'rgba(67, 212, 131, 0.2)' : 'rgba(255, 246, 232, 0.1)',
                  color: integration.active ? '#43D483' : 'rgba(255, 246, 232, 0.5)'
                }}
              >
                {integration.active ? 'Active' : 'Future/Test'}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-lg font-semibold transition-all relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
              color: '#050403',
              boxShadow: '0 8px 24px rgba(255, 90, 18, 0.4)'
            }}
          >
            <span className="relative z-10">Register Agent Proof</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-lg font-semibold transition-all"
            style={{
              background: 'rgba(255, 90, 18, 0.15)',
              border: '1px solid rgba(255, 129, 32, 0.3)',
              color: '#FFB331'
            }}
          >
            Evaluate & Issue Web3 Card
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
