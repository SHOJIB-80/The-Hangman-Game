/* =========================================================
   HANGMAN – script.js  (vanilla JavaScript, no libraries)
   1. Config & word bank     5. Hangman drawing + lives
   2. Save / load            6. Guesses, hints, scoring
   3. Sound & music          7. End of game + result dialog
   4. Starting a game        8. Events & init
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   1. CONFIG & WORD BANK
   --------------------------------------------------------- */

// Relative path (works on GitHub Pages). CodePen has no file hosting,
// so there you must use a public URL like "https://example.com/music.mp3".
// If the file is missing the game still works, just without music.
const MUSIC_URL = "assets/music/background.mp3";

// Rules per difficulty. `stages` = body parts drawn per wrong guess (one entry = one wrong guess).
// Easy has 7 lives: 6 body parts, and the 7th wrong guess is the final loss (face appears).
// Hard has 5 lives, so both arms share one stage.
const DIFFICULTY = {
  easy: {
    label: "Easy", lives: 7, minLen: 4, maxLen: 7, hintCost: 15, hintAfter: 0, winBonus: 75,
    stages: [["head"], ["body"], ["larm"], ["rarm"], ["lleg"], ["rleg"], []],
    note: "7 lives · short words · hint any time"
  },
  medium: {
    label: "Medium", lives: 6, minLen: 6, maxLen: 10, hintCost: 25, hintAfter: 2, winBonus: 100,
    stages: [["head"], ["body"], ["larm"], ["rarm"], ["lleg"], ["rleg"]],
    note: "6 lives · medium words · hint after 2 misses"
  },
  hard: {
    label: "Hard", lives: 5, minLen: 9, maxLen: 99, hintCost: 40, hintAfter: 0, winBonus: 150,
    stages: [["head"], ["body"], ["larm", "rarm"], ["lleg"], ["rleg"]],
    note: "5 lives · long words · one costly hint"
  }
};

// Score rules. Total score never goes below 0.
const POINTS = { perLetter: 10, wrong: -5, perLifeLeft: 10 };
const RECENT_LIMIT = 8; // how many recent words to avoid repeating

// Helper keeps the list short. Add words with: w("word", "Category", "hint")
const w = (word, category, hint) => ({ word, category, hint });

