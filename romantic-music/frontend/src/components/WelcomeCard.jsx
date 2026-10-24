import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import HeartBurst from './HeartBurst.jsx';

// Exact message required by the brief.
export const QUOTE = 'Call, Message Sab kar sakti ho 🥺❤️';

// Split into user-perceived characters so emoji are never cut in half mid-typing.
function toGraphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function useTypewriter(text, instant, speedMs = 65) {
  const chars = useMemo(() => toGraphemes(text), [text]);
  const [count, setCount] = useState(instant ? chars.length : 0);

  useEffect(() => {
    if (instant) {
      setCount(chars.length);
      return undefined;
    }
    setCount(0);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c >= chars.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [chars, instant, speedMs]);

  return { text: chars.slice(0, count).join(''), done: count >= chars.length };
}

/**
 * phase: 'idle' | 'happy' | 'angry'
 */
export default function WelcomeCard({ phase, message, busy, angryDisabled, onFine, onAngry }) {
  const reduceMotion = useReducedMotion();
  const { text, done } = useTypewriter(QUOTE, reduceMotion);

  return (
    <motion.section
      className="welcome-card"
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="welcome-card__glow" aria-hidden="true" />

      <div className="mood" aria-hidden="true">
        <AnimatePresence mode="wait">
          {phase === 'angry' ? (
            <motion.span
              key="angry"
              className="mood__emoji"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x: [0, -9, 9, -9, 9, -5, 5, 0],
                rotate: [0, -8, 8, -8, 8, -4, 4, 0],
              }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.7 }}
            >
              😠
            </motion.span>
          ) : (
            <motion.span
              key="heart"
              className="mood__heart"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: phase === 'happy' ? [1, 1.35, 1.1] : [1, 1.12, 1], opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={
                phase === 'happy'
                  ? { duration: 0.6 }
                  : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <Heart size={44} fill="currentColor" strokeWidth={0} />
            </motion.span>
          )}
        </AnimatePresence>
        {phase === 'happy' && <HeartBurst count={20} radius={170} />}
      </div>

      <h1 className="quote" aria-label={QUOTE}>
        <span aria-hidden="true">{text}</span>
        {!done && <span className="quote__caret" aria-hidden="true" />}
      </h1>

      <div className="status-slot" aria-live="polite">
        <AnimatePresence mode="wait">
          {message && (
            <motion.p
              key={message}
              className="status-message"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="actions"
        initial={false}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 14 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ pointerEvents: done ? 'auto' : 'none' }}
        aria-hidden={!done}
      >
        <motion.button
          type="button"
          className="btn btn--primary"
          onClick={onFine}
          disabled={!done || phase === 'happy'}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          Ok fine....
        </motion.button>

        <motion.button
          type="button"
          className="btn btn--soft"
          onClick={onAngry}
          disabled={!done || phase === 'happy' || busy || angryDisabled}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {busy ? (
            <>
              <Loader2 size={18} className="spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            'Me gussa hoo 😏'
          )}
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
