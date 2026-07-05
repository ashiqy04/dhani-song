# A Song Crafted For You

A little "personalized song reveal" page — dark, candlelit background, glowing serif name, and a play button — inspired by the reference screenshot.

## Run it

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Customize the name

Change the default in `src/main.js` (`recipientName`), or pass it via URL:

```
http://localhost:5173/?for=YourName
```

## Add your real song

Drop an audio file at:

```
public/song.mp3
```

The page automatically plays that file. If it's missing, the page falls back to a short generated melody (via the Web Audio API) so the demo works out of the box — swap in your own track any time.

## Build for production

```bash
npm run build
```

Output goes to `dist/`.
