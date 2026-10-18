/* ===== 3D core: renderer, studio environment, gold material, relief plates, 3D emblem ===== */
const W=1080,H=1920,CAM_Z=3583;               // camera distance so that 1 world unit = 1 stage px on the z=0 plane
const GL=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas:GL,antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(W,H,false);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,W/H,50,14000);camera.position.set(0,0,CAM_Z);
const wx=x=>x-540, wy=y=>960-y;                 // stage px -> world

/* studio environment (dark room with strip lights) -> PMREM */
(function(){
  const env=new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60,32,16),new THREE.MeshBasicMaterial({color:new THREE.Color(.03,.05,.04),side:THREE.BackSide})));
  const strip=(w,h,pos,col)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));m.position.set(...pos);m.lookAt(0,0,0);env.add(m);};
  strip(46,5,[-26,34,22],new THREE.Color(26,22,15));strip(5,50,[40,0,14],new THREE.Color(12,10,7));strip(60,4,[0,-30,24],new THREE.Color(6,8,6));
  strip(24,24,[-40,-6,10],new THREE.Color(5,4.4,3));strip(14,14,[10,40,-8],new THREE.Color(18,16,12));strip(30,8,[24,20,30],new THREE.Color(10,9,6));
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(env,0.015).texture;
})();
const keyLight=new THREE.DirectionalLight(0xfff0c8,0.9);keyLight.position.set(-600,700,900);scene.add(keyLight);
const rimLight=new THREE.DirectionalLight(0x57e0a0,0.5);rimLight.position.set(800,-300,-400);scene.add(rimLight);

const GOLD=new THREE.Color(1.0,0.70,0.26);
function goldMat(o={}){return new THREE.MeshPhysicalMaterial(Object.assign({color:GOLD.clone(),metalness:1,roughness:.30,clearcoat:.25,clearcoatRoughness:.25,envMapIntensity:1.25},o));}
function tex(c,srgb=true){const t=new THREE.CanvasTexture(c);t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=8;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
const cnv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

/* ---- relief: height canvas -> smooth normal map ---- */
const RELIEF={
  heightToNormal(hc,strength=3){
    const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data;
    const out=cnv(w,h),o=out.getContext('2d'),img=o.createImageData(w,h),d=img.data;
    const Hh=(x,y)=>src[(Math.min(h-1,Math.max(0,y))*w+Math.min(w-1,Math.max(0,x)))*4]/255;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const dx=(Hh(x+1,y-1)+2*Hh(x+1,y)+Hh(x+1,y+1))-(Hh(x-1,y-1)+2*Hh(x-1,y)+Hh(x-1,y+1));
      const dy=(Hh(x-1,y+1)+2*Hh(x,y+1)+Hh(x+1,y+1))-(Hh(x-1,y-1)+2*Hh(x,y-1)+Hh(x+1,y-1));
      let nx=-dx*strength,ny=dy*strength,nz=1;const l=Math.hypot(nx,ny,nz);nx/=l;ny/=l;nz/=l;
      const i=(y*w+x)*4;d[i]=(nx*.5+.5)*255;d[i+1]=(ny*.5+.5)*255;d[i+2]=(nz*.5+.5)*255;d[i+3]=255;}
    o.putImageData(img,0,0);return out;},
  blur(c,px){const o=cnv(c.width,c.height),x=o.getContext('2d');x.filter=`blur(${px}px)`;x.drawImage(c,0,0);return o;},
  mix(a,b,wb){const o=cnv(a.width,a.height),x=o.getContext('2d');x.drawImage(a,0,0);x.globalAlpha=wb;x.drawImage(b,0,0);return o;},
  soft(c,r){return RELIEF.mix(RELIEF.blur(c,r),RELIEF.blur(c,Math.max(.6,r/3.4)),.45);}
};
/* plate: draw(ctx,w,h,S) paints white shapes on black; returns a mesh of worldW x worldH with embossed metal */
function reliefPlate(draw,pw,ph,worldW,worldH,o={}){
  const m=cnv(pw,ph),x=m.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,pw,ph);draw(x,pw,ph);
  const nrm=RELIEF.heightToNormal(RELIEF.soft(m,o.bevel||4),o.strength||5);
  const mat=(o.material||goldMat)({normalMap:Object.assign(tex(nrm,false),{}),normalScale:new THREE.Vector2(o.ns||1.5,o.ns||1.5),alphaMap:tex(m,false),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  if(o.map)mat.map=tex(o.map,true);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(worldW,worldH),mat);return mesh;}
