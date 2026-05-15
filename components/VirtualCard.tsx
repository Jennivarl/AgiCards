"use client";

import { motion } from 'motion/react';
import { useState } from 'react';

interface VirtualCardProps {
  variant?: 'default' | 'gold' | 'pink';
  delay?: number;
  index?: number;
}

export function VirtualCard({ variant = 'default', delay = 0, index = 0 }: VirtualCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const gradients = {
    default: 'linear-gradient(135deg, #100805 0%, #FF5A12 50%, #FFB331 100%)',
    gold: 'linear-gradient(135deg, #100805 0%, #FFB331 50%, #FFE15B 100%)',
    pink: 'linear-gradient(135deg, #100805 0%, #EE93A8 50%, #FFB331 100%)'
  };

  const rotations = [-8, -3, 2];
  const offsetY = index * 20;
  const offsetX = index * 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateZ: rotations[index] }}
      animate={{ opacity: 1, y: 0, rotateZ: rotations[index] }}
      transition={{ duration: 0.8, delay: delay + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -10,
        rotateZ: 0,
        scale: 1.05,
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="absolute cursor-pointer"
      style={{
        top: `${offsetY}px`,
        left: `${offsetX}px`,
        zIndex: index
      }}
    >
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: '360px',
          height: '226px',
          background: gradients[variant],
          boxShadow: `
            0 25px 80px rgba(255, 90, 18, 0.4),
            0 10px 40px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(0, 0, 0, 0.5)
          `,
          border: '1px solid rgba(255, 129, 32, 0.4)'
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ x: isHovered ? 0 : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)',
            transform: 'rotate(45deg) scale(2)',
            transformOrigin: 'center'
          }}
        />

        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 right-0 h-1/3"
            style={{ background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)' }}
          />
        </div>

        <div className="relative z-10 p-7 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-10 rounded flex items-center justify-center shadow-lg"
                style={{ background: 'rgba(255, 179, 49, 0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 179, 49, 0.5)' }}
              >
                <div className="w-8 h-6 rounded-sm"
                  style={{ background: 'linear-gradient(135deg, #FFE15B, #FFB331, #FF5A12)' }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium opacity-80 mb-1" style={{ color: '#FFF7E8' }}>0G proof-ready</div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-2 h-2 rounded-full ml-auto"
                style={{ background: '#43D483', boxShadow: '0 0 8px rgba(67, 212, 131, 0.8)' }}
              />
            </div>
          </div>

          <div>
            <div className="font-mono text-xl tracking-[0.3em] mb-5 drop-shadow-lg" style={{ color: '#FFF7E8' }}>
              **** **** **** 1661
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs opacity-70 mb-1.5 uppercase tracking-wider" style={{ color: '#FFF7E8' }}>
                  Virtual Agent Card
                </div>
                <div className="text-xs opacity-60" style={{ color: '#FFF7E8' }}>Daily cap $--</div>
              </div>
              <div
                className="text-xs font-semibold px-3 py-1.5 rounded"
                style={{
                  background: 'rgba(255, 179, 49, 0.25)',
                  color: '#FFB331',
                  border: '1px solid rgba(255, 179, 49, 0.4)',
                  boxShadow: '0 2px 8px rgba(255, 179, 49, 0.3)'
                }}
              >
                ACTIVE
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)' }}
        />
      </div>
    </motion.div>
  );
}
