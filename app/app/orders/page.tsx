"use client";

import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const orders = [
  {
    merchant: 'Google Ads',
    category: 'Ads',
    amount: '$45.00',
    mode: 'Web3 virtual card',
    status: 'pending',
    riskScore: 'Low',
    policyChecks: '5/5 passed',
    receiptRoot: '0x5e80...a752',
    timestamp: '2 hours ago'
  },
  {
    merchant: 'OpenAI API',
    category: 'SaaS',
    amount: '$28.50',
    mode: 'Web3 virtual card',
    status: 'approved',
    riskScore: 'Low',
    policyChecks: '5/5 passed',
    receiptRoot: '0xa12e...773f',
    timestamp: '5 hours ago'
  },
  {
    merchant: 'AWS Marketplace',
    category: 'Infrastructure',
    amount: '$125.00',
    mode: 'Web3 virtual card',
    status: 'rejected',
    riskScore: 'High',
    policyChecks: '3/5 passed',
    receiptRoot: '0x9c4a...2d8e',
    timestamp: '1 day ago'
  },
  {
    merchant: 'Meta Ads',
    category: 'Ads',
    amount: '$32.00',
    mode: 'Web3 virtual card',
    status: 'completed',
    riskScore: 'Low',
    policyChecks: '5/5 passed',
    receiptRoot: '0xf599...1e6b',
    timestamp: '2 days ago'
  }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" style={{ color: '#FFB331' }} />;
    case 'approved': return <CheckCircle2 className="w-4 h-4" style={{ color: '#43D483' }} />;
    case 'rejected': return <XCircle className="w-4 h-4" style={{ color: '#FF6B5A' }} />;
    case 'completed': return <CheckCircle2 className="w-4 h-4" style={{ color: '#43D483' }} />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return { bg: 'rgba(255, 179, 49, 0.2)', color: '#FFB331', border: 'rgba(255, 179, 49, 0.3)' };
    case 'approved': return { bg: 'rgba(67, 212, 131, 0.2)', color: '#43D483', border: 'rgba(67, 212, 131, 0.3)' };
    case 'rejected': return { bg: 'rgba(255, 107, 90, 0.2)', color: '#FF6B5A', border: 'rgba(255, 107, 90, 0.3)' };
    case 'completed': return { bg: 'rgba(67, 212, 131, 0.2)', color: '#43D483', border: 'rgba(67, 212, 131, 0.3)' };
    default: return { bg: 'rgba(255, 246, 232, 0.1)', color: 'rgba(255, 246, 232, 0.64)', border: 'rgba(255, 246, 232, 0.2)' };
  }
}

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

      <div className="space-y-5 mb-10">
        {orders.map((order, idx) => {
          const statusStyle = getStatusColor(order.status);
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-7 rounded-xl glass-panel-elevated relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255, 179, 49, 0.15)', border: '1px solid rgba(255, 129, 32, 0.3)' }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: '#FFB331' }} />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1" style={{ color: '#FFF7E8' }}>{order.merchant}</h3>
                    <p className="text-sm" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{order.timestamp}</p>
                  </div>
                </div>
                <span
                  className="text-xs px-4 py-2 rounded-full flex items-center gap-2 font-semibold"
                  style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                >
                  {getStatusIcon(order.status)}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-5 relative z-10">
                {[
                  { label: 'Category', value: order.category },
                  { label: 'Amount', value: order.amount, highlight: true },
                  { label: 'Mode', value: order.mode },
                  { label: 'Risk Score', value: order.riskScore, risk: true }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                    <div className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>{item.label}</div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: item.highlight ? '#FFB331' : item.risk ? (item.value === 'Low' ? '#43D483' : '#FF6B5A') : '#FFF7E8'
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-5 border-t relative z-10"
                style={{ borderColor: 'rgba(255, 129, 32, 0.2)' }}>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                  <div className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>Policy Checks</div>
                  <div className="text-sm font-semibold" style={{ color: '#FFF7E8' }}>{order.policyChecks}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(11, 7, 5, 0.6)' }}>
                  <div className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>Receipt Root</div>
                  <div className="text-xs font-mono" style={{ color: '#FFB331' }}>{order.receiptRoot}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-7 rounded-xl"
        style={{
          background: 'rgba(16, 8, 5, 0.3)',
          border: '1px solid rgba(255, 129, 32, 0.12)',
          opacity: 0.6
        }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>Issuer-Backed Adapter</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.5)' }}>
          Stripe remains a future/test adapter for approved issuer-backed card expansion after compliance access is available.
        </p>
      </motion.div>
    </div>
  );
}
