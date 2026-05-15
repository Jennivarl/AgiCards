"use client";

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { VirtualCard } from '@/components/VirtualCard';
import { Wallet, Shield, Database, CreditCard, ArrowRight, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className="relative pt-32 pb-32 px-6 overflow-hidden">
        <motion.div
          style={{ opacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #FF5A12 0%, transparent 70%)' }}
          />
          <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #FFE15B 0%, transparent 70%)' }}
          />
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-8"
                style={{ fontSize: '4.5rem', lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: 800, color: '#FFF7E8' }}
              >
                Agents can spend, but only inside the rules you set.
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl mb-10 leading-relaxed max-w-xl"
                style={{ color: 'rgba(255, 246, 232, 0.85)' }}
              >
                Programmable Web3 cards for AI agents, built with user deposits, spend rules, and verifiable 0G proof.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex gap-4 mb-14"
              >
                <Link
                  href="/app"
                  className="group relative px-8 py-4 rounded-lg font-semibold transition-all overflow-hidden flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
                    color: '#050403',
                    boxShadow: '0 8px 24px rgba(255, 90, 18, 0.4)'
                  }}
                >
                  <span className="relative z-10">Open MVP</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
                <Link
                  href="/app/proof"
                  className="group px-8 py-4 rounded-lg font-semibold transition-all relative overflow-hidden"
                  style={{
                    background: 'rgba(255, 90, 18, 0.12)',
                    border: '1px solid rgba(255, 129, 32, 0.35)',
                    color: '#FFB331',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <span className="relative z-10">View 0G Layer</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="grid grid-cols-3 gap-5"
              >
                {[
                  { num: '16661', label: '0G mainnet chain ID' },
                  { num: '24/7', label: 'Policy checks' },
                  { num: '2', label: 'Agent spend paths' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="p-5 rounded-lg glass-panel transition-all"
                    style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                  >
                    <div className="text-3xl font-bold mb-1.5 text-gradient-orange">{stat.num}</div>
                    <div className="text-xs leading-tight" style={{ color: 'rgba(255, 246, 232, 0.65)' }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              style={{ y }}
              className="relative h-[550px] flex items-center justify-center"
            >
              <VirtualCard variant="default" delay={0.4} index={0} />
              <VirtualCard variant="gold" delay={0.5} index={1} />
              <VirtualCard variant="pink" delay={0.6} index={2} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            id="product"
            className="mb-32"
          >
            <h2 className="text-5xl font-bold mb-16 text-center max-w-4xl mx-auto leading-tight" style={{ color: '#FFF7E8' }}>
              Every card request is funded, bounded, and proven on-chain.
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Wallet, color: '#FF5A12', title: 'Agent Wallets', desc: 'Each AI agent gets a dedicated wallet with clear spending rules and balance limits.' },
                { icon: Lock, color: '#FFB331', title: 'User-Funded Control', desc: 'Users deposit first. Agents request spending from funded wallets only.' },
                { icon: Database, color: '#FFE15B', title: '0G Proof Layer', desc: 'All activity is recorded with verifiable proof on 0G Chain and Storage.' },
                { icon: CreditCard, color: '#EE93A8', title: 'Card Adapter Path', desc: 'Web3 virtual cards now. Issuer-backed adapter roadmap for future expansion.' }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="p-7 rounded-lg glass-panel-elevated metallic-shine group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-14 h-14 rounded-xl mb-5 flex items-center justify-center shadow-lg"
                    style={{
                      background: `rgba(${item.color === '#FF5A12' ? '255, 90, 18' : item.color === '#FFB331' ? '255, 179, 49' : item.color === '#FFE15B' ? '255, 225, 91' : '238, 147, 168'}, 0.2)`,
                      border: `1px solid rgba(${item.color === '#FF5A12' ? '255, 90, 18' : item.color === '#FFB331' ? '255, 179, 49' : item.color === '#FFE15B' ? '255, 225, 91' : '238, 147, 168'}, 0.4)`
                    }}
                  >
                    <item.icon className="w-7 h-7" style={{ color: item.color }} />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: '#FFF7E8' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            id="0g-layer"
            className="mb-32 p-14 rounded-2xl relative overflow-hidden"
            style={{
              background: 'rgba(16, 8, 5, 0.5)',
              border: '1px solid rgba(255, 129, 32, 0.35)',
              boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, #FFB331 0%, transparent 70%)' }}
            />

            <h2 className="text-5xl font-bold mb-14 text-center relative z-10 leading-tight" style={{ color: '#FFF7E8' }}>
              On-chain verification is{' '}
              <span className="text-gradient-orange">core infrastructure.</span>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {[
                { icon: Shield, color: '#FF5A12', title: '0G Chain', desc: 'Contract activity and agent spend events' },
                { icon: Database, color: '#FFB331', title: '0G Storage', desc: 'Policy records, agent metadata, request logs' },
                { icon: Sparkles, color: '#FFE15B', title: '0G Compute', desc: 'AI policy reasoning and request evaluation' },
                { icon: CheckCircle2, color: '#EE93A8', title: 'Agent ID', desc: 'Roadmap-compatible identity layer' },
                { icon: Lock, color: '#43D483', title: 'Privacy', desc: 'Future secure execution layer' }
              ].map((module, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="p-6 rounded-xl glass-panel-elevated"
                  style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' }}
                >
                  <module.icon className="w-9 h-9 mb-4" style={{ color: module.color }} />
                  <h3 className="font-semibold mb-2.5 text-lg" style={{ color: '#FFB331' }}>{module.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.7)' }}>
                    {module.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            id="flow"
            className="mb-32"
          >
            <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: '#FFF7E8' }}>
              How It Works
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              {[
                { num: '1', title: 'Fund Wallet', icon: Wallet },
                { num: '2', title: 'Generate Agent', icon: Sparkles },
                { num: '3', title: 'Set Spend Rules', icon: Shield },
                { num: '4', title: 'Approve Request', icon: CheckCircle2 },
                { num: '5', title: 'Store Proof on 0G', icon: Database }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="p-7 rounded-xl text-center glass-panel-elevated min-w-[180px]"
                  >
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                      <step.icon className="w-10 h-10 mx-auto mb-3" style={{ color: '#FFB331' }} />
                    </motion.div>
                    <div className="text-3xl font-bold mb-2 text-gradient-orange">{step.num}</div>
                    <div className="text-sm font-medium" style={{ color: '#FFF7E8' }}>{step.title}</div>
                  </motion.div>
                  {idx < 4 && (
                    <ArrowRight className="hidden md:block w-7 h-7" style={{ color: 'rgba(255, 129, 32, 0.5)' }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center p-16 rounded-2xl glass-panel-elevated relative overflow-hidden"
            style={{ boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 179, 49, 0.4) 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            <h2 className="text-4xl font-bold mb-5 relative z-10" style={{ color: '#FFF7E8' }}>
              Controlled agent spending, with on-chain proof at every step.
            </h2>
            <p className="text-lg mb-10 relative z-10 max-w-3xl mx-auto" style={{ color: 'rgba(255, 246, 232, 0.75)' }}>
              AgiCards delivers live Web3 card controls with verifiable on-chain enforcement. A Stripe adapter is available for future issuer-backed card programmes.
            </p>
            <Link
              href="/app"
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-xl font-semibold text-lg transition-all relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
                color: '#050403',
                boxShadow: '0 12px 32px rgba(255, 90, 18, 0.5)'
              }}
            >
              <span className="relative z-10">Enter AgiCards</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