function textPlate(text,font,fill,worldH,o={}){
  const t=cnv(16,16).getContext('2d');t.font=font;const w=Math.ceil(t.measureText(text).width),size=parseInt(font.match(/(\d+)px/)[1]);
  const pad=Math.round(size*.35),pw=w+pad*2,ph=Math.round(size*1.7);
  const mesh=reliefPlate((x,pw,ph)=>{x.font=font;x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.direction='rtl';x.fillText(text,pw/2,ph*.54);},pw,ph,pw*(worldH/ph),worldH,o);
  mesh.userData.aspect=pw/ph;return mesh;}

/* ---- 3D emblem (extruded parts, caps mapped into a shared relief normal map) ---- */
function emblemHeight(S=1.3){
  const Wd=Math.round(1020*S),Hd=Math.round(1100*S),CXe=EM2.CX;
  const mk=()=>{const c=cnv(Wd,Hd),x=c.getContext('2d');x.scale(S,S);return[c,x];};
  const [hc,hx]=mk();hx.fillStyle='#000';hx.fillRect(0,0,1020,1100);
  const P=d=>new Path2D(d);
  function part(d,gray,mir){hx.save();if(mir){hx.translate(2*CXe,0);hx.scale(-1,1);}hx.fillStyle=`rgb(${gray},${gray},${gray})`;hx.fill(P(d));hx.strokeStyle='#000';hx.lineWidth=3.2;hx.lineJoin='round';hx.stroke(P(d));hx.restore();}
  function line(d,w,gray,mir){hx.save();if(mir){hx.translate(2*CXe,0);hx.scale(-1,1);}hx.strokeStyle=`rgb(${gray},${gray},${gray})`;hx.lineWidth=w;hx.lineCap='round';hx.stroke(P(d));hx.restore();}
  [false,true].forEach((mir,si)=>{const g=si?150:130;
    part(EM2.sword.blade,g,mir);line(EM2.sword.grip,22,g+10,mir);line(EM2.sword.guard,16,g+14,mir);part(EM2.sword.pommel,g+20,mir);
    EM2.sword.caps.split('M').filter(Boolean).forEach(s=>part('M'+s,g+20,mir));
    hx.save();if(mir){hx.translate(2*CXe,0);hx.scale(-1,1);}hx.strokeStyle='rgba(0,0,0,.55)';hx.lineWidth=5;hx.lineCap='round';hx.stroke(P(EM2.sword.fuller));hx.restore();});
  part(EM2.mound,140,false);part(EM2.trunk,170,false);
  EM2.ridges.forEach(d=>{hx.strokeStyle='rgba(0,0,0,.6)';hx.lineWidth=3;hx.stroke(P(d));});
  EM2.low.forEach(r=>part(r.d,150,false));
  EM2.rays.forEach((r,i)=>{const cn=Math.abs(i-(EM2.rays.length-1)/2);part(r.d,215-cn*6,false);hx.strokeStyle='rgba(0,0,0,.5)';hx.lineWidth=2.4;hx.stroke(P(r.vein));});
  return hc;}
