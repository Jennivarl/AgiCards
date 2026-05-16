"use client";

import { motion } from 'motion/react';
import { Plus, Shield, CheckCircle2, Pause } from 'lucide-react';

const DEMO_AGENT = {
  name: 'Research Agent',
  purpose: 'AI tools & SaaS procurement',
  categories: 'SaaS, AI Tools',
  maxPerRequest: '$20.00',
  dailyLimit: '$80.00',
  autoApprove: 'Under $8',
  status: 'Active',
  agentId: '0xa963...5140',
  policyHash: '0xa9b3...1b1e',
  spent: '$7.00',
  remaining: '$73.00',
};

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
        whileHover={{ y: -4 }}
        className="p-7 rounded-xl glass-panel-elevated"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold" style={{ color: '#FFF7E8' }}>{DEMO_AGENT.name}</h2>
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(67, 212, 131, 0.15)', color: '#43D483' }}>
                {DEMO_AGENT.status}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{DEMO_AGENT.purpose}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255, 246, 232, 0.07)', border: '1px solid rgba(255, 129, 32, 0.2)', color: 'rgba(255, 246, 232, 0.6)' }}
          >
            <Pause className="w-3.5 h-3.5" /> Pause
          </motion.button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Max per Request', value: DEMO_AGENT.maxPerRequest, highlight: true },
            { label: 'Daily Limit', value: DEMO_AGENT.dailyLimit, highlight: true },
            { label: 'Auto-Approve', value: DEMO_AGENT.autoApprove },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.5)' }}>
              <div className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255, 246, 232, 0.5)' }}>{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.highlight ? '#FFB331' : '#FFF7E8' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255, 246, 232, 0.5)' }}>
            <span>Daily spend</span>
            <span>{DEMO_AGENT.spent} of {DEMO_AGENT.dailyLimit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 246, 232, 0.08)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '8.75%' }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FFB331, #FF5A12)' }}
            />
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'rgba(255, 246, 232, 0.4)' }}>{DEMO_AGENT.remaining} remaining today</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Allowed Categories', value: DEMO_AGENT.categories },
            { label: 'Agent ID (0G Storage)', value: DEMO_AGENT.agentId, mono: true },
            { label: 'Policy Hash (0G Storage)', value: DEMO_AGENT.policyHash, mono: true },
          ].map((item, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${idx === 0 ? 'md:col-span-2' : ''}`}
              style={{ background: 'rgba(11, 7, 5, 0.5)' }}>
              <div className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255, 246, 232, 0.5)' }}>{item.label}</div>
              <div className={`text-sm ${item.mono ? 'font-mono' : 'font-semibold'}`}
                style={{ color: item.mono ? '#FFB331' : '#FFF7E8' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-5 pt-5" style={{ borderTop: '1px solid rgba(255, 129, 32, 0.15)' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: '#43D483' }} />
          <span className="text-xs font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>
            Agent registered on 0G Chain · Policy hash anchored to 0G Storage
          </span>
          <Shield className="w-4 h-4 ml-auto" style={{ color: 'rgba(255, 179, 49, 0.5)' }} />
        </div>
      </motion.div>
    </div>
  );
}
