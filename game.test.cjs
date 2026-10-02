// Developer checks only; this file is not loaded by the game.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/game.js', 'utf8');
const expose = `globalThis.test = { CONFIG, update, draw, startRun, addScore, loseShip, startWave, difficulty, frame, chooseDiagonal, moveDiver, setDebug, skipToWave,
 get: () => ({state, score, highScore, wave, ships, energy, bonusAwarded, playerX, playerShot, enemies, enemyShots, diveTimer, keys, lastTime, explosions, flashTimer, invulnerabilityTimer, waveTimer, muted, beepTimer, debugOpen}),
 set: v => { if ('energy' in v) energy=v.energy; if ('enemies' in v) enemies=v.enemies;
 if ('enemyShots' in v) enemyShots=v.enemyShots; if ('playerShot' in v) playerShot=v.playerShot;
 if ('wave' in v) wave=v.wave; if ('diveTimer' in v) diveTimer=v.diveTimer; } };`;
function harness(storageMode = 'ok', stored = '0', withAudio = false) {
  const events = {}, docEvents = {}, queue = [], writes = [];
  const rectangles = [], labels = [];
  const context = new Proxy({fillRect: (...args) => rectangles.push(args),
    fillText: value => labels.push(value)}, {get: (o, k) => o[k] || (() => {})});
  const deterministicMath = Object.create(Math); deterministicMath.random = () => 0.999;
  const sandbox = { Math: deterministicMath, Number, String, Set, Array, console,
    document: { hidden: false, hasFocus: () => true,
      getElementById: () => ({getContext: () => context, addEventListener(){}, focus(){}}),
      addEventListener: (name, fn) => { docEvents[name] = fn; } },
    window: {addEventListener: (name, fn) => { events[name] = fn; }},
    localStorage: {getItem: () => {if (storageMode === 'read-fail') throw Error(); return stored;},
      setItem: (k, v) => {if (storageMode === 'write-fail') throw Error(); writes.push([k,v]);}},
    requestAnimationFrame: fn => queue.push(fn) };
  const tones = [];
  if (withAudio) sandbox.window.AudioContext = class {
    constructor() {this.state='running';this.currentTime=0;this.destination={};}
    createGain() {return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
    createOscillator() {return {frequency:{setValueAtTime(){}},connect(){},disconnect(){},
      start(){tones.push(this.soundName);},stop(){}};}
  };
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, expose + '\n})();'), sandbox);
  let prevented = 0;
  const key = (code, type = 'keydown', repeat = false) => events[type]({code, repeat, preventDefault: () => prevented++});
  return { t: sandbox.test, sandbox, events, docEvents, queue, writes, key, rectangles, labels, tones, prevented: () => prevented };
}
const h = harness(), t = h.t, c = t.CONFIG;
assert.equal(t.get().state, 'start'); assert.equal(h.queue.length, 1);
h.key('Enter'); assert.equal(t.get().state, 'play');
assert.equal(t.get().ships, 3); assert.equal(t.get().energy, 100);
assert.equal(t.get().enemies.length, 41); assert.equal(h.queue.length, 1);
h.key('KeyD'); t.update(0.1); assert.equal(t.get().playerX, 345); assert(t.get().energy < 100);
h.key('ArrowRight'); t.update(10); assert.equal(t.get().playerX, c.width - c.player.width / 2);
h.events.blur(); assert.equal(t.get().keys.size, 0);
t.startRun();
h.key('Space'); t.update(0); const firstShot = t.get().playerShot; const energy = t.get().energy;
t.update(0); assert.equal(t.get().playerShot, firstShot); assert.equal(t.get().energy, energy);
h.key('Space', 'keyup');
t.set({playerShot: {x: -20, y: -20, previousY: -20}}); t.update(0); assert.equal(t.get().playerShot, null);
const enemy = t.get().enemies.find(e => e.type === 'red');
t.set({playerShot: {x: enemy.x, y: enemy.y + 20, previousY: enemy.y + 20}});
t.update(0.05); assert.equal(t.get().score, 50); assert.equal(t.get().enemies.length, 40);
t.update(0); assert.equal(t.get().score, 50);
const target = t.get().enemies.find(e => e.type === 'green');
target.mode = 'dive'; t.chooseDiagonal(target);
t.set({playerShot: {x: target.x, y: target.y, previousY: target.y}}); t.update(0);
assert.equal(t.get().score, 150);
const flagship = t.get().enemies.find(e => e.type === 'flagship');
t.set({playerShot: {x: flagship.x, y: flagship.y, previousY: flagship.y}}); t.update(0);
assert.equal(t.get().score, 350); assert.equal(t.get().highScore, 350);
t.addScore(4650); assert.equal(t.get().ships, 4); assert(t.get().bonusAwarded);
t.addScore(5000); assert.equal(t.get().ships, 4);
const d1 = t.difficulty(); t.set({enemies: []}); t.update(0); const d2 = t.difficulty();
assert.equal(t.get().wave, 2); assert.equal(t.get().enemies.length, 41);
assert(d2.swaySpeed > d1.swaySpeed && d2.diveInterval < d1.diveInterval && d2.shotSpeed > d1.shotSpeed);
t.startRun(); t.set({diveTimer: 0}); t.update(0.01);
const diver = t.get().enemies.find(e => e.mode === 'dive'); assert(diver);
assert.equal(t.get().enemyShots.filter(s => s.owner === diver).length, 1);
const initialBullet = t.get().enemyShots.find(s => s.owner === diver);
assert.equal(initialBullet.vx, 0); assert(initialBullet.vy > 0);
const bulletX = initialBullet.x;
t.update(0.03); assert.equal(initialBullet.x, bulletX);
assert.equal(t.get().enemyShots.filter(s => s.owner === diver).length, 1);
// Test commitment independently: player crossing cannot change direction mid-segment.
const segment = {x: 300, y: 150}; t.chooseDiagonal(segment);
const sign = segment.direction, distance = c.enemy.height * c.enemy.segmentShipLengths;
t.moveDiver(segment, distance / 2);
h.key('KeyA'); t.update(0.1); h.events.blur();
assert.equal(segment.direction, sign);
t.moveDiver(segment, distance / 2);
assert(Math.abs(segment.segmentRemaining) < 0.000001);
assert(Math.abs(segment.y - 150 - distance / Math.SQRT2) < 1);
t.moveDiver(segment, 1); assert.equal(segment.direction, -1);
const edgeSegment = {x:c.enemy.width / 2, y:150};
t.chooseDiagonal(edgeSegment); assert.equal(edgeSegment.direction, 1);
t.moveDiver(edgeSegment, distance); assert(edgeSegment.x >= c.enemy.width / 2);
// After a bottom exit there is no score, no return, and an already-fired bullet survives.
t.startRun(); const escape = t.get().enemies[0];
escape.mode = 'dive'; escape.x = 100; escape.y = c.enemy.combatBottom - 1; t.chooseDiagonal(escape);
t.set({enemyShots: [{x:100, y:250, vx:0, vy:190, owner: escape}], diveTimer: 100});
t.update(0.03); assert(!t.get().enemies.includes(escape)); assert.equal(t.get().score, 0);
assert(t.get().enemyShots.some(s => s.owner === escape));
// The same owner fires again only once its previous bullet is removed.
t.startRun(); const shooter = t.get().enemies[0]; shooter.mode = 'dive'; t.chooseDiagonal(shooter);
t.set({diveTimer:100}); t.update(0);
const oldBullet = t.get().enemyShots[0]; oldBullet.x=50; oldBullet.y=c.enemy.combatBottom - 1;
t.update(0.03); assert(!t.get().enemyShots.includes(oldBullet));
assert.equal(t.get().enemyShots.filter(s => s.owner === shooter).length, 1);
// Lower launch positions reduce bullet lifetime without a firing timer.
function shotLifetime(y) {
  const f = harness(); f.t.startRun(); const owner=f.t.get().enemies[0];
  owner.mode='dive'; owner.x=50; owner.y=y; f.t.chooseDiagonal(owner);
  f.t.set({diveTimer:100}); f.t.update(0);
  const bullet=f.t.get().enemyShots[0]; let elapsed=0;
  while(f.t.get().enemyShots.includes(bullet) && elapsed<10) {f.t.update(0.01); elapsed+=0.01;}
  return elapsed;
}
assert(shotLifetime(400) < shotLifetime(150));
t.startRun(); t.set({enemyShots: [
  {x:320, y:c.player.y, vx:0, vy:0}, {x:320, y:c.player.y, vx:0, vy:0}]});