const words = [
  // Programming
  w("javascript", "Programming", "A popular language used in web development"),
  w("python", "Programming", "A beginner-friendly language named after a comedy group"),
  w("variable", "Programming", "A named container that stores a value"),
  w("function", "Programming", "A reusable block of code that performs a task"),
  w("algorithm", "Programming", "A step-by-step procedure for solving a problem"),
  w("compiler", "Programming", "Translates source code into machine code"),
  w("database", "Programming", "Organized storage for application data"),
  w("recursion", "Programming", "When a function calls itself"),
  w("framework", "Programming", "A ready-made structure for building apps"),
  w("debugging", "Programming", "The process of finding and fixing bugs"),
  w("array", "Programming", "An ordered list of items"),
  w("boolean", "Programming", "A value that is either true or false"),
  w("syntax", "Programming", "The grammar rules of a language"),
  // Technology
  w("smartphone", "Technology", "A pocket-sized computer you can call with"),
  w("internet", "Technology", "The global network connecting computers"),
  w("bluetooth", "Technology", "Short-range wireless tech named after a king"),
  w("processor", "Technology", "The brain of a computer (CPU)"),
  w("keyboard", "Technology", "You are probably typing on one"),
  w("satellite", "Technology", "Orbits Earth and relays signals"),
  w("robotics", "Technology", "The field of building programmable machines"),
  w("wireless", "Technology", "Without cables"),
  w("firewall", "Technology", "Blocks unwanted network traffic"),
  w("bandwidth", "Technology", "How much data can travel at once"),
  w("laptop", "Technology", "A portable computer"),
  w("hologram", "Technology", "A 3D image made with light"),
  w("drone", "Technology", "An unmanned flying vehicle"),
  // Animals
  w("elephant", "Animals", "The largest land animal, with a trunk"),
  w("giraffe", "Animals", "The tallest animal in the world"),
  w("penguin", "Animals", "A flightless bird that loves the cold"),
  w("dolphin", "Animals", "An intelligent marine mammal"),
  w("kangaroo", "Animals", "Hops around Australia with a pouch"),
  w("cheetah", "Animals", "The fastest land animal"),
  w("octopus", "Animals", "Has eight arms and three hearts"),
  w("butterfly", "Animals", "Starts life as a caterpillar"),
  w("crocodile", "Animals", "A large reptile that lives in rivers"),
  w("flamingo", "Animals", "A pink bird that stands on one leg"),
  w("hedgehog", "Animals", "A small spiky mammal"),
  w("polar bear", "Animals", "White bear of the Arctic"),
  w("chameleon", "Animals", "A lizard that changes color"),
  // Countries
  w("brazil", "Countries", "Hosts the famous Rio Carnival"),
  w("japan", "Countries", "The Land of the Rising Sun"),
  w("canada", "Countries", "Its flag has a maple leaf"),
  w("australia", "Countries", "Both a country and a continent"),
  w("egypt", "Countries", "Home of the pyramids"),
  w("norway", "Countries", "Famous for its fjords"),
  w("argentina", "Countries", "Tango and football legends"),
  w("new zealand", "Countries", "Home of the kiwi bird"),
  w("south korea", "Countries", "Capital city is Seoul"),
  w("switzerland", "Countries", "Known for chocolate, watches and the Alps"),
  w("portugal", "Countries", "Westernmost country of mainland Europe"),
  w("bangladesh", "Countries", "Land of rivers in South Asia"),
  w("mexico", "Countries", "Famous for tacos and ancient Maya ruins"),
  // Movies
  w("titanic", "Movies", "A famous ship, a famous romance"),
  w("inception", "Movies", "A thief enters people's dreams"),
  w("gladiator", "Movies", "A Roman general fights in the arena"),
  w("avatar", "Movies", "Blue aliens on the moon Pandora"),
  w("jaws", "Movies", "A giant shark terrorizes a beach town"),
  w("frozen", "Movies", "Let it go, let it go..."),
  w("casablanca", "Movies", "Classic 1942 romance set in Morocco"),
  w("interstellar", "Movies", "Astronauts travel through a wormhole"),
  w("jurassic park", "Movies", "Dinosaurs brought back to life"),
  w("the matrix", "Movies", "Red pill or blue pill?"),
  w("ratatouille", "Movies", "A rat who wants to be a chef"),
  w("toy story", "Movies", "Toys come alive when humans leave"),
  w("finding nemo", "Movies", "A clownfish searches for his son"),
  // Sports
  w("football", "Sports", "The world's most popular sport"),
  w("basketball", "Sports", "Players shoot hoops"),
  w("cricket", "Sports", "Bats, wickets and overs"),
  w("tennis", "Sports", "Played with rackets over a net"),
  w("swimming", "Sports", "Freestyle, butterfly and backstroke"),
  w("volleyball", "Sports", "Teams hit a ball over a high net"),
  w("badminton", "Sports", "Played with a shuttlecock"),
  w("marathon", "Sports", "A 42-kilometer race"),
  w("gymnastics", "Sports", "Floor routines, vaults and balance beam"),
  w("archery", "Sports", "Bows and arrows aimed at a target"),
  w("wrestling", "Sports", "Grappling combat sport"),
  w("skateboard", "Sports", "Ride a board with four wheels"),
  w("table tennis", "Sports", "Also called ping pong"),
  // Science
  w("gravity", "Science", "The force that keeps you on the ground"),
  w("molecule", "Science", "Two or more atoms bonded together"),
  w("galaxy", "Science", "The Milky Way is one"),
  w("photosynthesis", "Science", "How plants turn sunlight into food"),
  w("electron", "Science", "A negatively charged particle"),
  w("volcano", "Science", "A mountain that erupts lava"),
  w("evolution", "Science", "Darwin's theory of change over time"),
  w("black hole", "Science", "Not even light can escape it"),
  w("telescope", "Science", "Lets you see distant stars"),
  w("chemistry", "Science", "The study of matter and reactions"),
  w("magnetism", "Science", "Force that attracts iron"),
  w("atmosphere", "Science", "The layer of gases around Earth"),
  w("microscope", "Science", "Makes tiny things look big"),
  // Food
  w("pizza", "Food", "Italian flatbread with cheese and toppings"),
  w("spaghetti", "Food", "Long thin pasta"),
  w("chocolate", "Food", "Made from cocoa beans"),
  w("sandwich", "Food", "Filling between two slices of bread"),
  w("pancake", "Food", "Flat breakfast cake served with syrup"),
  w("avocado", "Food", "Green fruit used to make guacamole"),
  w("burrito", "Food", "A tortilla wrapped around a filling"),
  w("ice cream", "Food", "Frozen dessert served in a cone"),
  w("strawberry", "Food", "A red fruit with seeds on the outside"),
  w("dumpling", "Food", "Dough wrapped around a filling"),
  w("biryani", "Food", "Fragrant spiced rice dish"),
  w("croissant", "Food", "Flaky French pastry"),
  w("watermelon", "Food", "Big green summer fruit with red inside")
];

