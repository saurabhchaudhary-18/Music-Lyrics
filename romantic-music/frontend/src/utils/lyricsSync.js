/**
 * Returns the index of the lyric line that should be highlighted at `time` seconds:
 * the last line whose timestamp is <= time, or -1 before the first line.
 *
 * Binary search keeps this O(log n), so it is cheap to call every animation frame,
 * and because it depends only on the audio's currentTime it stays correct across
 * pause, resume and seeking in either direction.
 */
export function findActiveIndex(lines, time) {
  let low = 0;
  let high = lines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid].time <= time) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result;
}

/** Dev-time sanity check: timestamps must be numbers in ascending order. */
export function validateLyrics(lines) {
  const problems = [];
  lines.forEach((line, i) => {
    if (typeof line.time !== 'number' || Number.isNaN(line.time) || line.time < 0) {
      problems.push(`Line ${i}: "time" must be a non-negative number.`);
    }
    if (typeof line.text !== 'string' || !line.text.trim()) {
      problems.push(`Line ${i}: "text" must be a non-empty string.`);
    }
    if (i > 0 && line.time < lines[i - 1].time) {
      problems.push(`Line ${i}: timestamp is earlier than the previous line.`);
    }
  });
  return problems;
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}
