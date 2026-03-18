'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function WishTreeVisual({ wishCount }: { wishCount: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3,
      duration: Math.random() * 3 + 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[340px] md:h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 tree-gradient opacity-20" />
      
      {/* Particles */}
      {(particles ?? []).map((p: Particle) => (
        <motion.div
          key={p?.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [p?.y ?? 0, (p?.y ?? 0) - 30, (p?.y ?? 0) - 60],
          }}
          transition={{
            duration: p?.duration ?? 3,
            delay: p?.delay ?? 0,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          className="absolute rounded-full bg-accent/60"
          style={{
            left: `${p?.x ?? 50}%`,
            top: `${p?.y ?? 50}%`,
            width: p?.size ?? 3,
            height: p?.size ?? 3,
          }}
        />
      ))}

      {/* Tree SVG */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10"
      >
        <svg width="200" height="280" viewBox="0 0 200 280" fill="none" xmlns="https://static.vecteezy.com/system/resources/previews/002/067/816/non_2x/illustration-with-purple-curved-fantasy-tree-isolated-on-white-background-burgundy-or-violet-foliage-and-nightly-fabulous-colors-free-vector.jpg">
          {/* Trunk */}
          <rect x="88" y="200" width="24" height="60" rx="4" fill="#7c3aed" opacity="0.6" />
          <rect x="90" y="200" width="20" height="60" rx="3" fill="#8b5cf6" opacity="0.4" />
          
          {/* Tree Crown - Bottom */}
          <ellipse cx="100" cy="180" rx="80" ry="50" fill="url(#treeGrad1)" opacity="0.8" />
          {/* Tree Crown - Middle */}
          <ellipse cx="100" cy="140" rx="65" ry="45" fill="url(#treeGrad2)" opacity="0.8" />
          {/* Tree Crown - Top */}
          <ellipse cx="100" cy="100" rx="50" ry="40" fill="url(#treeGrad3)" opacity="0.8" />
          {/* Tree Crown - Peak */}
          <ellipse cx="100" cy="70" rx="30" ry="30" fill="url(#treeGrad4)" opacity="0.9" />
          
          {/* Star */}
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '100px 35px' }}
          >
            <polygon points="100,20 104,32 116,32 106,40 110,52 100,44 90,52 94,40 84,32 96,32" fill="#fbbf24" />
          </motion.g>
          
          {/* Glowing Wishes */}
          {Array.from({ length: Math.min(wishCount ?? 0, 12) }).map((_, i: number) => {
            const angle = (i / Math.min(wishCount ?? 1, 12)) * Math.PI * 2;
            const radius = 30 + (i % 3) * 20;
            const cx = 100 + Math.cos(angle) * radius;
            const cy = 130 + Math.sin(angle) * radius * 0.6;
            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={3}
                fill="#fbbf24"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              />
            );
          })}
          
          <defs>
            <radialGradient id="treeGrad1" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="treeGrad2" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="treeGrad3" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.5" />
            </radialGradient>
            <radialGradient id="treeGrad4" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.6" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Wish Counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 text-center"
      >
        <p className="text-3xl font-bold text-accent">{wishCount ?? 0}</p>
        <p className="text-xs text-gray-400">wishes on the tree</p>
      </motion.div>
    </div>
  );
}
