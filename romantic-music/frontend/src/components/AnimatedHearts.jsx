import { memo, useMemo } from 'react';
import { Heart } from 'lucide-react';

// Small deterministic PRNG so the layout is stable across re-renders.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEART_COLORS = ['#FF69B4', '#FFB6C1', '#DB7093', '#FF8FC7'];

/**
 * Ambient background: slow floating hearts and twinkling particles.
 * Pure CSS animation on transform/opacity, and memoised so it never re-renders
 * when the pages above it change state.
 */
function AnimatedHearts({ heartCount = 14, particleCount = 22 }) {
  const { hearts, particles } = useMemo(() => {
    const rand = mulberry32(20260214);
    return {
      hearts: Array.from({ length: heartCount }, (_, i) => ({
        id: i,
        x: `${Math.round(rand() * 100)}%`,
        size: Math.round(14 + rand() * 22),
        duration: `${(14 + rand() * 14).toFixed(1)}s`,
        delay: `-${(rand() * 20).toFixed(1)}s`,
        sway: `${Math.round((rand() - 0.5) * 80)}px`,
        color: HEART_COLORS[i % HEART_COLORS.length],
      })),
      particles: Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: `${Math.round(rand() * 100)}%`,
        y: `${Math.round(rand() * 100)}%`,
        size: `${Math.round(4 + rand() * 8)}px`,
        duration: `${(4 + rand() * 6).toFixed(1)}s`,
        delay: `-${(rand() * 8).toFixed(1)}s`,
      })),
    };
  }, [heartCount, particleCount]);

  return (
    <div className="ambient" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={`p${p.id}`}
          className="particle"
          style={{ '--x': p.x, '--y': p.y, '--s': p.size, '--dur': p.duration, '--delay': p.delay }}
        />
      ))}
      {hearts.map((h) => (
        <span
          key={`h${h.id}`}
          className="heart"
          style={{
            '--x': h.x,
            '--size': `${h.size}px`,
            '--dur': h.duration,
            '--delay': h.delay,
            '--sway': h.sway,
            '--c': h.color,
          }}
        >
          <Heart size={h.size} fill="currentColor" strokeWidth={0} />
        </span>
      ))}
    </div>
  );
}

export default memo(AnimatedHearts);
