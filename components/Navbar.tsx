"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
        background: scrolled ? 'rgba(5, 4, 3, 0.9)' : 'rgba(5, 4, 3, 0.7)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255, 129, 32, 0.3)' : 'rgba(255, 129, 32, 0.15)'}`,
        boxShadow: scrolled ? '0 8px 32px rgba(0, 0, 0, 0.3)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 flex items-center justify-center"
          >
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FFF7E8', stopOpacity: 1 }} />
                  <stop offset="35%" style={{ stopColor: '#FFE15B', stopOpacity: 1 }} />
                  <stop offset="65%" style={{ stopColor: '#FFB331', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#EE93A8', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 8 32 Q 12 8, 20 20 Q 28 8, 32 32 L 28 32 Q 24 16, 20 24 Q 16 16, 12 32 Z"
                fill="url(#logo-grad)"
                filter="url(#glow)"
                opacity="0.95"
              />
              <circle cx="20" cy="20" r="2.5" fill="#FFE15B" filter="url(#glow)" />
            </svg>
          </motion.div>
          <span className="text-xl tracking-tight font-semibold" style={{ color: '#FFF7E8' }}>
            AgiCards
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {['Product', '0G Proof', 'Flow'].map((item, idx) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.4 }}
              className="text-sm font-medium hover:opacity-100 transition-all relative group"
              style={{ color: 'rgba(255, 246, 232, 0.85)' }}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{ background: 'linear-gradient(90deg, #FFB331, #FF5A12)' }}
              />
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Link
            href="/app"
            className="relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all overflow-hidden group inline-block"
            style={{
              background: 'linear-gradient(135deg, #FFE45D 0%, #FFB331 45%, #FF5A12 100%)',
              color: '#050403',
              boxShadow: '0 4px 16px rgba(255, 90, 18, 0.4)'
            }}
          >
            <span className="relative z-10">Launch App</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  );
}