// Clean the bank: lowercase, trim, drop duplicates and entries without letters.
const wordBank = (() => {
  const seen = new Set();
  return words
    .map((x) => ({ word: String(x.word).trim().toLowerCase().replace(/\s+/g, " "), category: x.category, hint: x.hint || "" }))
    .filter((x) => /[a-z]/.test(x.word) && !seen.has(x.word + "|" + x.category) && seen.add(x.word + "|" + x.category));
})();
const categories = ["All", ...new Set(wordBank.map((x) => x.category))];
const lettersIn = (word) => word.replace(/[^a-z]/g, "").length;

/* ---------------------------------------------------------
   2. SAVE / LOAD  (safe against missing or corrupted data)
   --------------------------------------------------------- */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "hangmanSave";
const DEFAULTS = { score: 0, wins: 0, losses: 0, theme: "dark", music: false, sfx: true, volume: 0.6, difficulty: "medium", category: "All" };
let save = { ...DEFAULTS };

function loadSettings() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = {}; }
  if (!raw || typeof raw !== "object") raw = {};
  const count = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  save = {
    score: count(raw.score), wins: count(raw.wins), losses: count(raw.losses),
    theme: raw.theme === "light" ? "light" : "dark",
    music: raw.music === true,
    sfx: raw.sfx !== false,
    volume: Number.isFinite(raw.volume) ? Math.min(1, Math.max(0, raw.volume)) : DEFAULTS.volume,
    difficulty: Object.keys(DIFFICULTY).includes(raw.difficulty) ? raw.difficulty : DEFAULTS.difficulty,
    category: categories.includes(raw.category) ? raw.category : DEFAULTS.category
  };
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) { /* storage blocked: ignore */ }
}

function resetStats() {
  if (!window.confirm("Reset score, wins and losses? This cannot be undone.")) return;
  save.score = save.wins = save.losses = 0;
  saveSettings();
  updateStats();
  setStatus("Stats reset.");
}

/* ---------------------------------------------------------
   Game state
   --------------------------------------------------------- */

const game = {
  id: 0,                   // increases every round (guards old timers)
  word: "", hint: "", category: "",
  guessedLetters: new Set(),
  correctLetters: new Set(),
  wrongLetters: [],
  maxLives: 6,
  stages: [],
  over: false, won: false,
  hintUsed: false,
  roundScore: 0,
  winBonus: 0,
  recentWords: []
};

let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const rule = () => DIFFICULTY[$("difficulty").value];
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   3. SOUND & MUSIC
   --------------------------------------------------------- */

let audioCtx = null, masterGain = null, musicEl = null, musicBroken = false;

function getAudioCtx() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = save.volume;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (e) { return null; }
}

function tone(freq, when, dur, type = "sine", vol = 0.25) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain(), t = ctx.currentTime + when;
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain); gain.connect(masterGain);
  osc.start(t); osc.stop(t + dur);
}

/** Sound effects: click, correct, wrong, win, lose. Never throws. */
function playSound(name) {
  if (!save.sfx) return;
  try {
    switch (name) {
      case "click": tone(520, 0, 0.07, "triangle", 0.15); break;
      case "correct": tone(660, 0, 0.12); tone(880, 0.1, 0.18); break;
      case "wrong": tone(220, 0, 0.2, "sawtooth", 0.15); tone(160, 0.15, 0.3, "sawtooth", 0.15); break;
      case "win": [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.3, "triangle")); break;
      case "lose": [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.22, 0.4, "square", 0.12)); break;
    }
  } catch (e) { /* audio problems must never break the game */ }
}

