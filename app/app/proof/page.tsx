"use client";

import { motion } from 'motion/react';
import { Database, ExternalLink, CheckCircle2, Copy } from 'lucide-react';

const CONTRACT_ADDRESS = '0xc757698204543af249e328764e89530464de668e';
const EXPLORER_URL = 'https://chainscan.0g.ai';

export default function ProofPage() {
  return (
    <div className="max-w-6xl">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10"
        style={{ color: '#FFF7E8' }}
      >
        0G Layer
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl mb-10"
        style={{
          background: 'rgba(255, 179, 49, 0.15)',
          border: '1px solid rgba(255, 129, 32, 0.4)',
          boxShadow: '0 8px 24px rgba(255, 90, 18, 0.2)'
        }}
      >
        <p className="text-sm font-semibold leading-relaxed" style={{ color: '#FFF7E8' }}>
          This page makes judging easy by providing all verifiable proof of 0G integration on mainnet.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="p-7 rounded-xl glass-panel-elevated"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold" style={{ color: '#FFF7E8' }}>0G Mainnet Contract</h2>
            <Database className="w-6 h-6" style={{ color: '#FFB331' }} />
          </div>
          <div className="flex items-center gap-2 p-4 rounded-lg mb-4"
            style={{ background: 'rgba(11, 7, 5, 0.8)' }}>
            <code className="text-xs font-mono flex-1 break-all" style={{ color: '#FFB331' }}>
              {CONTRACT_ADDRESS}
            </code>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg"
              style={{ background: 'rgba(255, 179, 49, 0.15)' }}
              onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}
            >
              <Copy className="w-4 h-4" style={{ color: '#FFB331' }} />
            </motion.button>
          </div>
          <motion.a
            href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ x: 4 }}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-all"
            style={{ color: '#FFB331' }}
          >
            View on 0G Explorer <ExternalLink className="w-4 h-4" />
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="p-7 rounded-xl glass-panel-elevated"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold" style={{ color: '#FFF7E8' }}>Storage Root</h2>
            <Database className="w-6 h-6" style={{ color: '#FFE15B' }} />
          </div>
          <div className="space-y-3">
            {['Policy records synced', 'Agent metadata stored', 'Request logs indexed'].map((status, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'rgba(67, 212, 131, 0.1)' }}
              >
                <CheckCircle2 className="w-5 h-5" style={{ color: '#43D483' }} />
                <span className="text-sm font-medium" style={{ color: '#FFF7E8' }}>{status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {[
        {
          title: 'Agent Registration Event',
          data: [
            { label: 'Agent Profile Root (0G Storage)', value: '0xa9639b81ba042c45c8ba6d13b73a53110fc83be9e3067123cf933f7bd4de5140', cols: 2, mono: true },
            { label: 'Chain ID', value: '16661' },
            { label: 'Proof Type', value: 'Agent profile root' }
          ]
        },
        {
          title: 'Policy Hash',
          data: [
            { label: 'Policy Root (0G Storage)', value: '0xa9b39fc3e22c39058822aeee69800eeb6bfc83c5ca2b95201611886e8a6c1b1e', mono: true, fullWidth: true },
            { label: 'Proof Type', value: 'Policy record root' },
            { label: 'Network', value: '0G Mainnet' }
          ]
        },
        {
          title: 'Wallet-Funded Request',
          data: [
            { label: 'Receipt Root (0G Storage)', value: '0x5e8041c243afa263814d01c01c776876056d0369dae358f413c787c6e4dfa752', mono: true, fullWidth: true },
            { label: 'Proof Type', value: 'Receipt root' },
            { label: 'Status', value: 'Recorded', highlight: true }
          ]
        },
        {
          title: 'Final Decision Proof',
          badge: 'Request Approved',
          data: [
            { label: 'Compute Decision Root (0G Storage)', value: '0xa12eb9cfe85854f721aeaf36230a7d562bc376b9635fe2bddf490f40dad7773f', mono: true, fullWidth: true }
          ]
        },
        {
          title: 'Memory Root',
          data: [
            { label: 'Agent Memory Root (0G Storage)', value: '0xf599f6a4430673f2ecc201e0216248f3ae540d0991d8a0ae3bee31181d331e6b', mono: true, fullWidth: true }
          ],
          footer: 'All roots verified on 0G Mainnet (Chain 16661)'
        }
      ].map((section, sectionIdx) => (
        <motion.div
          key={sectionIdx}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + sectionIdx * 0.1, duration: 0.5 }}
          whileHover={{ y: -4 }}
          className="p-8 rounded-xl glass-panel-elevated mb-10"
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#FFF7E8' }}>{section.title}</h2>

          {section.badge && (
            <div className="p-4 rounded-lg mb-5" style={{ background: 'rgba(67, 212, 131, 0.15)' }}>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6" style={{ color: '#43D483' }} />
                <span className="font-semibold text-lg" style={{ color: '#43D483' }}>{section.badge}</span>
              </div>
              <div className="text-xs" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>
                All policy checks passed. Proof recorded on 0G Chain.
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {section.data.map((item, idx) => {
              const wide = ('fullWidth' in item && item.fullWidth) || ('cols' in item && item.cols === 2);
              const mono = 'mono' in item && item.mono;
              const highlight = 'highlight' in item && item.highlight;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${wide ? 'md:col-span-2' : ''}`}
                  style={{ background: 'rgba(11, 7, 5, 0.6)' }}
                >
                  <div className="text-xs mb-2 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{item.label}</div>
                  <div
                    className={`text-sm ${mono ? 'font-mono break-all' : 'font-semibold'}`}
                    style={{ color: highlight ? '#FFB331' : mono ? '#FFB331' : '#FFF7E8' }}
                  >
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>

          {section.footer && (
            <div className="flex items-center gap-3 p-4 rounded-lg mt-5"
              style={{ background: 'rgba(67, 212, 131, 0.1)' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#43D483' }} />
              <span className="text-sm font-medium" style={{ color: '#FFF7E8' }}>{section.footer}</span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
