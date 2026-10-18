// usage: node render_frames.js <worker> <workers>   -> build/frames/f_00000.jpg ...
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const path = require('path'), fs = require('fs');
const FPS = 30, root = path.resolve(__dirname, '..');
const [w, nw] = [+process.argv[2], +process.argv[3]];
(async () => {
  const br = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(root, 'build/render.html') + '?render=1');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  const DUR = await p.evaluate(() => window.__DUR), N = Math.round(DUR * FPS);
  const per = Math.ceil(N / nw), a = w * per, b = Math.min(N, a + per);
  fs.mkdirSync(path.join(root, 'build/frames'), { recursive: true });
  for (let i = a; i < b; i++) {
    await p.evaluate(t => window.__setTime(t), i / FPS);
    await p.screenshot({ path: path.join(root, 'build/frames', `f_${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
    if ((i - a) % 90 === 0) console.log(`worker ${w}: ${i - a}/${b - a}`);
  }
  await br.close();
})();