/** Create the music Audio object once. A missing file only marks music as unavailable. */
function getMusic() {
  if (!musicEl && !musicBroken && MUSIC_URL) {
    musicEl = new Audio(MUSIC_URL);
    musicEl.loop = true;
    musicEl.volume = save.volume * 0.5;
    musicEl.addEventListener("error", () => {
      musicBroken = true;
      updateAudioButtons();
      setStatus("Music file not found. The game works without it.");
    });
  }
  return musicEl;
}

function startMusic() {
  const m = getMusic();
  if (!m) return;
  try { const p = m.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
}
function stopMusic() { if (musicEl) musicEl.pause(); }

function toggleMusic() {
  save.music = !save.music;
  save.music ? startMusic() : stopMusic();
  saveSettings();
  updateAudioButtons();
  playSound("click");
}

function toggleSfx() {
  save.sfx = !save.sfx;
  saveSettings();
  updateAudioButtons();
  playSound("click");
}

function setVolume(v) {
  save.volume = v;
  if (masterGain) masterGain.gain.value = v;
  if (musicEl) musicEl.volume = v * 0.5;
  saveSettings();
}

function updateAudioButtons() {
  const musicOn = save.music && !musicBroken;
  const m = $("musicBtn"), s = $("sfxBtn");
  m.textContent = musicOn ? "🔊" : "🔇";
  m.setAttribute("aria-pressed", String(musicOn));
  m.setAttribute("aria-label", "Background music: " + (musicOn ? "on" : "off"));
  m.title = musicBroken ? "Music file not found" : "Music " + (musicOn ? "on" : "off");
  s.textContent = save.sfx ? "🔔" : "🔕";
  s.setAttribute("aria-pressed", String(save.sfx));
  s.setAttribute("aria-label", "Sound effects: " + (save.sfx ? "on" : "off"));
  s.title = "Sound effects " + (save.sfx ? "on" : "off");
}

/* ---------------------------------------------------------
   4. STARTING A GAME
   --------------------------------------------------------- */

/**
 * Pick a word using BOTH category and difficulty.
 * Tiers: ideal length -> within 2 letters -> any length in the category.
 * Inside a tier, recently used words are skipped. Never returns undefined.
 */
function selectWord(r, category) {
  let pool = category === "All" ? wordBank : wordBank.filter((x) => x.category === category);
  if (!pool.length) pool = wordBank;
  const gap = (x) => { const n = lettersIn(x.word); return n < r.minLen ? r.minLen - n : n > r.maxLen ? n - r.maxLen : 0; };
  const tiers = [pool.filter((x) => gap(x) === 0), pool.filter((x) => gap(x) <= 2), pool];
  const fresh = (list) => list.filter((x) => !game.recentWords.includes(x.word));
  for (const tier of tiers) {
    const options = fresh(tier);
    if (options.length) return options[Math.floor(Math.random() * options.length)];
  }
  // Everything was used recently: only avoid the very last word.
  const last = game.recentWords[game.recentWords.length - 1];
  const options = pool.filter((x) => x.word !== last);
  const list = options.length ? options : pool;
  return list[Math.floor(Math.random() * list.length)];
}

function startGame() {
  clearTimers();
  clearConfetti();
  closeResult();
  const r = rule();
  const entry = selectWord(r, $("category").value);

  game.id++;
  Object.assign(game, {
    word: entry.word, hint: entry.hint, category: entry.category,
    guessedLetters: new Set(), correctLetters: new Set(), wrongLetters: [],
    maxLives: r.lives, stages: r.stages,
    over: false, won: false, hintUsed: false, roundScore: 0, winBonus: 0
  });
  game.recentWords.push(entry.word);
  if (game.recentWords.length > RECENT_LIMIT) game.recentWords.shift();

  $("man").classList.remove("swing", "celebrate");
  $("hintBox").hidden = true;
  $("curCategory").textContent = entry.category;
  $("diffNote").textContent = r.note;

  buildWordSlots();
  buildKeyboard();
  resetHangman();
  updateLives();
  updateHint();
  updateWordLabel();
  setStatus("New word! Pick a letter.");
}

/** One group per word; spaces separate groups, hyphens are shown as dashes. */
function buildWordSlots() {
  const box = $("wordDisplay");
  box.innerHTML = "";
  box.classList.remove("won");
  let longest = 1, i = 0;
  game.word.split(" ").forEach((part) => {
    const group = document.createElement("div");
    group.className = "word-group";
    longest = Math.max(longest, part.length);
    [...part].forEach((ch) => {
      const s = document.createElement("span");
      s.className = "slot";
      s.style.setProperty("--i", i++);
      if (ch === "-") { s.classList.add("dash"); s.textContent = "-"; }
      else s.dataset.letter = ch;
      group.appendChild(s);
    });
    box.appendChild(group);
  });
  box.style.setProperty("--n", longest);
}

/** QWERTY keyboard in three rows. */
function buildKeyboard() {
  const kb = $("keyboard");
  kb.innerHTML = "";
  ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    [...row].forEach((letter) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      b.textContent = letter;
      b.dataset.letter = letter;
      b.setAttribute("aria-label", "Letter " + letter.toUpperCase());
      b.addEventListener("click", () => handleGuess(letter));
      rowEl.appendChild(b);
    });
    kb.appendChild(rowEl);
  });
}

