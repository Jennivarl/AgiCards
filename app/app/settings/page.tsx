"use client";

import { motion } from 'motion/react';
import { Settings, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const integrations = [
  { name: '0G Chain', status: 'active', description: 'Smart contract deployment and transaction verification on mainnet (Chain 16661)' },
  { name: '0G Storage', status: 'active', description: 'Decentralized storage for policy records and receipts via indexer-storage-turbo' },
  { name: '0G Compute', status: 'active', description: 'AI policy reasoning with 0GM-1.0-35B-A3B model via router API' },
  { name: 'Agent ID', status: 'configured', description: 'Roadmap-compatible / contract-level MVP' },
  { name: 'Privacy/TEE', status: 'roadmap', description: 'Future secure execution layer' },
  { name: 'Stripe Adapter', status: 'future', description: 'Future/test adapter for issuer-backed card expansion' }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-6 h-6" style={{ color: '#43D483' }} />;
    case 'configured': return <Clock className="w-6 h-6" style={{ color: '#FFB331' }} />;
    default: return <AlertCircle className="w-6 h-6" style={{ color: 'rgba(255, 246, 232, 0.3)' }} />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return { bg: 'rgba(67, 212, 131, 0.2)', color: '#43D483', border: 'rgba(67, 212, 131, 0.3)' };
    case 'configured': return { bg: 'rgba(255, 179, 49, 0.2)', color: '#FFB331', border: 'rgba(255, 179, 49, 0.3)' };
    default: return { bg: 'rgba(255, 246, 232, 0.05)', color: 'rgba(255, 246, 232, 0.4)', border: 'rgba(255, 246, 232, 0.1)' };
  }
}

export default function SettingsPage() {
  return (
    <div className="max-w-6xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10"
        style={{ color: '#FFF7E8' }}
      >
        Settings
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-xl glass-panel-elevated mb-10"
      >
        <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3" style={{ color: '#FFF7E8' }}>
          <Settings className="w-7 h-7" style={{ color: '#FFB331' }} />
          Integrations
        </h2>

        <div className="space-y-5">
          {integrations.map((integration, idx) => {
            const isFaded = integration.status === 'roadmap' || integration.status === 'future';
            const statusColors = getStatusColor(integration.status);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08, duration: 0.5 }}
                whileHover={{ y: isFaded ? 0 : -3, scale: isFaded ? 1 : 1.01 }}
                className="p-6 rounded-xl relative overflow-hidden group"
                style={{
                  background: isFaded ? 'rgba(11, 7, 5, 0.3)' : 'rgba(16, 8, 5, 0.8)',
                  border: `1px solid ${isFaded ? 'rgba(255, 129, 32, 0.1)' : 'rgba(255, 129, 32, 0.25)'}`,
                  opacity: isFaded ? 0.5 : 1,
                  backdropFilter: isFaded ? 'none' : 'blur(12px)'
                }}
              >
                {!isFaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={isFaded ? {} : { scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: isFaded ? 'rgba(255, 246, 232, 0.05)' : statusColors.bg,
                        border: `1px solid ${statusColors.border}`
                      }}
                    >
                      {getStatusIcon(integration.status)}
                    </motion.div>
                    <h3 className="text-xl font-semibold"
                      style={{ color: isFaded ? 'rgba(255, 246, 232, 0.5)' : '#FFF7E8' }}>
                      {integration.name}
                    </h3>
                  </div>
                  <span
                    className="text-xs px-4 py-2 rounded-full uppercase tracking-wider font-bold"
                    style={{
                      background: statusColors.bg,
                      color: statusColors.color,
                      border: `1px solid ${statusColors.border}`
                    }}
                  >
                    {integration.status}
                  </span>
                </div>
                <p className="text-sm leading-relaxed relative z-10"
                  style={{ color: isFaded ? 'rgba(255, 246, 232, 0.4)' : 'rgba(255, 246, 232, 0.7)' }}>
                  {integration.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-8 rounded-xl relative overflow-hidden"
        style={{
          background: 'rgba(16, 8, 5, 0.3)',
          border: '1px solid rgba(255, 129, 32, 0.15)',
          opacity: 0.65
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FFB331 0%, transparent 70%)' }}
        />
        <h2 className="text-lg font-semibold mb-3 relative z-10"
          style={{ color: 'rgba(255, 246, 232, 0.7)' }}>Important Note</h2>
        <p className="text-sm mb-3 leading-relaxed relative z-10"
          style={{ color: 'rgba(255, 246, 232, 0.6)' }}>
          The Stripe adapter remains faded or secondary, positioned as future/test infrastructure.
        </p>
        <p className="text-sm leading-relaxed relative z-10"
          style={{ color: 'rgba(255, 246, 232, 0.5)' }}>
          Current live MVP focuses on Web3 virtual card controls with full 0G Chain, Storage, and Compute integration.
        </p>
      </motion.div>
    </div>
  );
}
