import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import AnimatedHearts from './components/AnimatedHearts.jsx';
import LoadingAnimation from './components/LoadingAnimation.jsx';
import Home from './pages/Home.jsx';
import Lyrics from './pages/Lyrics.jsx';

const BOOT_DURATION_MS = 1300;

function PageTransition({ children }) {
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [booting, setBooting] = useState(!reduceMotion);

  useEffect(() => {
    if (!booting) return undefined;
    const timer = setTimeout(() => setBooting(false), BOOT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [booting]);

  return (
    <div className="app-shell">
      {/* Mounted once so the ambient background never restarts between pages. */}
      <AnimatedHearts />

      <AnimatePresence mode="wait">
        {booting ? (
          <motion.div
            key="boot"
            className="page"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingAnimation label="Something special is loading…" />
          </motion.div>
        ) : (
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/lyrics"
              element={
                <PageTransition>
                  <Lyrics />
                </PageTransition>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </AnimatePresence>
    </div>
  );
}