/* ---------------------------------------------------------
   5. HANGMAN DRAWING + LIVES
   --------------------------------------------------------- */

const partEl = (name) => document.querySelector(`.part[data-part="${name}"]`);

/** Hide body + face, redraw gallows. */
function resetHangman() {
  document.querySelectorAll(".part.man, .part.face").forEach((p) => p.classList.remove("show"));
  document.querySelectorAll(".part.g").forEach((p) => {
    p.classList.remove("show");
    void p.getBoundingClientRect(); // restart CSS animation
    p.classList.add("show");
  });
}

/** Deterministic: wrong guess #n shows the parts of stage n. No math scaling. */
function updateHangman() {
  const n = Math.min(game.wrongLetters.length, game.stages.length);
  for (let i = 0; i < n; i++) game.stages[i].forEach((name) => partEl(name).classList.add("show"));
}

function updateLives() {
  const left = game.maxLives - game.wrongLetters.length;
  const pct = (left / game.maxLives) * 100;
  $("attempts").textContent = left + " / " + game.maxLives;
  $("wrongLetters").textContent = game.wrongLetters.length ? game.wrongLetters.join(" ") : "–";
  const track = $("livesTrack");
  track.setAttribute("aria-valuemax", game.maxLives);
  track.setAttribute("aria-valuenow", left);
  const bar = $("livesBar");
  bar.style.width = pct + "%";
  bar.style.background = pct > 60 ? "var(--good)" : pct > 30 ? "#f59e0b" : "var(--bad)";
}

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/* ---------------------------------------------------------
   6. GUESSES, HINTS, SCORING
   --------------------------------------------------------- */