let EMB_NORMAL=null;
function emblemNormalTex(){if(!EMB_NORMAL){const hc=emblemHeight(1.3);EMB_NORMAL=tex(RELIEF.heightToNormal(RELIEF.soft(hc,5),5),false);}return EMB_NORMAL;}
function buildEmblem3D(){
  const UW=1020,UH=1100,CX=EM2.CX,CY=EM2.CY,g=new THREE.Group(),parts=[];
  const baseMat=goldMat({normalMap:emblemNormalTex(),normalScale:new THREE.Vector2(1.5,1.5),transparent:true});
  const uvGen={generateTopUV(geo,v,a,b,c){const f=i=>new THREE.Vector2((v[i*3]+CX)/UW,1-(CY-v[i*3+1])/UH);return[f(a),f(b),f(c)];},generateSideWallUV(){const q=new THREE.Vector2(.003,.003);return[q,q,q,q];}};
  const svgNS='http://www.w3.org/2000/svg',holder=document.createElementNS(svgNS,'svg');holder.style.cssText='position:absolute;width:0;height:0;visibility:hidden';document.body.appendChild(holder);
  const sample=(d,step=3)=>{const p=document.createElementNS(svgNS,'path');p.setAttribute('d',d);holder.appendChild(p);const L=p.getTotalLength(),n=Math.max(8,Math.ceil(L/step)),pts=[];for(let i=0;i<=n;i++){const q=p.getPointAtLength(L*i/n);pts.push([q.x,q.y]);}holder.removeChild(p);return pts;};
  const T=(p,mir)=>new THREE.Vector2((mir?2*CX-p[0]:p[0])-CX,-(p[1]-CY));
  const shapeFrom=(pts,mir)=>{const s=new THREE.Shape();pts.forEach((p,i)=>{const v=T(p,mir);i?s.lineTo(v.x,v.y):s.moveTo(v.x,v.y);});s.closePath();return s;};
  const ribbon=(pts,w,mir)=>{const L=[],R=[];for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;L.push([pts[i][0]+nx*w/2,pts[i][1]+ny*w/2]);R.push([pts[i][0]-nx*w/2,pts[i][1]-ny*w/2]);}return shapeFrom(L.concat(R.reverse()),mir);};
  const add=(shape,depth,z,bevel)=>{const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.9,bevelSegments:4,curveSegments:2,UVGenerator:uvGen});
    const m=new THREE.Mesh(geo,baseMat);m.position.z=z;m.userData.z=z;g.add(m);parts.push(m);return m;};
  [false,true].forEach((mir,si)=>{const z0=si?6:0;
    add(shapeFrom(sample(EM2.sword.blade,4),mir),10,z0,2.2);add(ribbon(sample(EM2.sword.grip,4),22,mir),12,z0+2,2.4);add(ribbon(sample(EM2.sword.guard,4),16,mir),14,z0+3,2.4);
    add(shapeFrom(sample(EM2.sword.pommel,2),mir),14,z0+3,2.6);EM2.sword.caps.split('M').filter(Boolean).forEach(s=>add(shapeFrom(sample('M'+s,2),mir),14,z0+3,2));});
  add(shapeFrom(sample(EM2.mound,3),false),22,12,3);add(shapeFrom(sample(EM2.trunk,3),false),26,16,3.2);
  EM2.low.forEach((r,i)=>add(shapeFrom(sample(r.d,3),false),12,18+i,2.4));
  EM2.rays.forEach((r,i)=>{const cn=Math.abs(i-(EM2.rays.length-1)/2);add(shapeFrom(sample(r.d,3),false),12,20+(7-cn)*2.4,2.6);});
  holder.remove();
  return{group:g,parts};}
