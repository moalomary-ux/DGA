// Quick check of single frames: node tools/test_frames.js <outdir> <t1,t2,...> [page]  (run from motion/build)
const pw=require('/opt/node-tools/node_modules/playwright');
(async()=>{
  const times=process.argv[3].split(',').map(Number),out=process.argv[2],page=process.argv[4]||'render.html';
  const b=await pw.chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text())});
  const t0=Date.now();
  await p.goto('file://'+process.cwd()+'/'+page+'?render=1'+(process.env.QS||''));
  await p.waitForFunction(()=>window.__ready===true,null,{timeout:120000}).catch(()=>console.log('NOT READY'));
  console.log('boot ms',Date.now()-t0);
  for(const t of times){const s=Date.now();await p.evaluate(t=>window.__setTime(t),t);await p.screenshot({path:`${out}/f_${String(t).replace('.','_')}.png`});console.log(t,Date.now()-s,'ms');}
  console.log(errs.length?errs.slice(0,6).join('\n'):'no console errors');await b.close();})();
