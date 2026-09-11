/* Mindalo — reading tools: text size, listen to this page, print.
   Everything still works if this file does not load. */
(function () {
  var root = document.documentElement;
  var KEY = "mindalo-text-size";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Text size ---------------- */
  function setSize(size) {
    if (size === "normal") root.removeAttribute("data-text");
    else root.setAttribute("data-text", size);
    document.querySelectorAll("[data-size]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-size") === size ? "true" : "false");
    });
    try { localStorage.setItem(KEY, size); } catch (e) {}
  }
  var saved = "normal";
  try { saved = localStorage.getItem(KEY) || "normal"; } catch (e) {}
  setSize(saved);
  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () { setSize(b.getAttribute("data-size")); });
  });

  /* ---------------- Print ---------------- */
  var printBtn = document.getElementById("print-page");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  /* ---------------- Listen to this page ----------------
     Reads one paragraph at a time, highlights it, and shows a
     small player at the bottom of the screen with Pause and Stop.
     Uses a calm female English voice when the device has one. */
  var listenBtn = document.getElementById("listen");
  var synth = window.speechSynthesis;
  if (!listenBtn) return;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") { listenBtn.hidden = true; return; }
  listenBtn.hidden = false;
  var label = listenBtn.querySelector(".listen-label");
  var startLabel = label.innerHTML;

  var RATE = 0.85;   // a little slower than normal speech: calmer and easier to follow
  var PITCH = 1;

  // Voices that are female on common phones and computers
  var FEMALE = /female|woman|zira|hazel|susan|libby|sonia|aria|jenny|michelle|ava|emma|natasha|clara|ezinne|leah|asilia|imani|luna|samantha|karen|moira|tessa|serena|kate|martha|stephanie|fiona|victoria|allison|joanna|amy|kendra|salli|ivy|nicky|shelley|sandy|flo\b|catherine|veena|heera|neerja|rosa|linda|heather|google uk english female|google us english/i;
  var MALE = /\bmale\b|david|mark|george|james|ryan|thomas|guy|daniel|arthur|oliver|rishi|fred|aaron|\balex\b|gordon|reed|ralph|albert|bruce|eddy|grandpa|rocko|ravi|prabhat|william|sean|liam|brian|matthew|joey|justin|kevin|russell|eric|christopher|roger|andrew|brandon|davis|jason|tony|abeo|chilemba|elimu|luke|connor|mitchell|nathan|prabhat|wayne/i;
  var AFRICA = /^en[-_](NG|ZA|KE|GH|TZ|UG|RW|ZM|ZW|BW|NA|MW|SL|LR|GM|CM|ET)/i;

  var voice = null;
  function scoreVoice(v) {
    var s = 0, lang = (v.lang || "").replace("_", "-");
    if (!/^en/i.test(lang)) return -1000;
    var female = FEMALE.test(v.name);
    var male = MALE.test(v.name) && !/female/i.test(v.name);
    if (male) return s - 100;
    if (female) {
      s += 60;
      if (AFRICA.test(lang)) s += 25;       // African English first
      else if (/^en-GB/i.test(lang)) s += 20;
      else s += 10;
    } else {
      // Voice gender unknown (common on Android): trust the phone's own default,
      // which is a female voice on most phones.
      s += v["default"] ? 30 : 0;
      s += /^en-GB/i.test(lang) ? 12 : 8;
    }
    if (/natural|neural|enhanced|premium/i.test(v.name)) s += 15;
    return s;
  }
  function pickVoice() {
    var list = synth.getVoices() || [];
    var best = null, bestScore = -Infinity;
    list.forEach(function (v) { var s = scoreVoice(v); if (s > bestScore) { best = v; bestScore = s; } });
    voice = bestScore > -1000 ? best : null;
  }
  pickVoice();
  if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", pickVoice);

  // What to read: headings, paragraphs and list items in the main content
  function collectBlocks() {
    var main = document.getElementById("main");
    if (!main) return [];
    var out = [];
    main.querySelectorAll("h1, h2, h3, p, li").forEach(function (el) {
      if (el.closest("[data-no-read], .crumbs")) return;
      if (el.matches("li") && el.querySelector("p, h3")) return; // read the parts instead
      if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") return; // hidden on this screen
      var t = el.innerText.replace(/\s+/g, " ").trim();
      if (t) out.push({ el: el, text: t });
    });
    return out;
  }
  // Short pieces so no browser cuts the voice off part-way
  function chunks(text) {
    var parts = text.match(/[^.!?]+[.!?]*[”’"')]*\s*/g) || [text];
    var out = [], buf = "";
    parts.forEach(function (p) {
      if ((buf + p).length > 180 && buf) { out.push(buf.trim()); buf = ""; }
      buf += p;
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  // The floating player
  var SPEAKER = listenBtn.querySelector("svg") ? listenBtn.querySelector("svg").outerHTML : "";
  var player = document.createElement("div");
  player.className = "player";
  player.setAttribute("role", "region");
  player.setAttribute("aria-label", "Reading aloud");
  player.hidden = true;
  player.innerHTML =
    '<span class="player-icon" aria-hidden="true">' + SPEAKER + '</span>' +
    '<span class="player-status"><span class="player-title">Reading aloud</span>' +
    '<span class="player-now" aria-live="off"></span></span>' +
    '<button type="button" class="player-pause">Pause</button>' +
    '<button type="button" class="player-stop">Stop</button>';
  document.body.appendChild(player);
  var pauseBtn = player.querySelector(".player-pause");
  var stopBtn = player.querySelector(".player-stop");
  var nowText = player.querySelector(".player-now");
  var titleText = player.querySelector(".player-title");

  var blocks = [], idx = 0, state = "idle", session = 0, current = null;

  function setState(s) {
    state = s;
    var playing = s === "playing", paused = s === "paused";
    player.hidden = s === "idle";
    document.body.classList.toggle("is-reading", s !== "idle");
    listenBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    label.innerHTML = playing ? "Pause" : paused ? "Resume" : startLabel;
    listenBtn.setAttribute("aria-label", playing ? "Pause reading" : paused ? "Resume reading" : "Listen to this page");
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    titleText.textContent = paused ? "Paused" : "Reading aloud";
    if (s === "idle" && current) { current.classList.remove("reading"); current = null; }
  }

  function highlight(el) {
    if (current) current.classList.remove("reading");
    current = el;
    el.classList.add("reading");
    var r = el.getBoundingClientRect();
    var bottomLimit = window.innerHeight - (player.offsetHeight + 32);
    if (r.top < 80 || r.bottom > bottomLimit) {
      el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function speakBlock(i) {
    if (i >= blocks.length) { stop(); return; }
    idx = i;
    var my = ++session;
    var b = blocks[i];
    highlight(b.el);
    nowText.textContent = (i + 1) + " of " + blocks.length + " · " + b.text.slice(0, 70) + (b.text.length > 70 ? "…" : "");
    var parts = chunks(b.text), p = 0;
    function next() {
      if (my !== session) return;          // stopped or moved on
      if (p >= parts.length) { speakBlock(i + 1); return; }
      var u = new SpeechSynthesisUtterance(parts[p++]);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = "en-GB"; }
      u.rate = RATE; u.pitch = PITCH;
      u.onend = next;
      u.onerror = function (e) { if (my === session && e.error !== "interrupted" && e.error !== "canceled") next(); };
      synth.speak(u);
    }
    next();
  }

  function start() {
    if (!voice) pickVoice();
    blocks = collectBlocks();
    if (!blocks.length) return;
    synth.cancel();
    setState("playing");
    speakBlock(0);
  }
  function pause() { session++; synth.cancel(); setState("paused"); }
  function resume() { synth.cancel(); setState("playing"); speakBlock(idx); }
  function stop() { session++; synth.cancel(); idx = 0; setState("idle"); }

  listenBtn.addEventListener("click", function () {
    if (state === "idle") start();
    else if (state === "playing") pause();
    else resume();
  });
  pauseBtn.addEventListener("click", function () { state === "playing" ? pause() : resume(); });
  stopBtn.addEventListener("click", function () { stop(); listenBtn.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && state !== "idle") stop(); });
  window.addEventListener("pagehide", function () { session++; synth.cancel(); });
})();