/* instance with per-part materials so each part can fade/flash on its own */
function emblemInstance(){const e=buildEmblem3D();e.parts.forEach(p=>{p.material=p.material.clone();});e.mats=e.parts.map(p=>p.material);return e;}
const EASE={out3:x=>1-Math.pow(1-x,3),io2:x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2,out5:x=>1-Math.pow(1-x,5)};
const clampf=(x,a=0,b=1)=>x<a?a:x>b?b:x;
/* build-up: parts land one after another from behind with a hot flash; p in 0..1 */
function emblemReveal(e,p,spread=.5){
  const n=e.parts.length;
  e.parts.forEach((m,i)=>{const q=EASE.out3(clampf((p-i/n*spread)/(1-spread))),mat=m.material;
    m.visible=q>0.001;mat.opacity=clampf(q*1.4);m.position.z=m.userData.z-(1-q)*320;const s=.9+.1*q;m.scale.set(s,s,1);
    const hot=Math.pow(1-q,2);mat.emissive=mat.emissive||new THREE.Color();mat.emissive.setRGB(1.0*hot*1.1,.62*hot*1.1,.2*hot*1.1);});}
function emblemSolid(e){e.parts.forEach(m=>{m.visible=true;m.material.opacity=1;m.position.z=m.userData.z;m.scale.set(1,1,1);m.material.emissive.setRGB(0,0,0);});}

/* ===== shared 3D builders (need fonts loaded) ===== */
const FONT_D='Kufam, "Noto Kufi Arabic", sans-serif';
function bendToCylinder(mesh,R){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sqrt(Math.max(1,R*R-x*x))+1.5);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();}
function curvedPlate(mesh,R){const w=mesh.geometry.parameters.width,h=mesh.geometry.parameters.height;mesh.geometry.dispose();mesh.geometry=new THREE.PlaneGeometry(w,h,48,1);bendToCylinder(mesh,R);return mesh;}
/* icon medallion: ring + icon strokes embossed (white = raised) */
const ICON_PATHS={
  star:['M0 -38L10 -10L38 0L10 10L0 38L-10 10L-38 0L-10 -10Z','M-27 -27L27 27M27 -27L-27 27'],
  crown:['M-40 22L-46 -22L-20 -3L0 -34L20 -3L46 -22L40 22Z','M-40 34H40'],
  peak:['M-46 32L-11 -18L8 8L24 -10L48 32Z','M-11 -18V-48L18 -40L-11 -32'],
  lock:['M-28 -4H28V34Q28 38 24 38H-24Q-28 38 -28 34Z','M-17 -4V-18a17 17 0 0 1 34 0V-4','M0 12v10'],
  heart:['M0 36C-44 8 -38 -30 -16 -30C-5 -30 0 -22 0 -17C0 -22 5 -30 16 -30C38 -30 44 8 0 36Z'],
  person:['M-15 -22a15 15 0 1 0 30 0a15 15 0 1 0 -30 0Z','M-36 36C-36 8 -18 0 0 0C18 0 36 8 36 36Z'],
  check:['M-18 2L-5 15L20 -14']
};
function iconPlate(name,worldS,o={}){
  const S=512;const mesh=reliefPlate((x,w,h)=>{x.translate(w/2,h/2);x.scale(w/150,w/150);x.strokeStyle='#fff';x.lineCap='round';x.lineJoin='round';
    if(o.ring!==false){x.lineWidth=6;x.beginPath();x.arc(0,0,66,0,Math.PI*2);x.stroke();x.lineWidth=2.2;x.setLineDash([2,6]);x.beginPath();x.arc(0,0,57,0,Math.PI*2);x.stroke();x.setLineDash([]);}
    x.lineWidth=o.lw||5;x.scale(o.is||1,o.is||1);ICON_PATHS[name].forEach(d=>x.stroke(new Path2D(d)));},S,S,worldS,worldS,{bevel:5,strength:6,ns:1.6});return mesh;}
