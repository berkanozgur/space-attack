// Optional browser smoke check. Pass the path to an installed Playwright package.
const { chromium } = require(process.argv[2] || 'playwright');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  const page = await browser.newPage({viewport: {width: 900, height: 760}});
  const errors = [];
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext;
    window.__audioCheck = {contexts: [], oscillators:0, gains:[]};
    if (NativeAudio) window.AudioContext = class extends NativeAudio {
      constructor(...args) { super(...args); window.__audioCheck.contexts.push(this); }
      createOscillator() {window.__audioCheck.oscillators++; return super.createOscillator();}
      createGain() {const gain=super.createGain(); window.__audioCheck.gains.push(gain); return gain;}
    };
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(__dirname + '/index.html').href);
  await page.waitForSelector('canvas');
  await page.screenshot({path: __dirname + '/start-check.png'});
  await page.keyboard.press('Enter');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('Space');
  await page.waitForTimeout(1500);
  await page.keyboard.up('Space');
  const audio = await page.evaluate(() => ({
    count:window.__audioCheck.contexts.length,
    running:window.__audioCheck.contexts[0]?.state,
    oscillators:window.__audioCheck.oscillators
  }));
  assert.equal(audio.count,1); assert.equal(audio.running,'running'); assert(audio.oscillators>0);
  await page.keyboard.press('m');
  await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => window.__audioCheck.gains[0].gain.value),0);
  await page.keyboard.press('m');
  await page.waitForTimeout(80);
  assert(await page.evaluate(() => window.__audioCheck.gains[0].gain.value)>0);
  await page.screenshot({path: __dirname + '/play-check.png'});
  await page.waitForTimeout(1300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const pausedScene = await page.locator('canvas').evaluate(canvas => canvas.toDataURL());
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), pausedScene);
  await page.screenshot({path: __dirname + '/pause-check.png'});
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('canvas').evaluate(canvas => canvas.toDataURL()), pausedScene);
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  await page.setViewportSize({width: 480, height: 720});
  const box = await page.locator('canvas').boundingBox();
  assert(Math.abs(box.width / box.height - 640 / 600) < 0.01);
  assert(box.width <= 480 && box.height <= 720);
  await page.screenshot({path: __dirname + '/resize-check.png'});
  assert.deepEqual(errors, []);
  // Controlled states in a separate page for visual QA; production has no test hooks.
  const fs = require('node:fs');
  const review = await browser.newPage({viewport:{width:900,height:760}});
  await review.setContent(fs.readFileSync(__dirname + '/index.html','utf8')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').replace(/<link[^>]+>/g,'') +
    '<style>' + fs.readFileSync(__dirname + '/style.css','utf8') + '</style>');
  const source = fs.readFileSync(__dirname + '/game.js','utf8').replace(/\}\)\(\);\s*$/, `
    window.review = {startRun, draw, loseShip, update,
      clearArmada: () => {enemies=[]; update(0);},
      killEnemy: () => {const e=enemies[0]; playerShot={x:e.x,y:e.y,previousY:e.y}; update(0);}};
  })();`);
  await review.evaluate(source);
  await review.evaluate(() => {window.review.startRun();window.review.clearArmada();window.review.draw();});
  await review.screenshot({path:__dirname + '/wave-check.png'});
  await review.evaluate(() => {window.review.startRun();window.review.killEnemy();window.review.draw();});
  await review.screenshot({path:__dirname + '/explosion-check.png'});
  await review.evaluate(() => {window.review.loseShip();window.review.draw();});
  await review.screenshot({path:__dirname + '/hit-check.png'});
  await review.evaluate(() => {window.review.loseShip();window.review.loseShip();window.review.draw();});
  await review.screenshot({path:__dirname + '/gameover-check.png'});
  await page.keyboard.press('F2');
  await page.locator('#debug-menu').waitFor({state:'visible'});
  await page.locator('#debug-wave').fill('6');
  await page.locator('#debug-jump').click();
  await page.screenshot({path:__dirname + '/debug-check.png'});
  await page.locator('#debug-close').click();
  await page.locator('#debug-menu').waitFor({state:'hidden'});
  console.log('PASS: direct file launch, actual key input, running single AudioContext/oscillator synthesis/M master mute, Esc pause/frozen scene/resume, Enter ignored during pause, resize/aspect ratio, no browser JS errors; screenshots saved for visual review.');
  await browser.close();
})().catch(error => {console.error(error); process.exitCode = 1;});
