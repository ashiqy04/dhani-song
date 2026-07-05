import "./style.css";

// The name on the card. Override at build time or via ?for=Name in the URL.
const params = new URLSearchParams(window.location.search);
const recipientName = params.get("for") || "Dhanish";

// Lyrics, evenly paced across the track's duration by default.
// If you want tighter timing, replace `time: null` on any line with a
// specific second count (e.g. `time: 12.5`) and it will be used instead
// of the even split.
const lyrics = [
  { text: "When we met for the first time, the world looked brighter suddenly,", time: null },
  { text: "Your beautiful smile and expressive eyes mesmerized me completely.", time: null },
  { text: "Gradually, you filled my life with the colours of love,", time: null },
  { text: "Baby, you are my greatest gift from heaven above.", time: null },
  { text: "You've taught me empathy, thank you for making me a better person every day", time: null },
  { text: "No matter where life takes us, my biggest wish is to see you happy in every way.", time: null },
  { text: "I promise through every season, every sunrise we will see,", time: null },
  { text: "My ultimate joy is knowing you'll always find your home in me.", time: null },
  { text: "Dhani, you're the most soulful melody my heart will ever sing,", time: null },
  { text: "You're my ray of hope, my calm in chaos, always keep smiling.", time: null },
  { text: "Those tight embraces, playful bites upon my shoulder stay,", time: null },
  { text: "They're little pieces of forever I treasure every single day.", time: null },
  { text: "I'll keep you safe, I'll be your shield, come what may", time: null },
  { text: "In every birth, we'll be together, I just hope and pray.", time: null },
  { text: "You're my heartbeat, you're my soulmate, my sweetest dream come true,", time: null },
  { text: "My umbrella in rain & my medicine in pain, my kind lady, I will always choose you.", time: null },
];

const RING_CIRCUMFERENCE = 226;
const EMBER_COUNT = 12;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function iconPlay() {
  return `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.8v12.4c0 .7.77 1.13 1.36.76l9.9-6.2c.56-.35.56-1.17 0-1.52l-9.9-6.2C3.77.67 3 1.1 3 1.8z"/></svg>`;
}

function iconPause() {
  return `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h3v12H3V2zm7 0h3v12h-3V2z"/></svg>`;
}

function iconFlame() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M12 2.5c1 3 4.2 4.5 4.2 9a4.2 4.2 0 0 1-8.4 0c0-1.6.7-2.5 1.4-3.4-.15 1.3.4 2 .95 2.35C9.4 8.7 8.6 6.4 12 2.5z"/></svg>`;
}

function emberStyle() {
  const left = Math.random() * 100;
  const size = 2 + Math.random() * 2.5;
  const dur = 7 + Math.random() * 6;
  const delay = Math.random() * 10;
  const drift = (Math.random() - 0.5) * 60;
  return `left:${left}%; --size:${size.toFixed(1)}px; --dur:${dur.toFixed(1)}s; --delay:${delay.toFixed(1)}s; --drift:${drift.toFixed(0)}px;`;
}

document.querySelector("#app").innerHTML = `
  <div class="stage" id="stage">
    <div class="columns"></div>
    <div class="embers">
      ${Array.from({ length: EMBER_COUNT }, () => `<span class="ember" style="${emberStyle()}"></span>`).join("")}
    </div>
    <div class="grain"></div>
    <div class="frame"><span class="corner-tl"></span><span class="corner-br"></span></div>

    <div class="content">
      <div class="glyph">${iconFlame()}</div>
      <p class="eyebrow">A song crafted for</p>
      <h1 class="name">${escapeHtml(recipientName)}</h1>
      <div class="divider"><span class="line"></span><span class="dot"></span><span class="line right"></span></div>
    </div>

    <div class="lyrics-wrap" id="lyricsWrap" aria-hidden="true">
      <div class="lyrics-fade lyrics-fade-top"></div>
      <div class="lyrics" id="lyrics">
        ${lyrics
          .map(
            (l, i) =>
              `<p class="lyric-line" data-index="${i}">${escapeHtml(l.text)}</p>`
          )
          .join("")}
      </div>
      <div class="lyrics-fade lyrics-fade-bottom"></div>
    </div>

    <div class="controls">
      <div class="play-wrap">
        <span class="pulse-ring"></span>
        <span class="pulse-ring ring-2"></span>
        <svg class="progress-ring" viewBox="0 0 84 84">
          <circle class="track" cx="42" cy="42" r="36"></circle>
          <circle class="fill" id="ringFill" cx="42" cy="42" r="36"></circle>
        </svg>
        <button class="play-btn" id="playBtn" aria-label="Play song">
          <span class="icon" id="playIcon">${iconPlay()}</span>
        </button>
      </div>
      <div class="label-row">
        <span class="btn-label" id="btnLabel">Play Song</span>
        <span class="time" id="hint">00:00</span>
      </div>
    </div>
  </div>
`;

const stage = document.getElementById("stage");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const btnLabel = document.getElementById("btnLabel");
const ringFill = document.getElementById("ringFill");
const hint = document.getElementById("hint");
const lyricsEl = document.getElementById("lyrics");
const lineEls = Array.from(document.querySelectorAll(".lyric-line"));
let activeIndex = -1;

ringFill.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
ringFill.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

