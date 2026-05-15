"use client";

import { motion } from 'motion/react';
import { CheckCircle2, Pause, Plus } from 'lucide-react';

const agents = [
  {
    name: 'Marketing Agent Alpha',
    purpose: 'Ad spend automation',
    wallet: '0x742d...8f3a',
    status: 'active',
    dailyCap: '$100.00',
    perRequestCap: '$50.00',
    autoApproval: '$10.00',
    categories: ['Ads', 'SaaS'],
    storageRoot: '0xa963...5140',
    memoryRoot: '0xf599...1e6b',
    policyRoot: '0xa9b3...1b1e'
  },
  {
    name: 'Research Agent Beta',
    purpose: 'Data subscription management',
    wallet: '0x83f1...6b2d',
    status: 'active',
    dailyCap: '$75.00',
    perRequestCap: '$25.00',
    autoApproval: '$5.00',
    categories: ['SaaS', 'Data'],
    storageRoot: '0x3f7a...9e4d',
    memoryRoot: '0x8c2b...5f6a',
    policyRoot: '0x1e9d...7b3c'
  },
  {
    name: 'Operations Agent Gamma',
    purpose: 'Tool procurement',
    wallet: '0x92a7...4c8e',
    status: 'paused',
    dailyCap: '$200.00',
    perRequestCap: '$100.00',
    autoApproval: '$20.00',
    categories: ['SaaS', 'Tools', 'Infrastructure'],
    storageRoot: '0x6e4b...8d2a',
    memoryRoot: '0x2d9f...6c1e',
    policyRoot: '0x5a7c...9f4b'
  }
];

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

      <div className="space-y-6">
        {agents.map((agent, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-8 rounded-xl glass-panel-elevated relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-2xl font-semibold mb-2" style={{ color: '#FFF7E8' }}>{agent.name}</h3>
                <p className="text-sm" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>{agent.purpose}</p>
              </div>
              <span
                className="text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold"
                style={{
                  background: agent.status === 'active' ? 'rgba(67, 212, 131, 0.2)' : 'rgba(255, 246, 232, 0.1)',
                  color: agent.status === 'active' ? '#43D483' : 'rgba(255, 246, 232, 0.64)',
                  border: `1px solid ${agent.status === 'active' ? 'rgba(67, 212, 131, 0.3)' : 'rgba(255, 246, 232, 0.2)'}`
                }}
              >
                {agent.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-6 relative z-10">
              {[
                { label: 'Wallet Address', value: agent.wallet, mono: true },
                { label: 'Daily Cap', value: agent.dailyCap, highlight: true },
                { label: 'Per-Request Cap', value: agent.perRequestCap, highlight: true }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                  <div className="text-xs mb-2 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{item.label}</div>
                  <div className={`text-sm ${item.mono ? 'font-mono' : 'font-semibold'}`}
                    style={{ color: item.highlight ? '#FFB331' : '#FFF7E8' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6 relative z-10">
              <div className="p-4 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                <div className="text-xs mb-2 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>Auto-Approval</div>
                <div className="text-sm font-semibold" style={{ color: '#FFF7E8' }}>{agent.autoApproval}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                <div className="text-xs mb-2 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>Allowed Categories</div>
                <div className="flex gap-2 flex-wrap">
                  {agent.categories.map((cat, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(255, 179, 49, 0.2)', color: '#FFB331' }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5 pt-6 border-t relative z-10"
              style={{ borderColor: 'rgba(255, 129, 32, 0.2)' }}>
              {[
                { label: 'Storage Root', value: agent.storageRoot },
                { label: 'Memory Root', value: agent.memoryRoot },
                { label: 'Policy Root', value: agent.policyRoot }
              ].map((item, i) => (
                <div key={i}>
                  <div className="text-xs mb-2 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{item.label}</div>
                  <div className="text-xs font-mono p-2 rounded"
                    style={{ background: 'rgba(11, 7, 5, 0.6)', color: '#FFB331' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
