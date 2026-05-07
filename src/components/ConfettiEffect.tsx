// src/components/ConfettiEffect.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;       // vw 起始位置（0-100）
  color: string;
  size: number;     // px
  delay: number;    // ms
  duration: number; // ms
  drift: number;    // px 水平漂移
}

const COLORS = [
  '#FF6B35', // primary orange
  '#22C55E', // success green
  '#FBBF24', // warning yellow
  '#A78BFA', // purple
  '#F472B6', // pink
  '#34D399', // emerald
];

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 6 + 5,
    delay: Math.random() * 400,
    duration: Math.random() * 400 + 900,
    drift: (Math.random() - 0.5) * 120,
  }));
}

interface ConfettiEffectProps {
  active: boolean;
}

export default function ConfettiEffect({ active }: ConfettiEffectProps) {
  return (
    <AnimatePresence>
      {active && <ConfettiBurst key="confetti-burst" />}
    </AnimatePresence>
  );
}

function ConfettiBurst() {
  const [particles] = useState<Particle[]>(() => makeParticles(22));

  return particles.map(p => (
    <motion.div
      key={p.id}
      aria-hidden="true"
      className="fixed pointer-events-none z-40 rounded-full"
      style={{
        left: `${p.x}vw`,
        top: 0,
        width: p.size,
        height: p.size,
        background: p.color,
      }}
      initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
      animate={{ y: '105vh', x: p.drift, opacity: 0, rotate: 360 }}
      transition={{
        duration: p.duration / 1000,
        delay: p.delay / 1000,
        ease: 'easeIn',
      }}
      exit={{}}
    />
  ));
}
