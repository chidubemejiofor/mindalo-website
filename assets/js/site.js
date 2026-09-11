/* Mindalo — reading tools: text size, listen to this page, print.
   Everything still works if this file does not load. */
(function () {
  var root = document.documentElement;
  var KEY = "mindalo-text-size";

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

  var printBtn = document.getElementById("print-page");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  // Listen to this page (uses the voice built into the device)
  var listenBtn = document.getElementById("listen");
  var synth = window.speechSynthesis;
  if (!listenBtn) return;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") { listenBtn.hidden = true; return; }
  listenBtn.hidden = false;
  var label = listenBtn.querySelector(".listen-label");
  var startLabel = label.innerHTML;

  function stop() {
    synth.cancel();
    listenBtn.setAttribute("aria-pressed", "false");
    label.innerHTML = startLabel;
  }

  function pageText() {
    var main = document.getElementById("main");
    if (!main) return "";
    var parts = [];
    main.querySelectorAll("h1, h2, h3, p, li").forEach(function (el) {
      if (el.closest("[data-no-read]")) return;
      if (el.matches("li") && el.querySelector("p, h3")) return; // read the parts instead
      var t = el.innerText.replace(/\s+/g, " ").trim();
      if (t) parts.push(t);
    });
    return parts.join(". ").replace(/\.\s*\./g, ".");
  }

  listenBtn.addEventListener("click", function () {
    if (listenBtn.getAttribute("aria-pressed") === "true") { stop(); return; }
    var u = new SpeechSynthesisUtterance(pageText());
    u.lang = document.documentElement.lang || "en-GB";
    u.rate = 0.9;
    u.onend = stop;
    u.onerror = stop;
    synth.cancel();
    synth.speak(u);
    listenBtn.setAttribute("aria-pressed", "true");
    label.textContent = "Stop";
  });
  window.addEventListener("pagehide", function () { synth.cancel(); });
})();
