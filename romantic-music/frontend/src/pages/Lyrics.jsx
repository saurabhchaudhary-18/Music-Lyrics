import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Music2, RotateCcw } from 'lucide-react';
import LyricsDisplay from '../components/LyricsDisplay.jsx';
import MusicPlayer from '../components/MusicPlayer.jsx';
import LoadingAnimation from '../components/LoadingAnimation.jsx';
import HeartBurst from '../components/HeartBurst.jsx';
import { AUDIO_SRC, LYRICS_OFFSET_SECONDS, SONG_TITLE, lyrics } from '../data/lyrics.js';
import { findActiveIndex, validateLyrics } from '../utils/lyricsSync.js';

const ENDING_MESSAGE = 'Some feelings are better expressed through music. ❤️';

export default function Lyrics() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const lastVolumeRef = useRef(0.8);

  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ended, setEnded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Single source of truth for sync: audio.currentTime. Called from the animation-frame loop
  // while playing, and from seek/timeupdate events so paused seeks update the lyric too.
  const syncLyrics = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const index = findActiveIndex(lyrics, audio.currentTime + LYRICS_OFFSET_SECONDS);
    setActiveIndex((prev) => (prev === index ? prev : index));
  }, []);

  // Dev-time lyric data check.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (lyrics.length === 0) {
      console.info('[lyrics] src/data/lyricsData.json is empty: add timed lines calibrated to your audio file.');
      return;
    }
    validateLyrics(lyrics).forEach((problem) => console.warn(`[lyrics] ${problem}`));
  }, []);

  // Try to start immediately; browsers may block this if there was no recent user gesture.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = lastVolumeRef.current;
    audio.play().catch((err) => {
      if (err?.name === 'NotAllowedError') setAutoplayBlocked(true);
      // Other errors (missing/unsupported file) are surfaced by the <audio> onError handler.
    });

    return () => audio.pause();
  }, []);

  // Smooth, frame-accurate lyric tracking while playing.
  useEffect(() => {
    if (!isPlaying) return undefined;
    let frame = requestAnimationFrame(function tick() {
      syncLyrics();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, syncLyrics]);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback(
    (seconds) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = seconds;
      setCurrentTime(seconds);
      setEnded(false);
      syncLyrics();
    },
    [syncLyrics],
  );

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setActiveIndex(-1);
    setEnded(false);
    audio.play().catch(() => {});
  }, []);

  const handleVolumeChange = useCallback((value) => {
    const audio = audioRef.current;
    if (audio) audio.volume = value;
    if (value > 0) lastVolumeRef.current = value;
    setVolume(value);
  }, []);

  const handleToggleMute = useCallback(() => {
    handleVolumeChange(volume === 0 ? lastVolumeRef.current || 0.8 : 0);
  }, [handleVolumeChange, volume]);

  const handleRetry = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus('loading');
    audio.load();
    audio.play().catch(() => {});
  };

  const handleBack = () => {
    audioRef.current?.pause();
    navigate('/');
  };

  const handleAudioError = () => {
    console.error(`[audio] Could not load "${AUDIO_SRC}". Check that the file exists in public/audio.`);
    setStatus('error');
    setIsPlaying(false);
  };

  return (
    <main className="lyrics-page">
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="auto"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onCanPlay={() => setStatus('ready')}
        onPlay={() => {
          setIsPlaying(true);
          setEnded(false);
          setAutoplayBlocked(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          syncLyrics();
        }}
        onSeeking={syncLyrics}
        onSeeked={syncLyrics}
        onEnded={() => {
          setIsPlaying(false);
          setEnded(true);
        }}
        onError={handleAudioError}
      />

      <header className="lyrics-header">
        <button type="button" className="icon-btn" onClick={handleBack} aria-label="Back to start">
          <ArrowLeft size={20} />
        </button>
        <div className="lyrics-header__title">
          <Music2 size={16} aria-hidden="true" />
          <h1>{SONG_TITLE}</h1>
        </div>
        <span className="lyrics-header__spacer" aria-hidden="true" />
      </header>

      <section className="lyrics-panel">
        <LyricsDisplay lines={lyrics} activeIndex={activeIndex} onSeekLine={handleSeek} />

        <AnimatePresence>
          {status === 'loading' && (
            <motion.div
              key="loading"
              className="panel-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingAnimation label="Tuning the song…" />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              className="panel-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="alert"
            >
              <p className="panel-overlay__title">The song couldn't be loaded 🥺</p>
              <p className="panel-overlay__text">Please check your connection and try again.</p>
              <button type="button" className="btn btn--primary" onClick={handleRetry}>
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <MusicPlayer
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        disabled={status === 'error'}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onReplay={handleReplay}
      />

      <p className="player-hint" aria-live="polite">
        {autoplayBlocked && status !== 'error' ? 'Tap play to start the song ❤️' : ' '}
      </p>

      <AnimatePresence>
        {ended && (
          <motion.div
            key="ending"
            className="ending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="ending__content">
              <HeartBurst count={22} radius={190} />
              <motion.p
                className="ending__message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {ENDING_MESSAGE}
              </motion.p>
              <motion.div
                className="ending__actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.8 }}
              >
                <button type="button" className="btn btn--primary" onClick={handleReplay}>
                  <RotateCcw size={18} aria-hidden="true" /> Listen again
                </button>
                <button type="button" className="btn btn--soft" onClick={handleBack}>
                  Back to start
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
