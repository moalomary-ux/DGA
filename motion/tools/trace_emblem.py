import numpy as np, cv2, json, os
from skimage.morphology import skeletonize
m=cv2.imread('emblem_mask_raw.png',0)
pad=40
m=cv2.copyMakeBorder(m,pad,pad,pad,pad,cv2.BORDER_CONSTANT,value=0)
m=cv2.GaussianBlur(m,(0,0),2.0);m=(m>127).astype(np.uint8)*255
H,W=m.shape
ys,xs=np.where(m>0);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
U=1000.0/(x1-x0);cx,cy=(x0+x1)/2,(y0+y1)/2
cnts,hier=cv2.findContours(m,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE);hier=hier[0]
def conv(c):
    c=cv2.approxPolyDP(c,1.2,True)[:,0,:].astype(float)
    return [[round((p[0]-cx)*U,2),round(-(p[1]-cy)*U,2)] for p in c]
shapes=[]
for i,c in enumerate(cnts):
    if hier[i][3]==-1 and cv2.contourArea(c)>500:
        holes=[];j=hier[i][2]
        while j!=-1:
            if cv2.contourArea(cnts[j])>200: holes.append(conv(cnts[j]))
            j=hier[j][0]
        bb=cv2.boundingRect(c)
        shapes.append({'outer':conv(c),'holes':holes,'top':-(bb[1]-cy)*U,'bottom':-(bb[1]+bb[3]-cy)*U})
d=cv2.distanceTransform(m,cv2.DIST_L2,5).astype(np.float32)
B=30.0;t=np.clip(d/B,0,1)
h=1-(1-t)**2.2
h=h*0.75+np.clip(d/90.0,0,1)**0.7*0.25
sk=skeletonize(m>0).astype(np.float32)
sk=cv2.GaussianBlur(sk,(0,0),3.0);sk=sk/sk.max()
yy0=np.arange(H)[:,None]
trunk_zone=np.zeros_like(m,dtype=bool)
# trunk: palm component rows between crown bottom and trunk base, narrow central band
cxp=int(cx);tz0=int(y0+(y1-y0)*0.40);tz1=int(y0+(y1-y0)*0.63)
trunk_zone[tz0:tz1,cxp-140:cxp+140]=True
thin=(d>10)&(d<55)
h=h-0.22*sk*thin*(~trunk_zone)
# horizontal rings on the trunk where its width steps
wid=(m[:,cxp-140:cxp+140]>0).sum(1).astype(np.float32)
for y in range(tz0+4,tz1-4):
    if abs(wid[y+3]-wid[y-3])>6 and wid[y]>20:
        h[y-3:y+3,cxp-140:cxp+140]-=0.12*(m[y-3:y+3,cxp-140:cxp+140]>0)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
crown=(yy<y0+(y1-y0)*0.42).astype(np.float32)
stri=0.5+0.5*np.sin((xx*0.9+yy*0.55)/3.2)
h=h-0.035*stri*crown*(t>0.6)
h=(np.clip(h,0,1)*(m>0)).astype(np.float32)
hb=cv2.GaussianBlur(h,(0,0),1.3)
k=6.0
gx=cv2.Sobel(hb,cv2.CV_32F,1,0,ksize=3);gy=cv2.Sobel(hb,cv2.CV_32F,0,1,ksize=3)
nx=-gx*k;ny=gy*k;nz=np.ones_like(nx);L=np.sqrt(nx*nx+ny*ny+nz*nz)
nrm=(np.dstack([(nx/L*0.5+0.5),(ny/L*0.5+0.5),(nz/L*0.5+0.5)])*255).astype(np.uint8)
mx=20;X0,X1,Y0,Y1=x0-mx,x1+mx,y0-mx,y1+mx
nrm_c=nrm[Y0:Y1,X0:X1];mask_c=m[Y0:Y1,X0:X1];h_c=(hb[Y0:Y1,X0:X1]*255).astype(np.uint8)
TW=2048;TH=int(round(TW*(Y1-Y0)/(X1-X0)))
cv2.imwrite('emb_normal.jpg',cv2.cvtColor(cv2.resize(nrm_c,(TW,TH),interpolation=cv2.INTER_AREA),cv2.COLOR_RGB2BGR),[cv2.IMWRITE_JPEG_QUALITY,93])
cv2.imwrite('emb_mask.png',cv2.resize(mask_c,(1024,int(1024*TH/TW)),interpolation=cv2.INTER_AREA))
cv2.imwrite('emb_height.png',cv2.resize(h_c,(1024,int(1024*TH/TW)),interpolation=cv2.INTER_AREA))
uv={'x0':(X0-cx)*U,'x1':(X1-cx)*U,'y0':-(Y1-cy)*U,'y1':-(Y0-cy)*U}
json.dump({'shapes':shapes,'uv':uv,'w':(x1-x0)*U,'h':(y1-y0)*U},open('emblem4.json','w'))
for f in ['emb_normal.jpg','emb_mask.png','emb_height.png','emblem4.json']: print(f,os.path.getsize(f)//1024,'KB')
print('shapes',[(len(s['outer']),len(s['holes']),round(s['top']),round(s['bottom'])) for s in shapes],'uv',{k:round(v,1) for k,v in uv.items()})
cv2.imwrite('h_prev.png',cv2.resize(h_c,(512,int(512*TH/TW))))
