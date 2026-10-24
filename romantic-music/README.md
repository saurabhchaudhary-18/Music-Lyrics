# Tu Pyar Hai Kisi Aur Ka ❤️

A romantic, pink-themed interactive site: a welcome card with two choices, an email alert when
"Me gussa hoo" is clicked, and a synced lyrics + music player when "Ok fine...." is clicked.

```
romantic-music/
├── backend/    Spring Boot 3 (Java 17+), Maven: REST API + email
└── frontend/   React 18 + Vite, Framer Motion, Lucide icons
```

## Two things you must add yourself

1. **The audio file** → `frontend/public/audio/tu-pyar-hai-kisi-aur-ka.mp3`
   Use audio you own or are licensed to use.
2. **The timed lyrics** → `frontend/src/data/lyricsData.json`
   Shipped empty on purpose: timestamps must be measured against your exact audio file, and
   the lyrics are copyrighted text, so they are not included here. Until you add them the page
   shows "♪ Let the music speak ♪" and the audio still plays.

### Calibrating lyrics

Format (`time` = seconds from the start of *your* file):

```json
[
  { "time": 12.4, "text": "first line" },
  { "time": 17.9, "text": "second line" }
]
```

- **Have a licensed `.lrc` file?** `cd frontend && npm run lyrics:from-lrc -- path/to/song.lrc`
- **Otherwise** play the file in any audio editor/player, note each line's start time, and type it in.
- Consistently early/late by the same amount? Change `LYRICS_OFFSET_SECONDS` in `src/data/lyrics.js`.
- `npm run dev` logs a warning in the browser console if timestamps are out of order.
- Different edits/masters of a song drift, so always check against the file you actually ship.

Sync works by reading `audio.currentTime` (every animation frame while playing, and on
`seeking`/`seeked`/`timeupdate`), so it stays correct through pause, resume and seeking.
Clicking a lyric line seeks to it.

## Run locally

**Backend** (needs Java 17+ and Maven):

```bash
cd backend
export SMTP_USERNAME="you@gmail.com"
export SMTP_PASSWORD="your-gmail-app-password"   # Google Account → Security → App passwords
export NOTIFY_TO="you@gmail.com"                 # where the alert is delivered
mvn spring-boot:run                              # http://localhost:8080
```

**Frontend** (needs Node 18+):

```bash
cd frontend
npm install
npm run dev                                      # http://localhost:5173 (proxies /api → :8080)
```

Quick API check:

```bash
curl -X POST http://localhost:8080/api/interaction/angry -H 'Content-Type: application/json' -d '{}'
```

## Backend configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` | Mail server (STARTTLS) |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | – | SMTP login (use an app password, never your real one) |
| `NOTIFY_TO` | – | Recipient of the alert (**required**) |
| `NOTIFY_FROM` | `SMTP_USERNAME` | Sender address |
| `APP_TIMEZONE` | `Asia/Kolkata` | Timezone shown in the email |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origins |
| `COOLDOWN_SECONDS` | `60` | One email per visitor per window |
| `MAX_EMAILS_PER_HOUR` | `20` | Global ceiling across all visitors |
| `FORWARD_HEADERS_STRATEGY` | `none` | Set to `framework` behind a reverse proxy so the real client IP is used |

Credentials live only in the backend's environment. The frontend contains no secrets.

## API

`POST /api/interaction/angry` → `200 {"success":true,"message":"Notification sent successfully!"}`

| Status | Meaning |
|---|---|
| 400 | Invalid body |
| 415 | Not JSON |
| 429 | Cooldown/ceiling hit (`Retry-After` header and `retryAfterSeconds` in body) |
| 502 | SMTP failure (a failed send does not consume the visitor's cooldown) |

## Tests

```bash
cd backend && mvn test     # rate-limit logic + controller/error-mapping tests
```

## Deploy

- **Backend:** `backend/Dockerfile` builds a runnable image (`docker build -t romantic-music backend`).
  Set the env vars above on your host; set `CORS_ALLOWED_ORIGINS` to your frontend's URL.
- **Frontend:** `cd frontend && VITE_API_BASE_URL=https://your-backend npm run build`, then host
  `frontend/dist` on any static host. Add an SPA fallback (all paths → `index.html`) so
  `/lyrics` works on refresh (Netlify `_redirects`: `/* /index.html 200`; Vercel rewrites).
- Rate-limit state is in memory, which is right for a single instance. Run more than one
  backend instance and you'd want it in a shared store such as Redis.
- No database is used: nothing here needs stored history, so MySQL was deliberately left out.

## Notes on behaviour

- **Autoplay:** "Ok fine...." is a user click, so the song usually starts on the next page. If the
  browser blocks it anyway, a "Tap play to start the song" hint appears.
- **Missing/failed audio:** the page shows a friendly error with a retry button.
- **Reduced motion:** users with that OS setting get no boot animation, typewriter or floating
  background.
- **Ending screen:** appears when the song finishes, with replay and back options.