/* round coin with enamel face; lines = [{t,font,y,fill}] */
function makeCoin(R,lines,o={}){
  const g=new THREE.Group(),S=1024,k=S/(2*R);
  const col=cnv(S,S),cx=col.getContext('2d'),hh=cnv(S,S),hx=hh.getContext('2d');
  const grd=cx.createRadialGradient(S/2,S*.4,S*.05,S/2,S/2,S/2);grd.addColorStop(0,'#14583d');grd.addColorStop(1,'#04200f');cx.fillStyle=grd;cx.fillRect(0,0,S,S);
  hx.fillStyle='rgb(70,70,70)';hx.fillRect(0,0,S,S);
  const ring=(r,w,dash)=>{[[cx,'#f2cf7a'],[hx,'#fff']].forEach(([c,f])=>{c.save();c.strokeStyle=f;c.lineWidth=w*k;c.setLineDash(dash?dash.map(v=>v*k):[]);c.beginPath();c.arc(S/2,S/2,r*k,0,7);c.stroke();c.restore();});};
  ring(R*.93,12);ring(R*.80,3,[3,9]);ring(R*.70,2.4);
  [[-1,1]].forEach(()=>{});
  lines.forEach(L=>{[[cx,L.fill||'#f2cf7a'],[hx,'#fff']].forEach(([c,f])=>{c.save();c.font=L.font.replace(/(\d+)px/,(m,n)=>(n*k)+'px');c.fillStyle=f;c.textAlign='center';c.textBaseline='middle';c.direction='rtl';c.fillText(L.t,S/2,S/2+L.y*k);c.restore();});});
  const nrm=RELIEF.heightToNormal(RELIEF.soft(hh,3.5),4.2);
  const faceMat=new THREE.MeshPhysicalMaterial({map:tex(col,true),normalMap:tex(nrm,false),normalScale:new THREE.Vector2(1.4,1.4),metalness:.88,roughness:.26,clearcoat:.45,clearcoatRoughness:.2,envMapIntensity:1.2});
  const face=new THREE.Mesh(new THREE.CircleGeometry(R*.97,128),faceMat);face.position.z=15;g.add(face);
  const prof=[[R-18,-18],[R-4,-15],[R+6,-6],[R+8,0],[R+6,8],[R-4,16],[R-18,19]].map(p=>new THREE.Vector2(p[0],p[1]));
  const rim=new THREE.Mesh(new THREE.LatheGeometry(prof,128),goldMat({roughness:.26}));rim.rotation.x=Math.PI/2;g.add(rim);
  return{group:g,face,rim,mats:[faceMat,rim.material]};
}

/* emblem silhouette as a flat relief plate (cheap emblem for small uses) */
function emblemMaskCanvas(S=1.3){
  const c=cnv(Math.round(1020*S),Math.round(1100*S)),x=c.getContext('2d');x.scale(S,S);x.fillStyle='#000';x.fillRect(0,0,1020,1100);x.fillStyle='#fff';
  const P=d=>new Path2D(d);
  [false,true].forEach(mir=>{x.save();if(mir){x.translate(2*EM2.CX,0);x.scale(-1,1);}x.fill(P(EM2.sword.blade));x.strokeStyle='#fff';x.lineCap='round';x.lineWidth=22;x.stroke(P(EM2.sword.grip));x.lineWidth=16;x.stroke(P(EM2.sword.guard));x.fill(P(EM2.sword.pommel));EM2.sword.caps.split('M').filter(Boolean).forEach(s=>x.fill(P('M'+s)));x.restore();});
  x.fill(P(EM2.mound));x.fill(P(EM2.trunk));EM2.low.forEach(r=>x.fill(P(r.d)));EM2.rays.forEach(r=>x.fill(P(r.d)));return c;}
