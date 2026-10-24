import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeCard from '../components/WelcomeCard.jsx';
import Toast from '../components/Toast.jsx';
import { DEFAULT_COOLDOWN_SECONDS, notifyAngry } from '../services/interactionService.js';

const NAVIGATE_DELAY_MS = 1900;
const TOAST_DURATION_MS = 4500;

export default function Home() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState('idle'); // 'idle' | 'happy' | 'angry'
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [toast, setToast] = useState(null);

  const navTimer = useRef(null);
  const toastTimer = useRef(null);
  const cooldownTimer = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(navTimer.current);
      clearTimeout(toastTimer.current);
      clearTimeout(cooldownTimer.current);
    },
    [],
  );

  const showToast = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), type, text });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const startCooldown = useCallback((seconds) => {
    clearTimeout(cooldownTimer.current);
    setCooldownActive(true);
    cooldownTimer.current = setTimeout(() => setCooldownActive(false), seconds * 1000);
  }, []);

  const handleFine = () => {
    if (phase === 'happy') return;
    setPhase('happy');
    setMessage('Aww... Finally! ❤️');
    // Navigating from a click keeps the user gesture "fresh enough" for the audio element
    // on the next page to start playing in most browsers; the Lyrics page also handles
    // the blocked case with a visible Play prompt.
    navTimer.current = setTimeout(() => navigate('/lyrics'), NAVIGATE_DELAY_MS);
  };

  const handleAngry = async () => {
    if (busy || cooldownActive || phase === 'happy') return;

    setPhase('angry');
    setMessage('Achha ji, abhi bhi gussa ho? 🥺');
    setBusy(true);

    try {
      await notifyAngry();
      showToast('success', 'Notification sent successfully! ❤️');
      startCooldown(DEFAULT_COOLDOWN_SECONDS);
    } catch (err) {
      if (err.status === 429) {
        showToast('info', err.message);
        startCooldown(err.retryAfterSeconds ?? DEFAULT_COOLDOWN_SECONDS);
      } else {
        showToast('error', err.message || "Couldn't send the notification. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page page--home">
      <Toast toast={toast} onClose={dismissToast} />
      <WelcomeCard
        phase={phase}
        message={message}
        busy={busy}
        angryDisabled={cooldownActive}
        onFine={handleFine}
        onAngry={handleAngry}
      />
    </main>
  );
}
