import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

/**
 * One-shot burst of hearts radiating from the centre of the nearest positioned parent.
 * Remount it (change its `key`) to play it again.
 */
export default function HeartBurst({ count = 16, radius = 150, size = 22 }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
        const distance = radius * (0.6 + Math.random() * 0.6);
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - radius * 0.25,
          scale: 0.6 + Math.random() * 0.8,
          delay: Math.random() * 0.15,
          rotate: (Math.random() - 0.5) * 60,
        };
      }),
    [count, radius],
  );

  return (
    <div className="heart-burst" aria-hidden="true">
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="burst-heart"
          style={{ marginLeft: -size / 2, marginTop: -size / 2 }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{
            x: h.x,
            y: h.y,
            opacity: [0, 1, 1, 0],
            scale: h.scale,
            rotate: h.rotate,
          }}
          transition={{ duration: 1.4, delay: h.delay, ease: 'easeOut' }}
        >
          <Heart size={size} fill="currentColor" strokeWidth={0} />
        </motion.span>
      ))}
    </div>
  );
}
