import { memo, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STATES = {
  active: { opacity: 1, scale: 1.04, y: 0 },
  past: { opacity: 0.38, scale: 0.97, y: 0 },
  upcoming: { opacity: 0.62, scale: 0.97, y: 0 },
};

function stateFor(index, activeIndex) {
  if (index === activeIndex) return 'active';
  return index < activeIndex ? 'past' : 'upcoming';
}

/**
 * Renders timed lyrics, highlights the active line, fades past/upcoming lines
 * and keeps the active line centred in the panel.
 */
function LyricsDisplay({ lines, activeIndex, onSeekLine }) {
  const scrollRef = useRef(null);
  const lineRefs = useRef([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const container = scrollRef.current;
    const target = lineRefs.current[Math.max(activeIndex, 0)];
    if (!container || !target) return;

    const top = target.offsetTop - container.clientHeight / 2 + target.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeIndex, reduceMotion]);

  if (lines.length === 0) {
    return (
      <div className="lyrics-empty">
        <p>♪ Let the music speak ♪</p>
      </div>
    );
  }

  return (
    <div className="lyrics-scroll" ref={scrollRef} aria-label="Song lyrics">
      {lines.map((line, i) => {
        const state = stateFor(i, activeIndex);
        return (
          <motion.p
            key={`${line.time}-${i}`}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`lyric lyric--${state}`}
            initial={false}
            animate={STATES[state]}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            aria-current={state === 'active' ? 'true' : undefined}
            onClick={() => onSeekLine?.(line.time)}
          >
            {line.text}
          </motion.p>
        );
      })}
    </div>
  );
}

export default memo(LyricsDisplay);
