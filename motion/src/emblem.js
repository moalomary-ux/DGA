/* Emblem v2: palm fan + crossed scimitars, drawn from measurements of the supplied relief photo.
   Coordinates are in "E-space" (px of the enhanced crop); the emblem is centred on EM2.cx,cy and scaled by the user. */
const EM2=(()=>{
  const CX=510, CY=555;                       // emblem centre in E-space (used to recentre)
  const f=n=>Math.round(n*10)/10;
  const P=(pts)=>'M'+pts.map(p=>f(p[0])+' '+f(p[1])).join('L')+'Z';
  const bez=(p0,p1,p2,p3,t)=>{const u=1-t;return[u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]];};
  const dbez=(p0,p1,p2,p3,t)=>{const u=1-t;return[3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]),3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1])];};
  /* ---- crown: fan of leaf rays from the trunk top ---- */
  const O=[505,452];
  function ray(aDeg,L,Wd,bend){
    const N=22,a=aDeg*Math.PI/180,ds=L/N;let x=0,y=0;const sp=[[0,0,a]];
    for(let i=1;i<=N;i++){const th=a+bend*Math.pow(i/N,1.4);x+=Math.cos(th)*ds;y+=Math.sin(th)*ds;sp.push([x,y,th]);}
    const A=[],B=[],mid=[];
    for(let i=0;i<=N;i++){const s=i/N,[px,py,th]=sp[i],nx=-Math.sin(th),ny=Math.cos(th);
      const w=Wd*.5*Math.sqrt(Math.max(0,1-Math.pow(s,5)))*Math.pow(Math.min(1,s/.2),.75)*(1-.12*s)+(i===0?3:0);
      A.push([O[0]+px+nx*w,O[1]+py+ny*w]);B.push([O[0]+px-nx*w,O[1]+py-ny*w]);mid.push([O[0]+px,O[1]+py]);}
    return{d:P(A.concat(B.reverse())),vein:'M'+mid.slice(2,N-1).map(p=>f(p[0])+' '+f(p[1])).join('L'),tip:mid[N]};
  }
  const rays=[];
  const K=14;
  for(let k=0;k<K;k++){
    const u=k/(K-1),ang=202+u*136;                  // 204deg (left) .. 336deg (right) through 270 (up)
    const L=316+70*Math.sin(Math.PI*u)-10*Math.abs(u-.5);
    const bend=-.34*Math.cos(ang*Math.PI/180)*1.0;    // outward droop (+ on right, - on left)
    rays.push(ray(ang,L,66+6*Math.sin(Math.PI*u),bend));
  }
  // short lower rays (the "teeth" under the crown)
  const low=[ray(196,150,44,-.5),ray(344,150,44,.5),ray(214,190,48,-.45),ray(326,190,48,.45)];
  /* ---- trunk + base ---- */
  const trunk='M478 446 C474 540 478 640 470 716 L548 716 C540 640 546 540 536 446 Z';
  const ridges=['M522 470 C514 540 534 600 524 700','M506 470 C500 540 516 610 508 706'];
  const mound='M392 752 C404 722 440 706 474 704 L548 704 C582 704 604 724 624 752 C604 760 584 758 566 748 C548 738 520 740 500 748 C470 758 430 760 392 752 Z';
  /* ---- swords ---- */
  const T=[28,688],G=[604,986],C1=[260,690],C2=[470,792];
  function blade(){
    const N=34,A=[],B=[],mid=[];
    for(let i=0;i<=N;i++){const s=i/N,p=bez(T,C1,C2,G,s),d=dbez(T,C1,C2,G,s),l=Math.hypot(d[0],d[1]),nx=-d[1]/l,ny=d[0]/l;
      const w=(2+58*Math.pow(s,.82))/2;A.push([p[0]+nx*w,p[1]+ny*w]);B.push([p[0]-nx*w,p[1]-ny*w]);mid.push(p);}
    return{d:P(A.concat(B.reverse())),mid};
  }
  const bl=blade();
  const fuller='M'+bl.mid.slice(6,32).map(p=>f(p[0])+' '+f(p[1])).join('L');
  const guard='M566 1030 C556 984 580 952 626 946 C650 944 668 954 666 970';
  const guard2='M601 1000 C640 996 690 1008 742 1024';
  const grip='M612 994 C664 1000 716 1016 776 1038';
  const pommel='M770 1038 a21 21 0 1 0 42 6 a21 21 0 1 0 -42 -6Z';const caps='M652 962 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0Z M556 1030 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0Z';
  const sword={blade:bl.d,fuller,guard,guard2,grip,pommel,caps};
  const mirrorX=x=>2*CX-x; // swords/crown are symmetric around x=CX
  return{CX,CY,rays,low,trunk,ridges,mound,sword,O};
})();