const GOOD_MSGS = ["Great guess!", "Nice one!", "You found it!", "Keep going!"];
const BAD_MSGS = ["Wrong guess.", "Try another letter!", "Not in the word.", "Careful now…"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function handleGuess(letter) {
  if (game.over || !/^[a-z]$/.test(letter) || game.guessedLetters.has(letter)) return; // no double penalty
  game.guessedLetters.add(letter);

  const key = document.querySelector(`.key[data-letter="${letter}"]`);
  key.disabled = true;

  const matches = revealLetter(letter);
  if (matches > 0) {
    game.correctLetters.add(letter);
    key.classList.add("correct");
    updateScore(matches * POINTS.perLetter);
    setStatus(`Correct guess: ${letter.toUpperCase()} appears ${matches} time${matches > 1 ? "s" : ""}. ${pick(GOOD_MSGS)}`);
    playSound("correct");
    updateWordLabel();
    if (hasWon()) endGame(true);
  } else {
    key.classList.add("incorrect");
    game.wrongLetters.push(letter);
    updateScore(POINTS.wrong);
    updateHangman();
    updateLives();
    restartAnimation($("stageCard"), "shake");
    setStatus(`Wrong guess: ${letter.toUpperCase()}. ${pick(BAD_MSGS)}`);
    playSound("wrong");
    updateHint();
    if (game.wrongLetters.length >= game.maxLives) endGame(false);
  }
}

/** Reveal matching slots. Returns how many NEW slots were revealed. */
function revealLetter(letter) {
  let count = 0;
  document.querySelectorAll(`.slot[data-letter="${letter}"]`).forEach((slot) => {
    if (slot.textContent) return; // already revealed
    slot.textContent = letter;
    slot.classList.add("revealed");
    count++;
  });
  return count;
}

function hasWon() {
  return [...game.word].every((ch) => !/[a-z]/.test(ch) || game.correctLetters.has(ch));
}

/** Screen-reader friendly description, e.g. "Word, 6 letters: b a _ _ _ _" */
function updateWordLabel() {
  const shown = [...game.word].map((ch) => (ch === " " ? "/" : /[a-z]/.test(ch) ? (game.correctLetters.has(ch) || game.over ? ch : "blank") : ch));
  $("wordDisplay").setAttribute("aria-label", `Word with ${lettersIn(game.word)} letters: ${shown.join(" ")}`);
}

/** Enable/disable the hint button and explain why. */
function updateHint() {
  const r = rule(), btn = $("hintBtn"), note = $("hintNote");
  const wrong = game.wrongLetters.length;
  let enabled = false, label = "💡 Hint", text = "";
  if (game.hintUsed) { label = "💡 Hint used"; text = "One hint per round."; }
  else if (game.over) { text = "Round finished."; }
  else if (wrong < r.hintAfter) { text = `Hint unlocks after ${r.hintAfter} wrong guesses.`; }
  else { enabled = true; text = `Costs ${r.hintCost} points, charged once per round.`; }
  btn.disabled = !enabled;
  btn.textContent = label;
  note.textContent = text;
}

function showHint() {
  const box = $("hintBox");
  box.textContent = "💡 " + (game.hint || "No hint for this word.");
  box.hidden = false;
}

function useHint() {
  if (game.over || game.hintUsed || $("hintBtn").disabled) return;
  game.hintUsed = true; // set first: penalty can only be charged once
  const cost = rule().hintCost;
  updateScore(-cost, `-${cost} HINT`);
  showHint();
  updateHint();
  setStatus("Hint revealed.");
  playSound("click");
}

/** Change the total score (never below 0), keep round score, animate. */
function updateScore(delta, label, delay = 0) {
  const before = save.score;
  save.score = Math.max(0, before + delta);
  const applied = save.score - before;
  game.roundScore += applied;
  saveSettings();
  updateStats();
  if (applied !== 0) {
    restartAnimation($("score"), "pop");
    floatText(label || (delta > 0 ? "+" : "") + delta, delta > 0, delay);
  }
}

function floatText(text, positive, delay) {
  const el = document.createElement("b");
  el.textContent = text;
  el.className = positive ? "plus" : "minus";
  el.style.animationDelay = delay + "ms";
  el.addEventListener("animationend", () => el.remove());
  $("floatLayer").appendChild(el);
}

function updateStats() {
  $("score").textContent = save.score;
  $("wins").textContent = save.wins;
  $("losses").textContent = save.losses;
}

function setStatus(msg) { $("status").textContent = msg; }

/* ---------------------------------------------------------
   7. END OF GAME + RESULT DIALOG
   --------------------------------------------------------- */

function endGame(won) {
  game.over = true;
  game.won = won;
  document.querySelectorAll(".key").forEach((k) => (k.disabled = true));
  updateHint();
  updateWordLabel();
  const roundId = game.id;

  if (won) {
    game.winBonus = rule().winBonus;
    const lifeBonus = (game.maxLives - game.wrongLetters.length) * POINTS.perLifeLeft;
    updateScore(game.winBonus, `+${game.winBonus} WIN BONUS`, 200);
    if (lifeBonus > 0) updateScore(lifeBonus, `+${lifeBonus} LIVES BONUS`, 600);
    save.wins++;
    $("wordDisplay").classList.add("won");
    $("man").classList.add("celebrate");
    setStatus("You won! 🎉");
    playSound("win");
    launchConfetti();
  } else {
    save.losses++;
    document.querySelectorAll(".slot[data-letter]").forEach((slot) => {
      if (!slot.textContent) { slot.textContent = slot.dataset.letter; slot.classList.add("missed"); }
    });
    // Show every body part plus the losing face
    document.querySelectorAll(".part.man, .part.face").forEach((p) => p.classList.add("show"));
    $("man").classList.add("swing");
    setStatus("Game over. You lost.");
    playSound("lose");
  }
  saveSettings();
  updateStats();
  later(() => { if (game.id === roundId) showResult(); }, 1100);
}

let resultOpen = false;

function showResult() {
  const lives = game.maxLives - game.wrongLetters.length;
  $("result").className = "result card " + (game.won ? "win" : "lose");
  $("resultTitle").textContent = game.won ? "🎉 Congratulations!" : "Game Over";
  $("resultMsg").textContent = game.won ? "You guessed the word!" : "Better luck next time. The word was:";
  $("resultWord").textContent = game.word;
  $("resultPoints").textContent = (game.roundScore > 0 ? "+" : "") + game.roundScore;
  $("rowBonus").hidden = $("rowLives").hidden = !game.won;
  $("resultBonus").textContent = "+" + game.winBonus;
  $("resultLives").textContent = lives + " / " + game.maxLives;
  $("playAgainBtn").textContent = game.won ? "Play Again" : "Try Again";
  $("overlay").hidden = false;
  $("app").inert = true;               // keyboard focus cannot wander behind the dialog
  $("app").setAttribute("aria-hidden", "true");
  resultOpen = true;
  $("playAgainBtn").focus();
}

function closeResult() {
  $("overlay").hidden = true;
  $("app").inert = false;
  $("app").removeAttribute("aria-hidden");
  resultOpen = false;
}

/** Play Again / Try Again / Escape: always leaves a fresh, playable game. */
function dismissResult() {
  startGame();
  $("newGameBtn").focus();
}

function launchConfetti() {
  if (reduceMotion()) return;
  const box = $("confetti");
  const colors = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#f472b6", "#ef4444"];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--dur", 2.5 + Math.random() * 2 + "s");
    c.style.setProperty("--delay", Math.random() * 0.8 + "s");
    c.style.setProperty("--drift", Math.random() * 200 - 100 + "px");
    box.appendChild(c);
  }
  later(clearConfetti, 5000);
}
function clearConfetti() { $("confetti").innerHTML = ""; }

