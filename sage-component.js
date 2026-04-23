// ============================================================
// SAGE COMPONENT — Mathage
// Inject into any page with: <script src="sage-component.js">
// ============================================================

(function() {
  'use strict';

  // ── Config ──
  var SAGE_CONFIG = {
    defaultImg:  'images/sage-default.png',
    smileImg:    'images/sage-smile.png',
    surpriseImg: 'images/sage-surprise.png',
    mode: document.body.dataset.sageMode || 'float', // 'dashboard' | 'float' | 'story'
  };

  // ── State (persisted in localStorage) ──
  function getState() {
    try {
      var s = JSON.parse(localStorage.getItem('sage_state') || '{}');
      return {
        hunger:      s.hunger      !== undefined ? s.hunger      : 80,
        cleanliness: s.cleanliness !== undefined ? s.cleanliness : 75,
        happiness:   s.happiness   !== undefined ? s.happiness   : 90,
        coins:       s.coins       !== undefined ? s.coins       : 0,
        lastVisit:   s.lastVisit   || Date.now(),
      };
    } catch(e) { return { hunger:80, cleanliness:75, happiness:90, coins:0, lastVisit:Date.now() }; }
  }

  function saveState(state) {
    try { localStorage.setItem('sage_state', JSON.stringify(state)); } catch(e) {}
  }

  var state = getState();

  // Decay stats slightly on each visit
  var now = Date.now();
  var hoursSince = (now - state.lastVisit) / 3600000;
  if (hoursSince > 0.1) {
    state.hunger      = Math.max(10, state.hunger      - Math.floor(hoursSince * 3));
    state.cleanliness = Math.max(10, state.cleanliness - Math.floor(hoursSince * 2));
    state.happiness   = Math.max(10, state.happiness   - Math.floor(hoursSince * 1));
    state.lastVisit   = now;
    saveState(state);
  }

  // ── Inject CSS ──
  var style = document.createElement('style');
  style.textContent = `
    /* ── Sage global styles ── */
    #sage-widget {
      position: fixed;
      z-index: 1000;
      pointer-events: auto;
      user-select: none;
    }
    #sage-widget.float-mode {
      bottom: 28px;
      right: 28px;
      width: 160px;
    }
    #sage-widget.dashboard-mode {
      bottom: 40px;
      right: 40px;
      width: 220px;
    }
    #sage-widget.dashboard-center-mode {
      bottom: 50%;
      left: 50%;
      transform: translate(-50%, 60%);
      width: 220px;
    }

    #sage-character {
      position: relative;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    #sage-img {
      width: 100%;
      height: auto;
      display: block;
      animation: sageFloat 3.2s ease-in-out infinite;
      transition: transform 0.2s ease, filter 0.2s ease;
      filter: drop-shadow(0 4px 16px rgba(180,220,255,0.35));
    }

    #sage-character:hover #sage-img {
      transform: scale(1.1) rotate(6deg);
      filter: drop-shadow(0 0 18px rgba(180,220,255,0.7)) drop-shadow(0 4px 16px rgba(180,220,255,0.4));
      animation: sageHover 0.6s ease-in-out infinite alternate;
    }

    @keyframes sageFloat {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      33%      { transform: translateY(-8px) rotate(2deg); }
      66%      { transform: translateY(-4px) rotate(-1deg); }
    }
    @keyframes sageHover {
      0%   { transform: scale(1.1) rotate(4deg) translateY(0px); }
      100% { transform: scale(1.12) rotate(8deg) translateY(-4px); }
    }
    @keyframes sageBounce {
      0%,100% { transform: translateY(0) scale(1); }
      30%     { transform: translateY(-16px) scale(1.08); }
      60%     { transform: translateY(-6px) scale(0.98); }
    }
    @keyframes sageSpin {
      0%   { transform: rotate(0deg) scale(1); }
      50%  { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes sageShake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-6px) rotate(-4deg); }
      40%     { transform: translateX(6px) rotate(4deg); }
      60%     { transform: translateX(-4px) rotate(-2deg); }
      80%     { transform: translateX(4px) rotate(2deg); }
    }

    #sage-character.bouncing #sage-img { animation: sageBounce 0.7s ease; }
    #sage-character.spinning #sage-img { animation: sageSpin 0.6s ease; }
    #sage-character.shaking #sage-img  { animation: sageShake 0.5s ease; }

    /* Speech bubble */
    #sage-bubble {
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      background: rgba(253,250,244,0.96);
      border: 1.5px solid rgba(180,220,255,0.5);
      border-radius: 14px 14px 4px 14px;
      padding: 9px 13px;
      min-width: 160px;
      max-width: 220px;
      font-family: 'Lora', Georgia, serif;
      font-size: 12px;
      font-style: italic;
      color: #2A1A08;
      line-height: 1.5;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      opacity: 0;
      transform: translateY(6px) scale(0.95);
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
    }
    #sage-bubble.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #sage-bubble::after {
      content: '';
      position: absolute;
      bottom: -7px;
      right: 14px;
      width: 12px;
      height: 12px;
      background: rgba(253,250,244,0.96);
      border-right: 1.5px solid rgba(180,220,255,0.5);
      border-bottom: 1.5px solid rgba(180,220,255,0.5);
      transform: rotate(45deg);
    }

    /* Coin pop */
    .coin-pop {
      position: fixed;
      font-family: 'Lora', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      color: #C8A84B;
      pointer-events: none;
      z-index: 2000;
      animation: coinFloat 1.4s ease-out forwards;
      text-shadow: 0 2px 8px rgba(200,168,75,0.5);
    }
    @keyframes coinFloat {
      0%   { opacity: 1; transform: translateY(0) scale(1); }
      60%  { opacity: 1; transform: translateY(-40px) scale(1.2); }
      100% { opacity: 0; transform: translateY(-70px) scale(0.8); }
    }

    /* ── Dashboard Panel ── */
    #sage-panel {
      position: fixed;
      bottom: auto;
      top: 50%;
      left: calc(50% + 140px);
      transform: translateY(-50%);
      width: 240px;
      background: rgba(253,250,244,0.97);
      border: 1.5px solid rgba(200,185,150,0.45);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      padding: 18px 20px;
      z-index: 999;
      opacity: 0;
      transform: translateX(20px) scale(0.96);
      transition: opacity 0.28s ease, transform 0.28s ease;
      pointer-events: none;
      font-family: 'Source Sans 3', system-ui, sans-serif;
    }
    #sage-panel.open {
      opacity: 1;
      transform: translateX(0) scale(1);
      pointer-events: auto;
    }
    .sp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .sp-name {
      font-family: 'Lora', Georgia, serif;
      font-size: 15px;
      font-weight: 600;
      color: #1C3A1E;
    }
    .sp-coins {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #F7EDD4;
      border: 1px solid #E8D090;
      border-radius: 50px;
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #8A6020;
    }
    .sp-coin-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #C8A84B;
    }
    .sp-divider {
      height: 1px;
      background: rgba(200,185,150,0.25);
      margin: 12px 0;
    }
    .sp-stat {
      margin-bottom: 11px;
    }
    .sp-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    .sp-stat-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #9A8060;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .sp-stat-icon { font-size: 12px; }
    .sp-stat-val {
      font-family: 'Lora', Georgia, serif;
      font-size: 13px;
      font-weight: 600;
    }
    .sp-track {
      height: 7px;
      background: rgba(0,0,0,0.07);
      border-radius: 4px;
      overflow: hidden;
    }
    .sp-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.6s ease;
    }
    .sp-actions {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-top: 14px;
    }
    .sp-action-btn {
      font-family: 'Source Sans 3', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.18s;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .sp-action-btn:hover { filter: brightness(1.06); transform: translateX(2px); }
    .sp-action-btn .btn-cost {
      font-size: 11px;
      opacity: 0.7;
    }
    .sp-message {
      font-family: 'Lora', Georgia, serif;
      font-size: 11px;
      font-style: italic;
      color: #6A5838;
      text-align: center;
      margin-top: 10px;
      min-height: 16px;
      line-height: 1.4;
    }

    /* Coins display top */
    #sage-coins-display {
      position: fixed;
      top: 60px;
      right: 20px;
      background: rgba(253,250,244,0.92);
      border: 1px solid rgba(200,168,75,0.35);
      border-radius: 50px;
      padding: 5px 14px;
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: 'Source Sans 3', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #8A6020;
      z-index: 998;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    #sage-coins-display .cd-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #C8A84B;
    }
  `;
  document.head.appendChild(style);

  // ── Build Sage HTML ──
  var mode = document.body.dataset.sageMode || 'float';

  // Coins display (dashboard pages only)
  var coinsDisplay = document.createElement('div');
  coinsDisplay.id = 'sage-coins-display';
  coinsDisplay.innerHTML = '<div class="cd-dot"></div><span id="coins-count">' + state.coins + '</span> coins';
  if (mode === 'dashboard' || mode === 'dashboard-center') {
    document.body.appendChild(coinsDisplay);
  }

  // Main widget
  var widget = document.createElement('div');
  widget.id = 'sage-widget';
  var modeClass = mode === 'dashboard' ? 'dashboard-mode'
    : mode === 'dashboard-center' ? 'dashboard-center-mode'
    : 'float-mode';
  widget.className = modeClass;

  var bubbleHTML = '<div id="sage-bubble"></div>';

  var panelHTML = '';
  if (mode === 'dashboard' || mode === 'dashboard-center') {
    panelHTML = `
    <div id="sage-panel">
      <div class="sp-header">
        <div class="sp-name">Sage</div>
        <div class="sp-coins"><div class="sp-coin-dot"></div><span id="panel-coins">${state.coins}</span> coins</div>
      </div>
      <div class="sp-divider"></div>
      <div class="sp-stat">
        <div class="sp-stat-row">
          <div class="sp-stat-label"><span class="sp-stat-icon">🍎</span>Hunger</div>
          <div class="sp-stat-val" id="stat-hunger">${state.hunger}%</div>
        </div>
        <div class="sp-track"><div class="sp-bar" id="bar-hunger" style="width:${state.hunger}%;background:linear-gradient(to right,#E87060,#F0A080)"></div></div>
      </div>
      <div class="sp-stat">
        <div class="sp-stat-row">
          <div class="sp-stat-label"><span class="sp-stat-icon">✨</span>Cleanliness</div>
          <div class="sp-stat-val" id="stat-clean">${state.cleanliness}%</div>
        </div>
        <div class="sp-track"><div class="sp-bar" id="bar-clean" style="width:${state.cleanliness}%;background:linear-gradient(to right,#70B8E8,#A0D0F0)"></div></div>
      </div>
      <div class="sp-stat">
        <div class="sp-stat-row">
          <div class="sp-stat-label"><span class="sp-stat-icon">⭐</span>Happiness</div>
          <div class="sp-stat-val" id="stat-happy">${state.happiness}%</div>
        </div>
        <div class="sp-track"><div class="sp-bar" id="bar-happy" style="width:${state.happiness}%;background:linear-gradient(to right,#C8A84B,#E8D090)"></div></div>
      </div>
      <div class="sp-divider"></div>
      <div class="sp-actions">
        <button class="sp-action-btn" style="background:#FDE8DC;color:#A04020" onclick="sageFeed()">
          Feed Sage <span class="btn-cost">&#8722;5 coins</span>
        </button>
        <button class="sp-action-btn" style="background:#D8EEFA;color:#1A5878" onclick="sageBathe()">
          Give a bath <span class="btn-cost">&#8722;5 coins</span>
        </button>
        <button class="sp-action-btn" style="background:#EBF5E6;color:#2A5A14" onclick="sagePet()">
          Pet Sage <span class="btn-cost">free</span>
        </button>
      </div>
      <div class="sp-message" id="sp-message">Click Sage to interact!</div>
    </div>`;
  }

  widget.innerHTML = `
    ${panelHTML}
    <div id="sage-character">
      ${bubbleHTML}
      <img id="sage-img" src="${SAGE_CONFIG.defaultImg}" alt="Sage">
    </div>
  `;
  document.body.appendChild(widget);

  // ── Elements ──
  var sageChar = document.getElementById('sage-character');
  var sageImg  = document.getElementById('sage-img');
  var sageBub  = document.getElementById('sage-bubble');
  var sagePanel = document.getElementById('sage-panel');
  var panelOpen = false;
  var bubbleTimer = null;
  var animLock = false;

  // ── Speech lines by mood ──
  var speeches = {
    happy: [
      "You are doing great today!",
      "I see you are thinking carefully. That is the best way.",
      "Math is everywhere — you just have to look.",
      "Every attempt teaches you something.",
    ],
    hungry: [
      "I am a little hungry… but I believe in you!",
      "Feed me after you solve this?",
    ],
    sad: [
      "I miss spending time with you…",
      "Come visit me more often!",
    ],
    encourage: [
      "Try again — you are closer than you think.",
      "Mistakes are just steps on the path.",
      "Take your time. There is no rush here.",
    ],
    celebrate: [
      "You did it! I knew you could!",
      "That was wonderful thinking!",
      "+1 coin for your effort!",
    ],
  };

  function getMood() {
    if (state.happiness > 70 && state.hunger > 50) return 'happy';
    if (state.hunger < 30) return 'hungry';
    if (state.happiness < 40) return 'sad';
    return 'happy';
  }

  function getSpeech(type) {
    var arr = speeches[type] || speeches.happy;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── Show bubble ──
  function showBubble(text, duration) {
    clearTimeout(bubbleTimer);
    sageBub.textContent = text;
    sageBub.classList.add('visible');
    bubbleTimer = setTimeout(function() {
      sageBub.classList.remove('visible');
    }, duration || 2800);
  }

  // ── Play animation ──
  function playAnim(type, duration) {
    if (animLock) return;
    animLock = true;
    sageChar.classList.add(type);
    setTimeout(function() {
      sageChar.classList.remove(type);
      animLock = false;
    }, duration || 700);
  }

  // ── Switch image temporarily ──
  function swapImg(src, duration) {
    sageImg.src = src;
    setTimeout(function() {
      sageImg.src = SAGE_CONFIG.defaultImg;
    }, duration || 1500);
  }

  // ── Coin pop animation ──
  function popCoin(amount, x, y) {
    var el = document.createElement('div');
    el.className = 'coin-pop';
    el.textContent = '+' + amount + ' coin' + (amount > 1 ? 's' : '');
    el.style.left = (x || window.innerWidth - 120) + 'px';
    el.style.top  = (y || window.innerHeight - 200) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 1500);
  }

  // ── Add coins ──
  function addCoins(amount) {
    state.coins += amount;
    saveState(state);
    document.getElementById('coins-count').textContent = state.coins;
    if (document.getElementById('panel-coins'))
      document.getElementById('panel-coins').textContent = state.coins;
    popCoin(amount);
  }

  // ── Update panel stats ──
  function updatePanel() {
    if (!sagePanel) return;
    ['hunger','clean','happy'].forEach(function(k) {
      var val = k === 'clean' ? state.cleanliness : state[k === 'happy' ? 'happiness' : k];
      var el = document.getElementById('stat-' + k);
      var bar = document.getElementById('bar-' + k);
      if (el)  el.textContent = Math.round(val) + '%';
      if (bar) bar.style.width = Math.round(val) + '%';
    });
    document.getElementById('coins-count').textContent = state.coins;
    if (document.getElementById('panel-coins'))
      document.getElementById('panel-coins').textContent = state.coins;
  }

  // ── Dashboard actions ──
  window.sageFeed = function() {
    if (state.coins < 5) {
      showBubble("Not enough coins! Solve more math first.");
      playAnim('shaking', 500);
      return;
    }
    state.coins -= 5;
    state.hunger = Math.min(100, state.hunger + 25);
    saveState(state);
    updatePanel();
    swapImg(SAGE_CONFIG.smileImg, 2000);
    playAnim('bouncing', 700);
    showBubble("Yummy! Thank you so much!");
    document.getElementById('sp-message').textContent = "Sage loved that!";
  };

  window.sageBathe = function() {
    if (state.coins < 5) {
      showBubble("Not enough coins!");
      playAnim('shaking', 500);
      return;
    }
    state.coins -= 5;
    state.cleanliness = Math.min(100, state.cleanliness + 25);
    saveState(state);
    updatePanel();
    swapImg(SAGE_CONFIG.smileImg, 2000);
    playAnim('spinning', 600);
    showBubble("So fresh and clean!");
    document.getElementById('sp-message').textContent = "Sage is sparkling!";
  };

  window.sagePet = function() {
    state.happiness = Math.min(100, state.happiness + 10);
    saveState(state);
    updatePanel();
    swapImg(SAGE_CONFIG.smileImg, 1800);
    playAnim('bouncing', 700);
    showBubble("Heehee~ That feels nice!");
    document.getElementById('sp-message').textContent = "Sage is happy!";
  };

  // ── Global: award coins (called from chapter/build pages) ──
  window.sageAwardCoins = function(amount, reason) {
    addCoins(amount);
    swapImg(SAGE_CONFIG.surpriseImg, 2000);
    playAnim('bouncing', 700);
    showBubble(reason || getSpeech('celebrate'));
  };

  // ── Global: show Sage hint ──
  window.sageSpeak = function(text) {
    showBubble(text, 3500);
  };

  // ── Hover ──
  sageChar.addEventListener('mouseenter', function() {
    swapImg(SAGE_CONFIG.smileImg, 99999);
  });
  sageChar.addEventListener('mouseleave', function() {
    sageImg.src = SAGE_CONFIG.defaultImg;
  });

  // ── Click ──
  sageChar.addEventListener('click', function() {
    if (mode === 'dashboard' || mode === 'dashboard-center') {
      panelOpen = !panelOpen;
      if (sagePanel) sagePanel.classList.toggle('open', panelOpen);
      if (panelOpen) {
        updatePanel();
        playAnim('bouncing', 700);
        showBubble("Hi! How are you doing today?");
      }
    } else {
      // Float mode — just say something
      playAnim('bouncing', 700);
      showBubble(getSpeech(getMood()));
    }
  });

  // ── Close panel on outside click ──
  document.addEventListener('click', function(e) {
    if (sagePanel && panelOpen && !widget.contains(e.target)) {
      panelOpen = false;
      sagePanel.classList.remove('open');
    }
  });

  // ── Idle speech (every 45s on dashboard) ──
  if (mode === 'dashboard' || mode === 'dashboard-center') {
    setInterval(function() {
      if (!panelOpen) showBubble(getSpeech(getMood()), 3000);
    }, 45000);
  }

  // ── Expose for page use ──
  window.SAGE = {
    awardCoins: window.sageAwardCoins,
    speak:      window.sageSpeak,
    celebrate: function() {
      swapImg(SAGE_CONFIG.surpriseImg, 2000);
      playAnim('bouncing', 700);
    },
    getState: function() { return state; },
  };

  console.log('Sage component loaded — mode:', mode);
})();
