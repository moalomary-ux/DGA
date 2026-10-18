const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const times=process.argv[3].split(',').map(Number), out=process.argv[2];
  const b=await chromium.launch({args:['--force-device-scale-factor=1']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text())});
  await p.goto('file://'+process.cwd()+'/render.html?render=1');
  await p.waitForFunction(()=>window.__ready===true,null,{timeout:15000});
  for(const t of times){ await p.evaluate(t=>window.__setTime(t),t); await p.screenshot({path:`${out}/f_${String(t).replace('.','_')}.png`}); }
  console.log(errs.length?errs.join('\n'):'no console errors');
  await b.close();
})();