/* ---------------------------------------------------------
   8. THEME, PARTICLES, EVENTS & INIT
   --------------------------------------------------------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const b = $("themeBtn"), dark = theme === "dark";
  b.textContent = dark ? "🌙" : "☀️";
  b.setAttribute("aria-label", dark ? "Dark theme on. Switch to light theme" : "Light theme on. Switch to dark theme");
  b.title = dark ? "Dark theme" : "Light theme";
}

function toggleTheme() {
  save.theme = save.theme === "dark" ? "light" : "dark";
  applyTheme(save.theme);
  saveSettings();
  playSound("click");
}

function createParticles() {
  const box = $("particles");
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("i"), size = 3 + Math.random() * 6;
    p.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
      `animation-duration:${10 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s`;
    box.appendChild(p);
  }
}

function onSettingChange(e) {
  save.difficulty = $("difficulty").value;
  save.category = $("category").value;
  saveSettings();
  e.target.blur(); // so physical-keyboard letters work again right away
  startGame();
}

function onKeyDown(e) {
  if (resultOpen) {
    if (e.key === "Escape") { e.preventDefault(); dismissResult(); }
    else if (e.key === "Tab") { e.preventDefault(); $("playAgainBtn").focus(); } // simple focus trap
    return;
  }
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (["SELECT", "INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toLowerCase());
}

function init() {
  loadSettings();
  applyTheme(save.theme);

  $("category").innerHTML = categories.map((c) => `<option value="${c}">${c === "All" ? "All categories" : c}</option>`).join("");
  $("difficulty").value = save.difficulty;
  $("category").value = save.category;
  $("volume").value = save.volume;
  updateAudioButtons();
  updateStats();

  $("newGameBtn").addEventListener("click", () => { playSound("click"); startGame(); });
  $("playAgainBtn").addEventListener("click", dismissResult);
  $("hintBtn").addEventListener("click", useHint);
  $("themeBtn").addEventListener("click", toggleTheme);
  $("sfxBtn").addEventListener("click", toggleSfx);
  $("musicBtn").addEventListener("click", toggleMusic);
  $("resetStatsBtn").addEventListener("click", resetStats);
  $("volume").addEventListener("input", (e) => setVolume(parseFloat(e.target.value)));
  $("difficulty").addEventListener("change", onSettingChange);
  $("category").addEventListener("change", onSettingChange);
  document.addEventListener("keydown", onKeyDown);

  // Browsers block autoplay: a saved "music on" preference starts after the first click/key press.
  const unlock = () => { if (save.music) startMusic(); };
  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });

  createParticles();
  startGame();
}

init();