// Resolve each line's start time: explicit `time` wins, otherwise the
// lines are spread evenly across the track's duration once it's known.
let lineStarts = lyrics.map((_, i) => i * 4); // placeholder until duration loads

function computeLineStarts(duration) {
  if (!duration || !isFinite(duration)) return;
  lineStarts = lyrics.map((l, i) => {
    if (l.time != null) return l.time;
    return (duration / lyrics.length) * i;
  });
}

function updateActiveLine(current) {
  let idx = 0;
  for (let i = 0; i < lineStarts.length; i++) {
    if (current >= lineStarts[i]) idx = i;
    else break;
  }
  if (idx === activeIndex) return;
  activeIndex = idx;
  lineEls.forEach((el, i) => {
    el.classList.toggle("active", i === idx);
    el.classList.toggle("past", i < idx);
  });
  const activeEl = lineEls[idx];
  if (activeEl && lyricsEl) {
    const targetTop =
      activeEl.offsetTop - lyricsEl.clientHeight / 2 + activeEl.clientHeight / 2;
    lyricsEl.scrollTo({ top: targetTop, behavior: "smooth" });
  }
}

// --- Audio setup -----------------------------------------------------
// Drop your own track at /public/song.mp3 and it will play automatically.
// If it isn't found, a short generated melody plays instead so the demo
// always works out of the box.
const audio = new Audio("/song.mp3");
audio.preload = "auto";
let useFallback = false;
let fallback = null;

audio.addEventListener("error", () => {
  useFallback = true;
});

audio.addEventListener("loadedmetadata", () => {
  if (!useFallback) computeLineStarts(audio.duration);
});

function formatTime(sec) {
  if (!isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function setPlayingUI(isPlaying) {
  stage.classList.toggle("playing", isPlaying);
  playBtn.classList.toggle("is-playing", isPlaying);
  playIcon.innerHTML = isPlaying ? iconPause() : iconPlay();
  btnLabel.textContent = isPlaying ? "Playing" : "Play Song";
  playBtn.setAttribute("aria-label", isPlaying ? "Pause song" : "Play song");
}

// --- Fallback synthesized melody (Web Audio API) ----------------------
// A gentle looping progression so the page still "plays a song"
// even without a real audio file wired up.
function createFallbackPlayer() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const notesHz = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
    E5: 659.25, G5: 783.99,
  };

  const melody = ["E4", "G4", "A4", "G4", "E4", "C4", "D4", "E4"];
  const chord = ["C4", "E4", "G4"];
  const noteLen = 0.55;
  const loopLen = melody.length * noteLen;
  let loopHandle = null;
  let startedAt = 0;

  function playNote(freq, time, dur, gainPeak, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(gainPeak, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  function scheduleLoop(startTime) {
    chord.forEach((n) => playNote(notesHz[n], startTime, loopLen * 0.98, 0.05, "sine"));
    melody.forEach((n, i) => {
      playNote(notesHz[n], startTime + i * noteLen, noteLen * 0.9, 0.09, "triangle");
    });
  }

  return {
    play() {
      if (ctx.state === "suspended") ctx.resume();
      startedAt = ctx.currentTime;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4);

      scheduleLoop(startedAt);
      loopHandle = setInterval(() => {
        scheduleLoop(ctx.currentTime + 0.02);
      }, loopLen * 1000);
    },
    pause() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      if (loopHandle) clearInterval(loopHandle);
    },
    getProgress() {
      const elapsed = (ctx.currentTime - startedAt) % loopLen;
      return { current: elapsed, duration: loopLen };
    },
  };
}

let playing = false;
let rafId = null;

function tick() {
  if (!playing) return;
  let current = 0;
  let duration = 0;
  if (useFallback && fallback) {
    const p = fallback.getProgress();
    current = p.current;
    duration = p.duration;
  } else {
    current = audio.currentTime;
    duration = audio.duration || 0;
  }
  const pct = duration ? Math.min(1, current / duration) : 0;
  ringFill.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - pct)}`;
  hint.textContent = formatTime(current);
  // updateActiveLine(current);
  rafId = requestAnimationFrame(tick);
}

playBtn.addEventListener("click", async () => {
  if (!playing) {
    if (!useFallback) {
      try {
        await audio.play();
      } catch (e) {
        useFallback = true;
      }
    }
    if (useFallback) {
      if (!fallback) {
        fallback = createFallbackPlayer();
        computeLineStarts(fallback.getProgress().duration);
      }
      fallback.play();
    }
    playing = true;
    setPlayingUI(true);
    tick();
  } else {
    if (useFallback && fallback) {
      fallback.pause();
    } else {
      audio.pause();
    }
    playing = false;
    setPlayingUI(false);
    if (rafId) cancelAnimationFrame(rafId);
  }
});

audio.addEventListener("ended", () => {
  playing = false;
  setPlayingUI(false);
  ringFill.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
  hint.textContent = "00:00";
  // activeIndex = -1;
  // lineEls.forEach((el) => el.classList.remove("active", "past"));
  // lyricsEl.scrollTo({ top: 0, behavior: "smooth" });
  lyricsEl.scrollTo({ top: 0, behavior: "smooth" });
  if (rafId) cancelAnimationFrame(rafId);
});
