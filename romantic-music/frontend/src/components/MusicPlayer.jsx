import { memo, useState } from 'react';
import { Pause, Play, RotateCcw, Volume1, Volume2, VolumeX } from 'lucide-react';
import HeartBurst from './HeartBurst.jsx';
import { formatTime } from '../utils/lyricsSync.js';

const BAR_COUNT = 20;
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => ({
  id: i,
  duration: `${(0.45 + ((i * 37) % 10) / 12).toFixed(2)}s`,
  delay: `-${(((i * 53) % 10) / 10).toFixed(1)}s`,
}));

function Visualizer({ playing }) {
  return (
    <div className={`visualizer ${playing ? 'is-playing' : ''}`} aria-hidden="true">
      {BARS.map((b) => (
        <span key={b.id} className="visualizer__bar" style={{ '--d': b.duration, '--delay': b.delay }} />
      ))}
    </div>
  );
}

function MusicPlayer({
  isPlaying,
  currentTime,
  duration,
  volume,
  disabled,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onReplay,
}) {
  const [burstKey, setBurstKey] = useState(0);

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handlePlayClick = () => {
    if (!isPlaying) setBurstKey((k) => k + 1); // small heart animation on Play
    onTogglePlay();
  };

  return (
    <div className="player">
      <Visualizer playing={isPlaying} />

      <div className="player__timeline">
        <span className="player__time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="range range--progress"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          style={{ '--progress': `${progress}%` }}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={disabled || !duration}
          aria-label="Seek"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        />
        <span className="player__time">{formatTime(duration)}</span>
      </div>

      <div className="player__controls">
        <button
          type="button"
          className="icon-btn"
          onClick={onReplay}
          disabled={disabled}
          aria-label="Replay from the start"
          title="Replay"
        >
          <RotateCcw size={20} />
        </button>

        <div className="player__play-wrap">
          <button
            type="button"
            className="play-btn"
            onClick={handlePlayClick}
            disabled={disabled}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
          {burstKey > 0 && <HeartBurst key={burstKey} count={9} radius={70} size={16} />}
        </div>

        <div className="volume">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleMute}
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon size={20} />
          </button>
          <input
            type="range"
            className="range range--volume"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            style={{ '--progress': `${volume * 100}%` }}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}

export default memo(MusicPlayer);
