"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, Wallet, CreditCard, Database, Settings, ArrowLeft } from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/agents', label: 'Agents', icon: Users },
  { path: '/app/wallet', label: 'Wallet', icon: Wallet },
  { path: '/app/orders', label: 'Card Orders', icon: CreditCard },
  { path: '/app/proof', label: '0G Layer', icon: Database },
  { path: '/app/settings', label: 'Settings', icon: Settings }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pt-20">
      <div className="flex">
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-72 fixed left-0 top-20 bottom-0 p-6"
          style={{
            borderRight: '1px solid rgba(255, 129, 32, 0.25)',
            background: 'rgba(11, 7, 5, 0.7)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <nav className="space-y-2">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={item.path}
                    className="flex items-center gap-3 px-5 py-3.5 rounded-lg transition-all group relative overflow-hidden"
                    style={{
                      background: isActive ? 'rgba(255, 90, 18, 0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #FF5A12' : '3px solid transparent',
                      color: isActive ? '#FFB331' : 'rgba(255, 246, 232, 0.7)'
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'rgba(255, 90, 18, 0.15)',
                          border: '1px solid rgba(255, 129, 32, 0.3)'
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium relative z-10">{item.label}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="absolute bottom-28 left-6 right-6"
          >
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg w-full transition-all group"
              style={{
                background: 'rgba(255, 246, 232, 0.05)',
                border: '1px solid rgba(255, 129, 32, 0.2)',
                color: 'rgba(255, 246, 232, 0.6)'
              }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-medium">Back to Home</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute bottom-6 left-6 right-6 p-5 rounded-xl"
            style={{
              background: 'rgba(16, 8, 5, 0.8)',
              border: '1px solid rgba(255, 129, 32, 0.25)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#43D483', boxShadow: '0 0 8px rgba(67, 212, 131, 0.8)' }}
              />
              <span className="text-xs font-semibold" style={{ color: '#43D483' }}>0G Connected</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 246, 232, 0.6)' }}>
              All proof verified on mainnet
            </p>
          </motion.div>
        </motion.aside>

        <main className="flex-1 ml-72 p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