let EMB_MASK=null;
function emblemPlate(scale){if(!EMB_MASK)EMB_MASK=tex(emblemMaskCanvas(),false);
  const m=goldMat({normalMap:emblemNormalTex(),normalScale:new THREE.Vector2(1.5,1.5),alphaMap:EMB_MASK,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  return new THREE.Mesh(new THREE.PlaneGeometry(1020*scale,1100*scale),m);}
/* pill badge: dark enamel, gold border + text raised */
function badgePlate(text,font,worldH){
  const t=cnv(16,16).getContext('2d');t.font=font;const tw=Math.ceil(t.measureText(text).width),size=parseInt(font.match(/(\d+)px/)[1]);
  const pw=tw+Math.round(size*1.6),ph=Math.round(size*1.9),col=cnv(pw,ph),hh=cnv(pw,ph),alpha=cnv(pw,ph);
  const rr=(x,r,inset,fill,stroke,lw)=>{x.beginPath();const a=inset,b=pw-inset,c=inset,d=ph-inset,rad=(d-c)/2;x.moveTo(a+rad,c);x.arcTo(b,c,b,d,rad);x.arcTo(b,d,a,d,rad);x.arcTo(a,d,a,c,rad);x.arcTo(a,c,b,c,rad);x.closePath();if(fill){x.fillStyle=fill;x.fill();}if(stroke){x.strokeStyle=stroke;x.lineWidth=lw;x.stroke();}};
  const cx=col.getContext('2d'),hx=hh.getContext('2d'),ax=alpha.getContext('2d');
  ax.fillStyle='#000';ax.fillRect(0,0,pw,ph);rr(ax,0,2,'#fff');
  const g=cx.createLinearGradient(0,0,0,ph);g.addColorStop(0,'#0f4a33');g.addColorStop(1,'#06261a');rr(cx,0,2,g);rr(cx,0,5,null,'#f2cf7a',4);
  hx.fillStyle='#000';hx.fillRect(0,0,pw,ph);rr(hx,0,2,'rgb(80,80,80)');rr(hx,0,5,null,'#fff',4);
  [[cx,'#f6dc92'],[hx,'#fff']].forEach(([c,f])=>{c.font=font;c.fillStyle=f;c.textAlign='center';c.textBaseline='middle';c.direction='rtl';c.fillText(text,pw/2,ph*.54);});
  const nrm=RELIEF.heightToNormal(RELIEF.soft(hh,2.4),4);
  const mat=new THREE.MeshPhysicalMaterial({map:tex(col,true),normalMap:tex(nrm,false),alphaMap:tex(alpha,false),transparent:true,metalness:.8,roughness:.3,clearcoat:.3,envMapIntensity:1.1,side:THREE.DoubleSide,depthWrite:false});
  return new THREE.Mesh(new THREE.PlaneGeometry(pw*(worldH/ph),worldH),mat);}

/* ===== v4: emblem traced from the official artwork (EM4) ===== */
renderer.localClippingEnabled=true;
let EM4TEX=null,EM4SHADOW=null;
function loadEM4(){return new Promise(res=>{const L=new THREE.TextureLoader();let n=0;const done=()=>{if(++n===2)res();};
  EM4TEX={};EM4TEX.normal=L.load(EM4.normal,t=>{t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;done();},undefined,done);EM4TEX.mask=L.load(EM4.mask,()=>done(),undefined,done);});}
function em4Shadow(){if(!EM4SHADOW){const im=EM4TEX.mask.image,c=cnv(im.width,im.height),x=c.getContext('2d');x.filter='blur(14px)';x.drawImage(im,0,0);EM4SHADOW=tex(c,false);}return EM4SHADOW;}
function emblem4Instance(){
  const g=new THREE.Group(),inner=new THREE.Group();g.add(inner);
  const u=EM4.uv,uw=u.x1-u.x0,vh=u.y1-u.y0;
  const uvGen={generateTopUV(geo,v,a,b,c){const f=i=>new THREE.Vector2((v[i*3]-u.x0)/uw,(v[i*3+1]-u.y0)/vh);return[f(a),f(b),f(c)];},generateSideWallUV(){const q=new THREE.Vector2(.001,.001);return[q,q,q,q];}};
  const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),1e5);
  const mat=goldMat({normalMap:EM4TEX.normal,normalScale:new THREE.Vector2(1.7,1.7),clippingPlanes:[plane],transparent:true});
  EM4.shapes.forEach(s=>{const sh=new THREE.Shape(s.outer.map(p=>new THREE.Vector2(p[0],p[1])));(s.holes||[]).forEach(h=>sh.holes.push(new THREE.Path(h.map(p=>new THREE.Vector2(p[0],p[1])))));
    const geo=new THREE.ExtrudeGeometry(sh,{depth:16,bevelEnabled:true,bevelThickness:4,bevelSize:2.5,bevelSegments:3,curveSegments:1,UVGenerator:uvGen});
    inner.add(new THREE.Mesh(geo,mat));});
  const sm=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.55,alphaMap:em4Shadow(),depthWrite:false,clippingPlanes:[plane]});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(uw,vh),sm);shadow.position.set(16,-24,-36);inner.add(shadow);
  const edge=new THREE.Mesh(new THREE.PlaneGeometry(1250,9),new THREE.MeshBasicMaterial({color:0xfff2c8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));edge.position.z=50;inner.add(edge);
  const flare=new THREE.Mesh(new THREE.PlaneGeometry(1250,140),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,alphaMap:(()=>{const c=cnv(4,128),x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#000');gr.addColorStop(.5,'#fff');gr.addColorStop(1,'#000');x.fillStyle=gr;x.fillRect(0,0,4,128);return tex(c,false);})()}));flare.position.z=48;inner.add(flare);
  return{group:g,inner,mat,plane,shadow,edge,flare};
}
const _v=new THREE.Vector3();
/* rise: 0..1 reveals the emblem from the swords up to the crown; glow adds a hot emissive pulse */
function emblem4Set(e,rise,opacity=1,glow=0){
  e.group.visible=opacity>.003&&rise>0;if(!e.group.visible)return;
  const lvl=lerp(-600,620,rise);_v.set(0,lvl,0);e.group.updateMatrixWorld(true);_v.applyMatrix4(e.inner.matrixWorld);
  e.plane.normal.set(0,-1,0);e.plane.constant=rise>=1?1e5:_v.y;
  e.mat.opacity=opacity;e.shadow.material.opacity=.5*opacity;
  const live=rise>0&&rise<1;e.edge.position.y=lvl;e.flare.position.y=lvl;e.edge.material.opacity=live?.95*opacity:0;e.flare.material.opacity=live?.35*opacity:0;
  e.mat.emissive.setRGB(glow,glow*.68,glow*.22);
}
/* sample points inside the official silhouette, in emblem units (y up) */
function em4Samples(step=7,seed=11){
  const im=EM4TEX.mask.image,c=cnv(im.width,im.height),x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data,u=EM4.uv,r=rng(seed),out=[];
  for(let py=0;py<c.height;py+=step)for(let px=0;px<c.width;px+=step){const jx=Math.min(c.width-1,Math.round(px+r()*step)),jy=Math.min(c.height-1,Math.round(py+r()*step));
    if(d[(jy*c.width+jx)*4]>128)out.push([u.x0+jx/c.width*(u.x1-u.x0),u.y1-jy/c.height*(u.y1-u.y0)]);}
  return out;}
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const lerp=(a,b,t)=>a+(b-a)*t;
/* felt texture for the background */
function feltDataURL(){const S=512,c=cnv(S,S),x=c.getContext('2d'),r=rng(91),img=x.createImageData(S,S);
  for(let i=0;i<img.data.length;i+=4){const v=118+(r()-.5)*70;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}x.putImageData(img,0,0);
  x.globalAlpha=.10;x.lineWidth=1;for(let k=0;k<2600;k++){const a=r()*6.283,l=4+r()*14,px=r()*S,py=r()*S;x.strokeStyle=r()<.5?'#fff':'#000';x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}
  x.globalAlpha=1;const o=cnv(S,S),ox=o.getContext('2d');ox.filter='blur(.6px)';ox.drawImage(c,0,0);return o.toDataURL('image/jpeg',.9);}
