(() => {
  'use strict';

  // Gameplay, layout, and art tuning live here. No external assets or modules.
  const CONFIG = {
    width: 640, height: 600, maxStep: 1 / 30, tick: 1 / 60,
    player: { y: 510, speed: 250, width: 30, height: 24, energy: 100,
      movementCost: 2.16, shotCost: 0.96, ships: 3 },
    shot: { speed: 520, width: 4, height: 12 },
    enemy: { width: 28, height: 24,
      rows: [{count:2,type:'flagship'}, {count:5,type:'red'}, {count:7,type:'green'},
        {count:9,type:'red'}, {count:9,type:'red'}, {count:9,type:'red'}],
      top: 72, columnGap: 36, rowGap: 27,
      sway: 56, swayStep: 4, swayStepInterval: 0.24,
      swaySpeed: 0.65, swayGrowth: 0.12, swayLimit: 1.9,
      diveInterval: 1.5, diveMinimum: 1,
      diveSpeed: 135, diveGrowth: 8, diveSpeedLimit: 210,
      segmentShipLengths: 4.5, combatBottom: 536,
      shotSpeed: 190, shotGrowth: 12, shotLimit: 330,
      activationBatch: 1, batchEvery: 5,
      activeCap: 2, capEvery: 10, capGrowth: 1, capMaximum: 8, blinkInterval: 0.18,
      points: { formation: 50, diver: 100, flagship: 200, divingFlagship: 300 } },
    bonusScore: 5000, storageKey: 'space-attack.high-score',
    stars: { count: 48, seed: 1982, size: 2 },
    polish: { explosionDuration: 0.35, explosionParticles: 8, explosionSpeed: 65,
      particleSize: 3, flashDuration: 0.16, invulnerability: 1.5, blinkInterval: 0.12,
      waveDuration: 1.2, bannerY: 300 },
    debug: { enabled: true, maxWave: 999 },
    audio: { volume: 0.09, floor: 0.0001, lowEnergyThreshold: 25, beepInterval: 0.65,
      shot: { notes: [1400, 1050, 700, 350], noteTime: 0.018, gain: 0.65, type: 'square' },
      kill: { notes: [330, 110, 260, 80, 160, 50], noteTime: 0.025, gain: 0.85, type: 'square' },
      loss: { notes: [440, 330, 220, 165, 110, 55], noteTime: 0.055, gain: 0.9, type: 'triangle' },
      wave: { notes: [392, 523, 659, 784], noteTime: 0.075, gain: 0.65, type: 'square' },
      bonus: { notes: [659, 784, 1047, 784, 1047], noteTime: 0.07, gain: 0.65, type: 'square' },
      start: { notes: [523,659,784,1047,784,659,523,659,784,988,1175,988,784,659,784,1047], noteTime: 0.14, gain: 0.65, type: 'square' },
      low: { notes: [880, 660], noteTime: 0.05, gain: 0.55, type: 'square' } },
    colors: { yellow: '#ffff45', red: '#ff4040', green: '#50ff50', cyan: '#45ffff', white: '#ffffff' },
    art: { pixel: 3, reservePixel: 2, digitPixel: 3,
      titleFont: 'bold 48px monospace', headingFont: 'bold 32px monospace',
      textFont: 'bold 17px monospace', smallFont: 'bold 12px monospace' },
    hud: { margin: 20, digitY: 33, bottomY: 560, waveDigitY: 553, reserveCountGap: 14,
      barX: 42, barY: 553, barWidth: 210, barHeight: 16,
      reserveGap: 27, reserveIcons: 4, reserveWaveGap: 24, controlsY: 592,
      baselineOffset: 7, barInset: 2 },
    screen: { titleY: 226, subtitleY: 267, moveY: 330, fireY: 363,
      promptY: 425, overY: 246, scoreY: 305, restartY: 370,
      pauseY: 275, resumeY: 315, pauseBoxX: 150, pauseBoxY: 230,
      pauseBoxWidth: 340, pauseBoxHeight: 110 }
  };
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
  ctx.imageSmoothingEnabled = false;
  const keys = new Set();
  const handledKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Enter', 'Escape', 'KeyM', 'F2']);
  const debugPanel = document.getElementById('debug-menu');
  const debugWave = document.getElementById('debug-wave');
  let debugOpen = false;
  function setDebug(open) {
    if (!CONFIG.debug.enabled || (state !== 'play' && state !== 'paused')) return;
    debugOpen = open; debugPanel.hidden = !open; clearInput(); syncAudio();
    if (open) { debugWave.value = Math.min(CONFIG.debug.maxWave, wave + 1); debugWave.focus(); }
    else canvas.focus();
  }
  function skipToWave(target) {
    if (!debugOpen) return;
    const requested = Number(target);
    if (!Number.isInteger(requested) || requested < 1 || requested > CONFIG.debug.maxWave) return;
    wave = requested; explosions = []; flashTimer = 0; invulnerabilityTimer = 0;
    for (const oscillator of activeSounds) { try { oscillator.stop(); } catch (_) {} }
    startWave(true); debugWave.value = Math.min(CONFIG.debug.maxWave, wave + 1);
  }
  let highScore = 0;
  let storageAvailable = true;
  try {
    const saved = Number(localStorage.getItem(CONFIG.storageKey));
    if (Number.isSafeInteger(saved) && saved >= 0) highScore = saved;
  } catch (_) { storageAvailable = false; }

  let state = 'start';
  let score = 0;
  let wave = 1;
  let ships = CONFIG.player.ships;
  let energy = CONFIG.player.energy;
  let bonusAwarded = false;
  let playerX = CONFIG.width / 2;
  let playerRemainder = 0;
  let playerShot = null;
  let enemyShots = [];
  let enemies = [];
  let formationTime = 0;
  let formationOffset = 0;
  let formationDirection = 1;
  let diveTimer = 0;
  let lastTime = null;
  let tickAccumulator = 0;
  let explosions = [], flashTimer = 0, invulnerabilityTimer = 0, waveTimer = 0;
  let muted = false, audioContext = null, masterGain = null;
  let beepTimer = 0;
  const activeSounds = new Set();
  function syncAudio() {
    if (masterGain) masterGain.gain.value = muted || debugOpen || state === 'paused' ? 0 : CONFIG.audio.volume;
  }
  function unlockAudio() {
    try {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        audioContext = new Audio(); masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination); syncAudio();
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) { audioContext = null; masterGain = null; }
  }
  function sound(name) {
    if (muted || !audioContext || audioContext.state === 'closed') return;
    try {
      const tune = CONFIG.audio[name], now = audioContext.currentTime;
      const duration = tune.notes.length * tune.noteTime;
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = tune.type;
      tune.notes.forEach((frequency, i) => oscillator.frequency.setValueAtTime(frequency, now + i * tune.noteTime));
      gain.gain.setValueAtTime(tune.gain, now);
      gain.gain.exponentialRampToValueAtTime(CONFIG.audio.floor, now + duration);
      oscillator.soundName = name;
      oscillator.connect(gain); gain.connect(masterGain); activeSounds.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); activeSounds.delete(oscillator); };
      oscillator.start(now); oscillator.stop(now + duration);
    } catch (_) { /* Audio failure must never interrupt gameplay. */ }
  }
  function resetLowEnergyAlarm() {
    beepTimer = 0;
    for (const oscillator of activeSounds) {
      if (oscillator.soundName === 'low') { try { oscillator.stop(); } catch (_) {} }
    }
  }
  function explosion(x, y, color) {
    explosions.push({x, y, color, remaining: CONFIG.polish.explosionDuration});
  }
  function updateEffects(dt) {
    flashTimer = Math.max(0, flashTimer - dt);
    invulnerabilityTimer = Math.max(0, invulnerabilityTimer - dt);
    for (const effect of explosions) effect.remaining -= dt;
    explosions = explosions.filter(effect => effect.remaining > 0);
  }

  const sprites = {
    player: ['000010000', '000111000', '100111001', '111111111', '111111111', '100000001'],
    enemy: ['100000001', '010000010', '001111100', '011010110', '111111111', '101000101', '010000010'],
    flagship: ['100010001', '110111011', '011111110', '001010100', '011111110', '010101010', '100000001']
  };
  const digits = [
    ['111','101','101','101','111'], ['010','110','010','010','111'],
    ['111','001','111','100','111'], ['111','001','111','001','111'],
    ['101','101','111','001','001'], ['111','100','111','001','111'],
    ['111','100','111','101','111'], ['111','001','010','010','010'],
    ['111','101','111','101','111'], ['111','101','111','001','111']
  ];
  let seed = CONFIG.stars.seed;
  const stars = Array.from({ length: CONFIG.stars.count }, () => {
    seed = (seed * 16807) % 2147483647;
    const x = seed % CONFIG.width;
    seed = (seed * 16807) % 2147483647;
    return { x, y: seed % CONFIG.height };
  });

  function difficulty() {
    const n = wave - 1;
    const e = CONFIG.enemy;
    return {
      swaySpeed: Math.min(e.swayLimit, e.swaySpeed + n * e.swayGrowth),
      diveInterval: e.diveInterval - (e.diveInterval - e.diveMinimum) * (n % e.batchEvery) / (e.batchEvery - 1),
      diveSpeed: Math.min(e.diveSpeedLimit, e.diveSpeed + n * e.diveGrowth),
      shotSpeed: Math.min(e.shotLimit, e.shotSpeed + n * e.shotGrowth),
      activationBatch: e.activationBatch + Math.floor(n / e.batchEvery),
      activeCap: Math.min(e.capMaximum, e.activeCap + Math.floor(n / e.capEvery) * e.capGrowth)
    };
  }
  function slot(enemy) {
    return { x: enemy.homeX + formationOffset, y: enemy.homeY };
  }
  function startWave(showBanner = false) {
    waveTimer = showBanner ? CONFIG.polish.waveDuration : 0;
    if (showBanner) { energy = CONFIG.player.energy; resetLowEnergyAlarm(); keys.clear(); sound('wave'); }
    playerShot = null;
    enemyShots = [];
    formationTime = 0;
    formationOffset = 0; formationDirection = 1;
    diveTimer = difficulty().diveInterval;
    enemies = [];
    const e = CONFIG.enemy;
    for (let row = 0; row < e.rows.length; row++) {
      const spec = e.rows[row];
      const left = CONFIG.width / 2 - (spec.count - 1) * e.columnGap / 2;
      for (let column = 0; column < spec.count; column++) {
        const homeX = left + column * e.columnGap;
        const homeY = e.top + row * e.rowGap;
        enemies.push({ homeX, homeY, x: homeX, y: homeY,
          type: spec.type,
          mode: 'formation', direction: 0, segmentRemaining: 0, activeTime: 0 });
      }
    }
  }
  function startRun() {
    score = 0; wave = 1; ships = CONFIG.player.ships;
    energy = CONFIG.player.energy; bonusAwarded = false;
    playerX = CONFIG.width / 2; playerRemainder = 0;
    keys.clear(); lastTime = null; tickAccumulator = 0;
    explosions = []; flashTimer = 0; invulnerabilityTimer = 0; waveTimer = 0;
    for (const oscillator of activeSounds) { try { oscillator.stop(); } catch (_) {} }
    resetLowEnergyAlarm();
    state = 'play';
    startWave();
    sound('start');
  }
  function addScore(points) {
    score += points;
    if (!bonusAwarded && score >= CONFIG.bonusScore) {
      ships++; bonusAwarded = true; sound('bonus');
    }
    if (score > highScore) {
      highScore = score;
      if (storageAvailable) {
        try { localStorage.setItem(CONFIG.storageKey, String(highScore)); }
        catch (_) { storageAvailable = false; }
      }
    }
  }
  function loseShip() {
    resetLowEnergyAlarm();
    explosion(playerX, CONFIG.player.y, CONFIG.colors.cyan);
    flashTimer = CONFIG.polish.flashDuration;
    invulnerabilityTimer = CONFIG.polish.invulnerability;
    sound('loss');
    ships--;
    keys.clear();
    playerShot = null;
    enemyShots = [];
    energy = ships > 0 ? CONFIG.player.energy : 0;
    playerX = CONFIG.width / 2;
    playerRemainder = 0;
    // Consume the collision encounter: surviving divers return to their slots.
    // Replacement protection is separate from consuming the original encounter.
    for (const enemy of enemies) {
      enemy.mode = 'formation'; enemy.direction = 0; enemy.segmentRemaining = 0;
      enemy.activeTime = 0;
      enemy.remainderX = 0; enemy.remainderY = 0;
      Object.assign(enemy, slot(enemy));
    }
    diveTimer = difficulty().diveInterval;
    if (ships <= 0) state = 'gameover';
  }
  function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < (aw + bw) / 2 && Math.abs(ay - by) < (ah + bh) / 2;
  }
  function hitByPlayer(shot, enemy) {
    // Swept vertical test keeps fast bullets from passing through sprites.
    const half = (CONFIG.shot.height + CONFIG.enemy.height) / 2;
    return Math.abs(shot.x - enemy.x) < (CONFIG.shot.width + CONFIG.enemy.width) / 2 &&
      Math.min(shot.y, shot.previousY) - half <= enemy.y &&
      Math.max(shot.y, shot.previousY) + half >= enemy.y;
  }
  function chooseDiagonal(enemy) {
    const e = CONFIG.enemy;
    const distance = e.height * e.segmentShipLengths;
    const horizontal = distance / Math.SQRT2;
    let direction = playerX >= enemy.x ? 1 : -1;
    // Commit to a full segment toward the player unless it would cross a side.
    if (enemy.x + direction * horizontal < e.width / 2 ||
        enemy.x + direction * horizontal > CONFIG.width - e.width / 2) direction *= -1;
    enemy.direction = direction;
    enemy.segmentRemaining = distance;
  }
  function moveDiver(enemy, distance) {
    while (distance > 0) {
      if (enemy.segmentRemaining <= 0) chooseDiagonal(enemy);
      const step = Math.min(distance, enemy.segmentRemaining);
      movePixels(enemy, 'x', enemy.direction * step / Math.SQRT2);
      movePixels(enemy, 'y', step / Math.SQRT2);
      enemy.segmentRemaining -= step;
      distance -= step;
    }
  }
  // Retain subpixel travel as a budget, never as an entity coordinate.
  function movePixels(entity, axis, distance) {
    const key = axis === 'x' ? 'remainderX' : 'remainderY';
    const travel = (entity[key] || 0) + distance;
    const pixels = Math.trunc(travel);
    entity[axis] += pixels;
    entity[key] = travel - pixels;
  }
  function update(dt) {
    if (debugOpen) return;
    if (state === 'gameover') { updateEffects(dt); return; }
    if (state !== 'play') return;
    updateEffects(dt);
    if (waveTimer > 0) { waveTimer = Math.max(0, waveTimer - dt); return; }
    const p = CONFIG.player;
    const e = CONFIG.enemy;
    const d = difficulty();
    const direction = Number(keys.has('ArrowRight') || keys.has('KeyD')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyA'));
    if (!direction) playerRemainder = 0;
    const travel = playerRemainder + direction * p.speed * dt;
    const pixels = Math.trunc(travel);
    playerRemainder = travel - pixels;
    const nextX = Math.max(p.width / 2, Math.min(CONFIG.width - p.width / 2, playerX + pixels));
    if (nextX === p.width / 2 || nextX === CONFIG.width - p.width / 2) playerRemainder = 0;
    if (nextX !== playerX) energy -= p.movementCost * Math.abs(nextX - playerX) / p.speed;
    playerX = nextX;
    if (keys.has('Space') && !playerShot) {
      playerShot = { x: playerX, y: p.y - p.height / 2, previousY: p.y - p.height / 2 };
      energy -= p.shotCost;
      sound('shot');
    }
    if (energy <= 0) { loseShip(); return; }
    if (energy <= CONFIG.audio.lowEnergyThreshold && !muted && enemies.length > 0) {
      beepTimer -= dt;
      if (beepTimer <= 0) { sound('low'); beepTimer = CONFIG.audio.beepInterval; }
    } else if (beepTimer > 0) resetLowEnergyAlarm();

    formationTime += dt;
    const interval = e.swayStepInterval * e.swaySpeed / d.swaySpeed;
    while (formationTime >= interval) {
      formationTime -= interval;
      formationOffset += formationDirection * e.swayStep;
      if (Math.abs(formationOffset) >= e.sway) {
        formationOffset = formationDirection * e.sway;
        formationDirection *= -1;
      }
    }
    diveTimer -= dt;
    if (diveTimer <= 0) {
      const available = enemies.filter(enemy => enemy.mode === 'formation');
      const active = enemies.length - available.length;
      const launchCount = Math.min(d.activationBatch, Math.max(0, d.activeCap - active));
      for (let count = 0; count < launchCount && available.length; count++) {
        const index = Math.floor(Math.random() * available.length);
        const enemy = available.splice(index, 1)[0];
        enemy.mode = 'dive'; enemy.activeTime = 0; chooseDiagonal(enemy);
      }
      diveTimer = d.diveInterval;
    }
    for (const enemy of enemies) {
      if (enemy.mode === 'formation') Object.assign(enemy, slot(enemy));
      else if (enemy.mode === 'dive') {
        enemy.activeTime = (enemy.activeTime || 0) + dt;
        moveDiver(enemy, d.diveSpeed * dt);
      }
    }
    if (playerShot) {
      playerShot.previousY = playerShot.y;
      movePixels(playerShot, 'y', -CONFIG.shot.speed * dt);
      const hit = enemies.findIndex(enemy => hitByPlayer(playerShot, enemy));
      if (hit !== -1) {
        const enemy = enemies[hit];
        explosion(enemy.x, enemy.y, enemy.type === 'flagship' ? CONFIG.colors.yellow : CONFIG.colors.red);
        sound('kill');
        const diving = enemy.mode !== 'formation';
        addScore(enemy.type === 'flagship' ? (diving ? e.points.divingFlagship : e.points.flagship) :
          (diving ? e.points.diver : e.points.formation));
        enemies.splice(hit, 1); playerShot = null;
      } else if (playerShot.y < -CONFIG.shot.height) playerShot = null;
    }
    for (const shot of enemyShots) {
      const previousY = shot.y;
      movePixels(shot, 'x', shot.vx * dt); movePixels(shot, 'y', shot.vy * dt);
      const half = (CONFIG.shot.height + p.height) / 2;
      if (Math.abs(shot.x - playerX) < (CONFIG.shot.width + p.width) / 2 &&
          Math.min(previousY, shot.y) - half <= p.y &&
          Math.max(previousY, shot.y) + half >= p.y) {
        if (invulnerabilityTimer <= 0) { loseShip(); return; }
        shot.consumed = true;
      }
    }
    enemyShots = enemyShots.filter(shot => !shot.consumed && shot.x >= -CONFIG.shot.width &&
      shot.x <= CONFIG.width + CONFIG.shot.width && shot.y >= -CONFIG.shot.height &&
      shot.y < e.combatBottom);
    if (invulnerabilityTimer <= 0 && enemies.some(enemy => overlaps(enemy.x, enemy.y, e.width, e.height,
      playerX, p.y, p.width, p.height))) { loseShip(); return; }
    // Contacts resolve first. Escaping divers disappear without score; their bullets survive.
    enemies = enemies.filter(enemy => enemy.x >= -e.width && enemy.x <= CONFIG.width + e.width &&
      enemy.y >= -e.height && enemy.y < e.combatBottom);
    for (const enemy of enemies) {
      if (enemy.mode === 'dive' && enemy.y + e.height / 2 < e.combatBottom &&
          !enemyShots.some(shot => shot.owner === enemy)) {
        enemyShots.push({ x: enemy.x, y: enemy.y + e.height / 2,
          vx: 0, vy: d.shotSpeed, owner: enemy });
      }
    }
    if (!enemies.length) { wave++; startWave(true); }
  }

  function sprite(pattern, x, y, color, scale = CONFIG.art.pixel) {
    ctx.fillStyle = color;
    const left = Math.round(x - pattern[0].length * scale / 2);
    const top = Math.round(y - pattern.length * scale / 2);
    pattern.forEach((row, iy) => [...row].forEach((cell, ix) => {
      if (cell === '1') ctx.fillRect(left + ix * scale, top + iy * scale, scale, scale);
    }));
  }
  function number(value, x, y, right = false, padding = 6, color = CONFIG.colors.yellow) {
    const text = String(value).padStart(padding, '0');
    const s = CONFIG.art.digitPixel;
    if (right) x -= text.length * 4 * s - s;
    ctx.fillStyle = color;
    [...text].forEach((char, index) => digits[Number(char)].forEach((row, iy) => {
      [...row].forEach((cell, ix) => {
        if (cell === '1') ctx.fillRect(x + index * 4 * s + ix * s, y + iy * s, s, s);
      });
    }));
  }
  function text(value, x, y, font, color = CONFIG.colors.white, align = 'center') {
    ctx.font = font; ctx.textAlign = align; ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
  function drawHUD() {
    const h = CONFIG.hud, a = CONFIG.art, c = CONFIG.colors;
    number(score, h.margin, h.digitY);
    number(highScore, CONFIG.width - h.margin, h.digitY, true);
    text('E', h.margin, h.bottomY + h.baselineOffset, a.textFont, c.red);
    ctx.strokeStyle = c.green;
    ctx.strokeRect(h.barX, h.barY, h.barWidth, h.barHeight);
    ctx.fillStyle = c.green;
    ctx.fillRect(h.barX + h.barInset, h.barY + h.barInset,
      Math.round((h.barWidth - h.barInset * 2) * Math.max(0, energy / CONFIG.player.energy)), h.barHeight - h.barInset * 2);
    const reserves = Math.max(0, ships - 1);
    const waveWidth = (String(wave).length * 4 - 1) * a.digitPixel;
    const waveRight = CONFIG.width - h.margin;
    let reserveRight = waveRight - waveWidth - h.reserveWaveGap;
    if (reserves > h.reserveIcons) {
      number(reserves, reserveRight, h.waveDigitY, true, 1, c.green);
      reserveRight -= (String(reserves).length * 4 - 1) * a.digitPixel + h.reserveCountGap;
    }
    const visibleReserves = Math.min(reserves, h.reserveIcons);
    const reserveStart = reserveRight - sprites.player[0].length * a.reservePixel / 2 - (visibleReserves - 1) * h.reserveGap;
    for (let i = 0; i < visibleReserves; i++) {
      sprite(sprites.player, reserveStart + i * h.reserveGap, h.bottomY, c.green, a.reservePixel);
    }
    number(wave, waveRight, h.waveDigitY, true, 1, c.red);
    text('← → / A D   SPACE: FIRE   ENTER: START   ESC: PAUSE   ' +
      (muted ? 'M: OFF' : 'M: ON') + (CONFIG.debug.enabled ? '   F2: DEBUG' : ''),
      CONFIG.width / 2, h.controlsY, a.smallFont);
  }
  function draw() {
    const c = CONFIG.colors, a = CONFIG.art, s = CONFIG.screen;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    ctx.fillStyle = c.yellow;
    for (const star of stars) ctx.fillRect(star.x, star.y, CONFIG.stars.size, CONFIG.stars.size);
    if (state === 'play' || state === 'paused') {
      for (const enemy of enemies) {
        const baseColor = enemy.type === 'flagship' ? c.yellow : enemy.type === 'green' ? c.green : c.red;
        const activeBlink = enemy.mode === 'dive' && Math.floor((enemy.activeTime || 0) / CONFIG.enemy.blinkInterval) % 2 === 0;
        sprite(enemy.type === 'flagship' ? sprites.flagship : sprites.enemy,
          enemy.x, enemy.y, activeBlink ? c.white : baseColor);
      }
      const playerColor = flashTimer > 0 || (invulnerabilityTimer > 0 &&
        Math.floor(invulnerabilityTimer / CONFIG.polish.blinkInterval) % 2 === 0) ? c.white : c.cyan;
      sprite(sprites.player, playerX, CONFIG.player.y, playerColor);
      if (playerShot) {
        ctx.fillStyle = c.white;
        ctx.fillRect(Math.round(playerShot.x - CONFIG.shot.width / 2), Math.round(playerShot.y - CONFIG.shot.height / 2),
          CONFIG.shot.width, CONFIG.shot.height);
      }
      ctx.fillStyle = c.white;
      for (const shot of enemyShots) ctx.fillRect(Math.round(shot.x - CONFIG.shot.width / 2),
        Math.round(shot.y - CONFIG.shot.height / 2), CONFIG.shot.width, CONFIG.shot.height);
      if (waveTimer > 0) text('WAVE ' + wave, CONFIG.width / 2, CONFIG.polish.bannerY, a.headingFont, c.yellow);
      if (state === 'paused') {
        ctx.fillStyle = '#000';
        ctx.fillRect(s.pauseBoxX, s.pauseBoxY, s.pauseBoxWidth, s.pauseBoxHeight);
        text('PAUSED', CONFIG.width / 2, s.pauseY, a.headingFont, c.yellow);
        text('ESC TO RESUME', CONFIG.width / 2, s.resumeY, a.textFont, c.green);
      }
    } else if (state === 'start') {
      text('SPACE ATTACK', CONFIG.width / 2, s.titleY, a.titleFont, c.yellow);
      text('DEFEND AGAINST THE ARMADA', CONFIG.width / 2, s.subtitleY, a.smallFont, c.cyan);
      text('← → OR A / D TO MOVE', CONFIG.width / 2, s.moveY, a.textFont);
      text('SPACE TO FIRE / ESC TO PAUSE', CONFIG.width / 2, s.fireY, a.textFont);
      text('PRESS ENTER TO START', CONFIG.width / 2, s.promptY, a.textFont, c.green);
    } else {
      text('GAME OVER', CONFIG.width / 2, s.overY, a.headingFont, c.red);
      const scoreWidth = (String(score).padStart(6, '0').length * 4 - 1) * a.digitPixel;
      number(score, Math.round((CONFIG.width - scoreWidth) / 2), s.scoreY);
      text('PRESS ENTER TO RESTART', CONFIG.width / 2, s.restartY, a.textFont, c.green);
    }
    for (const effect of explosions) {
      const elapsed = CONFIG.polish.explosionDuration - effect.remaining;
      ctx.fillStyle = effect.color;
      for (let i = 0; i < CONFIG.polish.explosionParticles; i++) {
        const angle = i * Math.PI * 2 / CONFIG.polish.explosionParticles;
        ctx.fillRect(Math.round(effect.x + Math.cos(angle) * elapsed * CONFIG.polish.explosionSpeed),
          Math.round(effect.y + Math.sin(angle) * elapsed * CONFIG.polish.explosionSpeed),
          CONFIG.polish.particleSize, CONFIG.polish.particleSize);
      }
    }
    drawHUD();
  }
  function clearInput() { keys.clear(); playerRemainder = 0; lastTime = null; tickAccumulator = 0; }
  window.addEventListener('keydown', event => {
    if (event.code === 'F2') {
      event.preventDefault(); if (!event.repeat) setDebug(!debugOpen); return;
    }
    if (debugOpen) {
      if (event.code === 'Escape') { event.preventDefault(); setDebug(false); }
      return;
    }
    if (!handledKeys.has(event.code)) return;
    event.preventDefault();
    unlockAudio();
    if (event.code === 'KeyM') {
      if (!event.repeat) { muted = !muted; resetLowEnergyAlarm(); syncAudio(); }
    } else if (event.code === 'Escape') {
      if (!event.repeat && (state === 'play' || state === 'paused')) {
        state = state === 'play' ? 'paused' : 'play';
        clearInput();
        syncAudio();
      }
    } else if (event.code === 'Enter') {
      if (!event.repeat && (state === 'start' || state === 'gameover')) startRun();
    } else if (state === 'play' && waveTimer <= 0) keys.add(event.code);
  });
  window.addEventListener('keyup', event => {
    if (handledKeys.has(event.code)) event.preventDefault();
    keys.delete(event.code);
  });
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', clearInput);
  document.getElementById('debug-next').addEventListener('click', () => skipToWave(Math.min(CONFIG.debug.maxWave, wave + 1)));
  document.getElementById('debug-jump').addEventListener('click', () => skipToWave(debugWave.value));
  document.getElementById('debug-close').addEventListener('click', () => setDebug(false));
  // This is the only loop. Starting, losing ships, and restarting never schedule another.
  function frame(time) {
    const dt = lastTime === null ? 0 : Math.min(CONFIG.maxStep, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    if (!debugOpen && !document.hidden && document.hasFocus() && (state === 'play' || state === 'gameover')) {
      tickAccumulator += dt;
      while (tickAccumulator >= CONFIG.tick) {
        const previousState = state;
        update(CONFIG.tick);
        tickAccumulator -= CONFIG.tick;
        if (state !== previousState) { tickAccumulator = 0; break; }
      }
    } else tickAccumulator = 0;
    draw();
    requestAnimationFrame(frame);
  }
  draw();
  requestAnimationFrame(frame);
})();