t.update(0); assert.equal(t.get().ships, 2); assert.equal(t.get().energy, 100);
t.update(0); assert.equal(t.get().ships, 2); assert.equal(t.get().enemyShots.length, 0);
const collider = t.get().enemies[0]; collider.mode='dive'; collider.x=320; collider.y=c.player.y; t.chooseDiagonal(collider);
t.update(0); assert.equal(t.get().ships, 2); // The replacement is still protected.
collider.mode='formation'; Object.assign(collider, {x:collider.homeX,y:collider.homeY});
t.update(c.polish.invulnerability + c.tick);
collider.mode='dive'; collider.x=320; collider.y=c.player.y; t.chooseDiagonal(collider);
t.update(0); assert.equal(t.get().ships, 1); t.update(0); assert.equal(t.get().ships, 1);
t.set({energy: 0}); t.update(0); assert.equal(t.get().state, 'gameover'); assert.equal(t.get().ships, 0);
const final = t.get().score; t.update(1); assert.equal(t.get().score, final);
h.key('Enter'); assert.equal(t.get().state, 'play'); assert.equal(t.get().score, 0);
assert.equal(t.get().wave, 1); assert.equal(t.get().ships, 3); assert.equal(t.get().energy, 100);
assert.equal(t.get().bonusAwarded, false); assert.equal(t.get().enemyShots.length, 0);
assert.equal(t.get().playerShot, null); assert.equal(t.get().keys.size, 0); assert.equal(h.queue.length, 1);
t.set({enemyShots: [{x:-50,y:300,vx:0,vy:0}]}); t.update(0); assert.equal(t.get().enemyShots.length, 0);
t.get().enemies[0].mode='dive'; t.get().enemies[0].x=-100; t.chooseDiagonal(t.get().enemies[0]);
t.update(0); assert.equal(t.get().enemies.length, 40);
h.key('ArrowLeft'); h.key('Space'); assert(h.prevented() >= 2);
h.docEvents.visibilitychange(); assert.equal(t.get().keys.size, 0); assert.equal(t.get().lastTime, null);
h.key('KeyD'); h.queue.shift()(1000); h.queue.shift()(61000);
assert(t.get().playerX <= 320 + c.player.speed * c.maxStep + 0.001); assert.equal(h.queue.length, 1);
for (const mode of ['read-fail','write-fail']) {
  const f = harness(mode); f.t.startRun(); f.t.addScore(200); f.t.startRun();
  assert.equal(f.t.get().highScore, 200);
}
assert.equal(harness('ok', '12345').t.get().highScore, 12345);
assert.equal(harness('ok', '-42').t.get().highScore, 0);
assert(h.writes.length > 0);
const paused = harness(); paused.key('Enter'); paused.key('KeyD'); paused.key('Space');
paused.key('Escape'); const snapshot = JSON.stringify(paused.t.get());
paused.t.update(10); assert.equal(JSON.stringify(paused.t.get()), snapshot);
assert.equal(paused.t.get().state, 'paused'); assert.equal(paused.t.get().keys.size, 0);
paused.key('Enter'); assert.equal(paused.t.get().state, 'paused');
paused.key('Escape','keydown',true); assert.equal(paused.t.get().state, 'paused');
paused.key('Space'); assert.equal(paused.t.get().keys.size, 0);
paused.key('Escape'); assert.equal(paused.t.get().state, 'play');
assert.equal(paused.t.get().lastTime, null); assert.equal(paused.queue.length, 1);
const pixel = harness(); pixel.t.startRun(); pixel.key('KeyD'); pixel.key('Space');
const formationX = pixel.t.get().enemies[0].x;
pixel.t.update(c.tick); assert.equal(pixel.t.get().enemies[0].x, formationX);
for (let i=0; i<14; i++) pixel.t.update(c.tick);
assert.equal(pixel.t.get().enemies[0].x, formationX + c.enemy.swayStep);
pixel.t.set({diveTimer:0});
for (let i=0; i<100; i++) {
  pixel.t.update(c.tick); pixel.t.draw();
  const g=pixel.t.get();
  assert(Number.isInteger(g.playerX));
  for (const entity of [...g.enemies, ...g.enemyShots, ...(g.playerShot ? [g.playerShot] : [])]) {
    assert(Number.isInteger(entity.x) && Number.isInteger(entity.y));
  }
}
assert(pixel.rectangles.every(args => args.every(Number.isInteger)));
assert(!pixel.labels.some(value => /^(SCORE|HIGH SCORE|RESERVE|WAVE)( |$)/.test(value)));
// Fixed ticks preserve travel over the same elapsed time at different frame rates.
function travelAtRate(rate) {
  const f=harness(); f.t.startRun(); f.key('KeyD');
  f.queue.shift()(0);
  for(let i=1;i<=rate;i++) f.queue.shift()(i*1000/rate);
  return f.t.get().playerX;
}
assert(Math.abs(travelAtRate(60) - travelAtRate(144)) <= Math.ceil(c.player.speed*c.tick));
console.log('PASS: core simulation, diagonal commitments, straight owned bullets/refiring, bottom escapes, pause/resume, scoring/bonus, lethal collisions, energy, wave escalation, restart/single loop, input, timestep, storage fallback.');
console.log('PASS: integer entity/draw coordinates, label-free HUD, stepped formation, fixed tick travel at 60/144 Hz.');
const polish = harness(); polish.t.startRun();
const victim = polish.t.get().enemies[0];
polish.t.set({playerShot:{x:victim.x,y:victim.y,previousY:victim.y}}); polish.t.update(0);
assert.equal(polish.t.get().explosions.length,1); assert.equal(polish.t.get().enemies.length,40);
const killScore=polish.t.get().score; polish.t.update(c.polish.explosionDuration + c.tick);
assert.equal(polish.t.get().explosions.length,0); assert.equal(polish.t.get().score,killScore);
polish.t.set({enemies:[]}); polish.t.update(0);
assert.equal(polish.t.get().waveTimer,c.polish.waveDuration); assert.equal(polish.t.get().wave,2);
const bannerX=polish.t.get().enemies[0].x, bannerEnergy=polish.t.get().energy;
polish.key('Space'); polish.t.update(0.5);
assert.equal(polish.t.get().playerShot,null); assert.equal(polish.t.get().energy,bannerEnergy);
assert.equal(polish.t.get().enemies[0].x,bannerX);
polish.key('Escape'); const pausedBanner=polish.t.get().waveTimer;
polish.t.update(1); assert.equal(polish.t.get().waveTimer,pausedBanner); polish.key('Escape');
polish.t.update(c.polish.waveDuration); assert.equal(polish.t.get().waveTimer,0);
polish.t.loseShip(); assert(polish.t.get().flashTimer>0); assert(polish.t.get().invulnerabilityTimer>0);
polish.t.set({enemyShots:[{x:320,y:c.player.y,vx:0,vy:0}]}); polish.t.update(0);
assert.equal(polish.t.get().ships,2); assert.equal(polish.t.get().enemyShots.length,0);
polish.key('KeyM'); assert.equal(polish.t.get().muted,true);
polish.key('KeyM','keydown',true); assert.equal(polish.t.get().muted,true);
polish.t.startRun(); assert.equal(polish.t.get().waveTimer,0); assert.equal(polish.t.get().explosions.length,0);
assert.equal(polish.t.get().invulnerabilityTimer,0); assert.equal(polish.t.get().muted,true);
polish.key('KeyM'); assert.equal(polish.t.get().muted,false);
console.log('PASS: half-rate formation, explosions expire/no extra score, wave banner freezes combat and respects pause, replacement flash/protection expires, restart effects reset, mute toggle/repeat guard/audio-unavailable fallback.');
const rework=harness('ok','0',true); rework.key('Enter');
assert(rework.tones.includes('start'));
const rows=rework.t.get().enemies;
assert.deepEqual(Array.from(c.enemy.rows,row=>row.count),[2,5,7,9,9,9]);
for(let i=0;i<c.enemy.rows.length;i++) {
  const row=rows.filter(e=>e.homeY===c.enemy.top+i*c.enemy.rowGap);
  assert.equal(row.length,c.enemy.rows[i].count);
  assert(row.every(e=>e.type===c.enemy.rows[i].type));
}
assert(c.enemy.top-c.enemy.height/2>c.hud.digitY+5*c.art.digitPixel);
assert(c.enemy.rowGap>c.enemy.height && c.enemy.columnGap>c.enemy.width);
rework.t.set({energy:20,diveTimer:100}); rework.t.update(0);
assert.equal(rework.tones.filter(name=>name==='low').length,1);
rework.t.update(c.audio.beepInterval+c.tick);
assert.equal(rework.tones.filter(name=>name==='low').length,2);
rework.key('Escape'); rework.t.update(10);
assert.equal(rework.tones.filter(name=>name==='low').length,2); rework.key('Escape');
rework.key('KeyM'); rework.t.update(1);
assert.equal(rework.tones.filter(name=>name==='low').length,2); rework.key('KeyM');
rework.t.set({enemies:[]}); rework.t.update(0);
assert.equal(rework.t.get().energy,c.player.energy); assert.equal(rework.t.get().beepTimer,0);
rework.t.update(c.polish.waveDuration); rework.t.update(c.tick);
assert.equal(rework.tones.filter(name=>name==='low').length,2);
rework.t.startRun(); assert.equal(rework.tones.filter(name=>name==='start').length,2);
console.log('PASS: exact six-row counts/colors/UI clearance, wave refuel, start jingle, repeating low-energy alarm, alarm pause/mute/refuel/reset.');
const difficultyCheck=harness(); difficultyCheck.t.startRun();
assert.equal(difficultyCheck.t.difficulty().diveInterval,1.5);
difficultyCheck.t.update(1.49); assert.equal(difficultyCheck.t.get().enemies.filter(e=>e.mode==='dive').length,0);
difficultyCheck.t.update(0.02); assert.equal(difficultyCheck.t.get().enemies.filter(e=>e.mode==='dive').length,1);
for (const [waveNumber,batch] of [[1,1],[5,1],[6,2],[10,2],[11,3]]) {
  difficultyCheck.t.startRun(); difficultyCheck.t.set({wave:waveNumber}); difficultyCheck.t.startWave();
  assert.equal(difficultyCheck.t.difficulty().activationBatch,batch);
  difficultyCheck.t.set({diveTimer:0}); difficultyCheck.t.update(0);
  assert.equal(difficultyCheck.t.get().enemies.filter(e=>e.mode==='dive').length,batch);
}
assert(Math.abs(c.player.movementCost-1.8*1.2)<0.000001);
assert(Math.abs(c.player.shotCost-0.8*1.2)<0.000001);
assert(c.audio.start.notes.length*c.audio.start.noteTime>2);
difficultyCheck.t.startRun(); difficultyCheck.t.addScore(100); difficultyCheck.t.set({energy:10});
difficultyCheck.key('F2'); const menuSnapshot=JSON.stringify(difficultyCheck.t.get());
difficultyCheck.t.update(20); assert.equal(JSON.stringify(difficultyCheck.t.get()),menuSnapshot);
difficultyCheck.t.skipToWave(6); assert.equal(difficultyCheck.t.get().wave,6);
assert.equal(difficultyCheck.t.get().energy,100); assert.equal(difficultyCheck.t.get().score,100);
assert.equal(difficultyCheck.t.get().ships,3); assert.equal(difficultyCheck.t.get().enemies.length,41);
assert.equal(difficultyCheck.t.get().playerShot,null); assert.equal(difficultyCheck.t.get().enemyShots.length,0);
difficultyCheck.t.skipToWave(-1); assert.equal(difficultyCheck.t.get().wave,6);
difficultyCheck.key('Escape'); assert.equal(difficultyCheck.t.get().debugOpen,false);
assert.equal(difficultyCheck.queue.length,1);
console.log('PASS: 1.5s activation, wave 6/11 batches, +20% energy costs, longer jingle, frozen debug menu/skip/refuel/preserved score+ships/cleanup.');
const caps=harness(); caps.t.startRun();
for(const [waveNumber,interval,cap] of [[1,1.5,2],[2,1.375,2],[3,1.25,2],[4,1.125,2],
  [5,1,2],[6,1.5,2],[10,1,2],[11,1.5,3],[20,1,3],[21,1.5,4],[101,1.5,8]]) {
  caps.t.set({wave:waveNumber});
  assert.equal(caps.t.difficulty().diveInterval,interval); assert.equal(caps.t.difficulty().activeCap,cap);
}
caps.t.set({wave:11}); caps.t.startWave(); caps.t.set({diveTimer:0}); caps.t.update(0);
assert.equal(caps.t.get().enemies.filter(e=>e.mode==='dive').length,3);
caps.t.set({diveTimer:0}); caps.t.update(0);
assert.equal(caps.t.get().enemies.filter(e=>e.mode==='dive').length,3);
const activeEnemy=caps.t.get().enemies.find(e=>e.mode==='dive');
caps.t.set({enemies:caps.t.get().enemies.filter(e=>e!==activeEnemy),diveTimer:0}); caps.t.update(0);
assert.equal(caps.t.get().enemies.filter(e=>e.mode==='dive').length,3);
const blinking=caps.t.get().enemies.find(e=>e.mode==='dive');
caps.t.update(c.enemy.blinkInterval); assert(blinking.activeTime>=c.enemy.blinkInterval);
caps.key('Escape'); const blinkTime=blinking.activeTime; caps.t.update(1); assert.equal(blinking.activeTime,blinkTime);
console.log('PASS: five-wave interval ramp/reset, ten-wave active-cap growth/bound, cap enforcement/refill, active blink timer and pause.');

