import timedLyrics from './lyricsData.json';

/**
 * ---------------------------------------------------------------------------
 *  SONG CONFIGURATION
 * ---------------------------------------------------------------------------
 *  1. Put your licensed audio file at:  public/audio/tu-pyar-hai-kisi-aur-ka.mp3
 *     (or change AUDIO_FILE below). Only use audio you have the right to use.
 *
 *  2. Fill in the timed lyrics in  src/data/lyricsData.json  as:
 *       [ { "time": 12.4, "text": "..." }, { "time": 17.9, "text": "..." } ]
 *     `time` is in seconds from the start of the audio file and MUST be measured
 *     against that exact file (see README, "Calibrating lyrics").
 *     Shortcut: if you have an .lrc file you are licensed to use, run
 *       npm run lyrics:from-lrc -- path/to/song.lrc
 *
 *  3. If every line feels consistently early/late by the same amount, nudge
 *     LYRICS_OFFSET_SECONDS instead of editing every timestamp.
 *     Positive = lyrics appear earlier, negative = later.
 * ---------------------------------------------------------------------------
 */

export const SONG_TITLE = 'Tu Pyar Hai Kisi Aur Ka';

const AUDIO_FILE = 'tu-pyar-hai-kisi-aur-ka.mp3';
export const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/${AUDIO_FILE}`;

export const LYRICS_OFFSET_SECONDS = 0;

export const lyrics = timedLyrics;
