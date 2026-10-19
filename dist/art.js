/* GPT 이미지 생성 도구로 만든 배경과 투명 캐릭터를 조합한다.
 * 이 파일에는 배경/인물을 도형으로 그리는 코드가 없다. */
window.Art=(()=>{
 'use strict';
 const images={},paths={train:'train.png',trainDawn:'train-exterior-dawn-v1.png',studio:'studio.png',characters:'characters.png',doyunPhone:'doyun-phone-legs-v6.png',doyunOffer:'doyun-offer-legs-v6.png',doyunSit:'doyun-sit-legs-v6.png',doyunStand:'doyun-stand-legs-v6.png',doyunWalk:'doyun-walk-legs-v6-8frames.png',heroine:'heroine-walk-skirt-v2.png',heroineIdle:'heroine-idle-matched-v2.png',concert:'concert.png',hospital:'hospital.png',memoryLaugh:'memory-laugh-a.png',memoryConcert:'memory-concert-a.png',memoryDoubt:'memory-doubt-dv3-pixel.png',memoryNextSong:'memory-nextsong-b.png',memoryRooftop:'memory-rooftop-a.png',recorder:'recorder.png',film:'memory-film-frame.png',grandmaReflection:'grandma-reflection-profile-v3.png',doyunGuitar:'s17-doyun-guitar.png',doyunTear:'s17-doyun-tear-smile.png'};
 const frames={
  playerIdle:{box:[216,15,129,454],anchor:281},
  playerWalkA:{box:[577,16,219,450],anchor:679},
  playerWalkB:{box:[984,16,227,450],anchor:1094},
  doyunStand:{image:'doyunStand',box:[0,0,186,498],anchor:88,pixel:true},
  doyunOffer:{image:'doyunOffer',box:[0,0,355,397],anchor:240,seat:258,pixel:true},
  doyunSit:{image:'doyunSit',box:[0,0,220,380],anchor:110,seat:245,pixel:true},
  doyunPhone:{image:'doyunPhone',box:[0,0,215,375],anchor:107,seat:240,pixel:true},
  minjaeStand:{box:[1032,471,148,414],anchor:1099},
  minjaeSit:{box:[1389,558,241,328],anchor:1522}
 };
 const WINDOW_REFLECTION_X=780,DOYUN_SEAT_X=1300;
 let loaded=false,error=null;
 const ready=Promise.all(Object.entries(paths).map(([name,file])=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>{images[name]=image;resolve();};image.onerror=()=>reject(new Error(file));image.src='assets/'+file;
 }))).then(()=>{loaded=true;return true;}).catch(e=>{error=e.message;return false;});
 function background(ctx,name,width,height){const image=images[name];if(image)ctx.drawImage(image,0,0,width,height);}
 function cover(ctx,name,width,height){const image=images[name];if(!image)return;const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight);const sw=width/scale,sh=height/scale;ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,0,0,width,height);}
 function sprite(ctx,name,px,py,{scale=.92,mirror=false,alpha=1,seatY=null}={}){
  const f=frames[name];if(!f)return;const image=images[f.image||'characters'];if(!image)return;const [sx,sy,sw,sh]=f.box;
  ctx.save();if(f.pixel)ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.translate(Math.round(px),Math.round(py));ctx.scale(mirror?-1:1,1);
  const top=seatY!==null&&f.seat!==undefined?seatY-py-f.seat*scale:-sh*scale;
  ctx.drawImage(image,sx,sy,sw,sh,Math.round(-(f.anchor-sx)*scale),Math.round(top),Math.round(sw*scale),Math.round(sh*scale));ctx.restore();
 }
 function recorder(ctx,px,py){const image=images.recorder;if(!image)return;const h=40,w=h*260/545;ctx.drawImage(image,625,263,260,545,px-w/2,py-h,w,h);}
 function doyunWalking(ctx,px,py,time,alpha){
  const image=images.doyunWalk;if(!image)return;
  const frame=Math.floor(time*8)%8,scale=.9;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;
  ctx.translate(Math.round(px),Math.round(py));ctx.scale(-1,1);
  ctx.drawImage(image,frame%4*320,Math.floor(frame/4)*544,320,544,
   -160*scale,-522*scale,320*scale,544*scale);ctx.restore();
 }
 function player(ctx,px,py,{walking,walk,mirror}){
  const image=walking?images.heroine:images.heroineIdle;if(!image)return;
  // Both poses share the original idle upper body, cell size, scale and anchor.
  const frame=walking?Math.floor(walk*8)%8:0,scale=418/544;
  ctx.save();ctx.translate(Math.round(px),Math.round(py));ctx.scale(mirror?-1:1,1);
  ctx.drawImage(image,frame%4*320,Math.floor(frame/4)*640,320,640,
   -176*scale,-592*scale,320*scale,640*scale);ctx.restore();
 }
 function windowReflection(ctx,px,phase,mode,revealTime,glimpseRemaining,facing){
  const early=phase==='INTRO'&&mode==='play'&&glimpseRemaining>0;
  if(!early&&!(['WINDOW_REVEALED','WAITING_CLAP','DOYUN_DEPARTED'].includes(phase)||mode==='reveal'))return;
  const image=images.grandmaReflection;if(!image)return;
  const proximity=early?1:Math.max(0,1-Math.abs(px-925)/180);if(!proximity)return;
  // Match the heroine's smaller face, keep the bust at the sill, and mirror with her facing.
  const height=134,width=height*image.naturalWidth/image.naturalHeight;
  const alpha=early?.46*Math.min(1,(1.45-glimpseRemaining)/.22,glimpseRemaining/.32):(mode==='reveal'?.58*Math.min(1,revealTime):.46)*proximity;
  ctx.save();ctx.beginPath();ctx.rect(670,122,240,224);ctx.clip();ctx.globalAlpha=Math.max(0,alpha);
  ctx.imageSmoothingEnabled=false;ctx.filter=early?'grayscale(.8) brightness(.74)':'grayscale(.45) brightness(.8)';
  ctx.translate(WINDOW_REFLECTION_X,0);ctx.scale(facing<0?-1:1,1);
  ctx.drawImage(image,Math.round(-width/2),211,Math.round(width),height);
  ctx.restore();
 }
 function doyunFinal(ctx,px,py,smiling,alpha=1,time=0){
  const image=images[smiling?'doyunTear':'doyunGuitar'];if(!image||alpha<=0)return;
  const h=357,w=h*image.naturalWidth/image.naturalHeight;
  // His feet and seat stay still; only the shoulders follow the last few strums.
  const bob=!smiling?Math.sin(time*13)*1.2:0;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(px),Math.round(py+bob));ctx.scale(-1,1);
  ctx.drawImage(image,Math.round(-w/2),-h,Math.round(w),h);ctx.restore();
 }
 function doyunTear(ctx,px,py,time,alpha){
  if(time<1.64||time>3.23||alpha<=0)return;
  const fall=Math.min(1,Math.max(0,(time-1.77)/1.06));
  const x=px+20+fall*2,y=py-301+fall*32;
  const visibility=Math.min(1,(time-1.64)/.16,(3.23-time)/.28)*alpha;
  ctx.save();ctx.globalAlpha=Math.max(0,visibility);ctx.fillStyle='#fff';
  ctx.fillRect(Math.round(x)-4,Math.round(y),9,1);
  ctx.fillRect(Math.round(x),Math.round(y)-4,1,9);ctx.restore();
 }
 function doyunDissolve(ctx,px,py,time){
  const image=images.doyunTear;if(!image)return;
  const p=Math.min(1,Math.max(0,(time-3.18)/2.6));
  if(p<=0){doyunFinal(ctx,px,py,true);return;}
  const h=357,w=h*image.naturalWidth/image.naturalHeight;
  // Keep a soft translucent silhouette beneath the scattered pixel fragments.
  doyunFinal(ctx,px,py,true,Math.max(0,Math.pow(1-p,1.2)*.72));
  ctx.save();ctx.translate(Math.round(px),Math.round(py));ctx.scale(-1,1);
  const cols=24,rows=36,tw=w/cols,th=h/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const threshold=((col*73+row*151+col*row*17)%101)/101;
   if(threshold<p)continue;
   const sx=col*image.naturalWidth/cols,sy=row*image.naturalHeight/rows;
   ctx.globalAlpha=Math.min(1,(threshold-p)*5)*.42*(1-p);
   ctx.drawImage(image,sx,sy,image.naturalWidth/cols,image.naturalHeight/rows,
    -w/2+col*tw,-h+row*th,tw+.2,th+.2);
  }
  ctx.restore();
 }
 function renderMemory(ctx,s){
  if(!loaded||!s.memory)return;
  const {memory,W,H}=s;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   // The saved memory id 'hospital' remains for compatibility; its selected scene is now the rooftop.
   const selected={laugh:'memoryLaugh',concert:'memoryConcert',doubt:'memoryDoubt',nextSong:'memoryNextSong',hospital:'memoryRooftop'};
   if(selected[memory])cover(ctx,selected[memory],W,H);
   else{
    // 기억의 중심은 도윤과 그의 노래다.
    ctx.save();ctx.translate(-220,0);background(ctx,'studio',1720,H);ctx.restore();
    const seated=memory==='final'||memory==='listen';
    sprite(ctx,seated?'doyunSit':'doyunStand',430,602,{scale:.91});
   }
 }
 function render(ctx,s){
  if(!loaded)return;
  const {world,phase,mode,x,cam,facing,walk,walking,leaveTime,talkingToDoyun,FLOOR,W,H,revealTime=0,glimpseRemaining=0,clapDone=false}=s;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.save();ctx.translate(-Math.round(cam),0);
  if(world==='train'){
   const returned=['WINDOW_PENDING','WINDOW_REVEALED','WAITING_CLAP','DOYUN_DEPARTED','RETURN_TO_TRAIN'].includes(phase);
   background(ctx,returned?'trainDawn':'train',2048,H);
   windowReflection(ctx,x,phase,mode,revealTime,glimpseRemaining,facing);
   const fading=mode==='departure';
   if(phase!=='DOYUN_DEPARTED'||fading){
    if(fading){
     if(leaveTime<1.52)doyunFinal(ctx,DOYUN_SEAT_X,FLOOR,false,1,leaveTime);
     else if(leaveTime<3.18)doyunFinal(ctx,DOYUN_SEAT_X,FLOOR,true);
     else doyunDissolve(ctx,DOYUN_SEAT_X,FLOOR,leaveTime);
     doyunTear(ctx,DOYUN_SEAT_X,FLOOR,leaveTime,Math.min(1,Math.max(0,(5.78-leaveTime)/.6)));
    }
    else if(phase==='WAITING_CLAP'&&(mode==='finalPhrase'||mode==='clap'||clapDone))doyunFinal(ctx,DOYUN_SEAT_X,FLOOR,false,1,walk);
    else{
     // Keep the phone pose until the player actually starts this conversation.
     sprite(ctx,talkingToDoyun?'doyunOffer':'doyunPhone',DOYUN_SEAT_X,FLOOR,
      {scale:talkingToDoyun?.92:.92*334/324,seatY:482});
    }
   }
   if(phase==='DOYUN_DEPARTED'||(fading&&leaveTime>4.5))recorder(ctx,DOYUN_SEAT_X,482);
  }else{
   background(ctx,'studio',1720,H);
   sprite(ctx,'doyunStand',990,FLOOR,{scale:.9});
  }
  if(mode!=='title')player(ctx,x,FLOOR,{walking,walk,mirror:facing<0});
  ctx.restore();
 }
 return {ready,render,renderMemory,frames,get loaded(){return loaded;},get error(){return error;}};
})();
