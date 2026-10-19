/* 다음 역 / 도윤 데모. 외부 런타임 없이 동작하는 Canvas 2D 게임. */
(() => {
'use strict';
const $=id=>document.getElementById(id), canvas=$('scene'), ctx=canvas.getContext('2d');
const memoryCanvas=$('memory-scene'), memoryCtx=memoryCanvas.getContext('2d');
const W=1280,H=720,FLOOR=610,SAVE_KEY='next-station-doyun-v1';
const RECORDINGS=['laugh','concert','doubt','nextSong'];
const S17=window.S17_SCENES;
// 한 장면씩 천천히 넘기던 주마등을 화면 전체에 빠르게 스치는 7.4초 기억으로 구성한다.
const MONTAGE_CUTS=[0,.65,1.95,2.4,2.85,3.3,3.75,4.2,4.65,5.1,5.65,6.35],MONTAGE_DURATION=7.4;
let montageImages=[],montagePreparation=null,montageReady=false,montageRequest=0;
function prepareMontageImages(){
 if(!montagePreparation)montagePreparation=Promise.all(MONTAGE_CUTS.map((_,index)=>new Promise((resolve,reject)=>{
  const image=new Image();image.className='montage-frame';image.alt='';image.decoding='async';
  image.onload=()=>{
   const decoded=typeof image.decode==='function'?image.decode():Promise.resolve();
   decoded.then(()=>resolve(image),reject);
  };
  image.onerror=()=>reject(new Error('montage image unavailable'));
  image.src=`assets/s17-life-${String(index+1).padStart(2,'0')}.png`;
 }))).then(images=>{montageImages=images;return images;}).catch(error=>{montagePreparation=null;throw error;});
 return montagePreparation;
}
function cancelMontagePreparation(){montageRequest++;montageReady=false;$('montage-loading').hidden=true;}
// 아트 검증용 미리보기는 실제 플레이 저장에 영향을 주지 않는다.
const previewScene=new URLSearchParams(window.location.search).get('preview');
const previewParams=new URLSearchParams(window.location.search);
const previewFrame=previewScene==='departure'&&previewParams.has('frame')?Number(previewParams.get('frame')):NaN;
const isUIEditor=previewParams.get('uiEditor')==='1';
const isArtPreview=['train','glimpse','first-contact','departure','studio','memory','memory-concert','memory-doubt','memory-next-song','memory-hospital','memory-listen','montage','reveal','reveal-done','clap'].includes(previewScene)||isUIEditor;
const WINDOW_FOCUS_X=780,DOYUN_SEAT_X=1300,DOYUN_INTERACT_X=1080;
const GLIMPSE_X=690,GLIMPSE_DURATION=1.45,REVEAL_LEAD_DURATION=1.3;
const FIRST_CONTACT_DURATION=1.3;
let mode='title',world='train',phase='INTRO',found=[],x=160,facing=1,cam=0,clock=0,last=0,walk=0;
let dialogue=null,dialogueTarget=null,lineIndex=0,onClose=null,choiceIndex=0,memory=null,fadeBusy=false,leaveTime=0,listenTime=0,listenQueued=false,montageTime=0,montageFrame=-1,revealTime=0,clapDone=false;
let returnMode='play',volume=.55,musicStarted=false,toastTimer,settings={textSize:'1'};
let firstContactSeen=false,fractureRemaining=0;
let glimpseSeen=false,glimpseRemaining=0;
const keys=new Set();
let menuFocus=null,menuInert=[];
function focusElement(element){
 if(!element||element.hidden||element.disabled||element.isConnected===false||(typeof element.getClientRects==='function'&&!element.getClientRects().length))return false;
 element.focus?.({preventScroll:true});return true;
}
function focusGame(){focusElement($('game'));}
function focusTitle(){focusElement($('continue').disabled?$('new-game'):$('continue'));}
function openMenuFocus(){
 menuFocus=document.activeElement;
 menuInert=Array.from($('game').children).filter(node=>node!==$('menu')).map(node=>[node,node.inert]);
 for(const [node] of menuInert)node.inert=true;
 focusElement($('resume'));
}
function closeMenuFocus(restore=true){
 for(const [node,inert] of menuInert)node.inert=inert;
 menuInert=[];const previous=menuFocus;menuFocus=null;
 if(restore&&!focusElement(previous))focusGame();
}
function trapMenuTab(event){
 const controls=Array.from($('menu').querySelectorAll('button,input,select')).filter(node=>!node.disabled&&node.getClientRects().length);
 const index=controls.indexOf(document.activeElement);
 if(index<0||(event.shiftKey&&index===0)||(!event.shiftKey&&index===controls.length-1)){
  event.preventDefault();focusElement(event.shiftKey?controls.at(-1):controls[0]);
 }
}
const checkpoints=new Set(['INTRO','STUDIO_OPEN','RECORDINGS_SEARCH','FINAL_RECORDING_OPEN','LIFE_MONTAGE','STUDIO_RETURN','WINDOW_PENDING','WINDOW_REVEALED','WAITING_CLAP','DOYUN_DEPARTED']);
const audio={ctx:null,master:null,ambient:null,score:null};
function audioInit(){
 if(!audio.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{audio.ctx=new AC();audio.master=audio.ctx.createGain();audio.master.gain.value=volume*.22;audio.master.connect(audio.ctx.destination);
 const buffer=audio.ctx.createBuffer(1,audio.ctx.sampleRate*2,audio.ctx.sampleRate),data=buffer.getChannelData(0);let prev=0;
 for(let i=0;i<data.length;i++){prev=(prev+(Math.random()*2-1)*.018)*.995;data[i]=prev;}
 const noise=audio.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;audio.ambient=audio.ctx.createGain();audio.ambient.gain.value=.23;noise.connect(filter).connect(audio.ambient).connect(audio.master);noise.start();
 audio.score=new window.S17Score(audio.ctx,audio.master);
 }catch{audio.ctx=null;return;}}
 audio.ctx.resume().catch(()=>{});
}
function note(freq,start,length=1.1,gain=.18){if(!audio.ctx||!freq)return;const a=audio.ctx,o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.025);g.gain.exponentialRampToValueAtTime(.0001,start+length);o.connect(g).connect(audio.master);o.start(start);o.stop(start+length+.05);}
function tickSound(){if(audio.ctx)note(740,audio.ctx.currentTime,.07,.014);}
function audioTick(){if(!audio.ctx)return;audio.ambient.gain.setTargetAtTime(world==='train'?.23:.055,audio.ctx.currentTime,.6);audio.score?.tick(!['menu','title','exited','clap','reveal'].includes(mode));}
function safeGet(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{return null;}}
function updateContinue(){const s=safeGet(),available=!!(s&&[1,2,3,4].includes(s.version)&&checkpoints.has(s.phase));$('continue').hidden=false;$('continue').disabled=!available||!Art.loaded;$('continue-status').hidden=available;}
function save(){if(isArtPreview||!checkpoints.has(phase))return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:4,phase,world,x,found:[...found],volume,textSize:settings.textSize,firstContactSeen,glimpseSeen,montageTime,clapDone}));}catch{}}
function clearFirstContact(){fractureRemaining=0;$('first-contact-fracture').hidden=true;$('doyun-intrusion').hidden=true;$('doyun-splatter').hidden=true;$('game').classList.remove('first-contact-fracturing');}
function firstContact(){if(firstContactSeen)return;firstContactSeen=true;save();fractureRemaining=FIRST_CONTACT_DURATION;$('first-contact-fracture').hidden=false;$('doyun-intrusion').hidden=false;$('doyun-splatter').hidden=false;$('game').classList.add('first-contact-fracturing');audio.score?.cue('fracture');}
function toast(t){$('toast').textContent=t;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,4100);}
function hud(){const active=!['title','exited','ending','menu','montage','reveal','clap','finalPhrase','flash'].includes(mode)&&$('window-reveal').hidden;$('hud').hidden=!active;$('chapter').hidden=!active||!!memory;$('controls').hidden=!active||!!memory;$('objective').hidden=!active||!!memory;$('touch').hidden=!active||mode!=='play';
 $('place').textContent=world==='train'?'이름 없는 열차':'기억 속 녹음실';
 const chapters=phase==='DOYUN_DEPARTED'?['04 / 04','남아 있는 노래']:['WINDOW_PENDING','WINDOW_REVEALED','WAITING_CLAP'].includes(phase)?['04 / 04','유리창에 남은 삶']:['FINAL_RECORDING_OPEN','LIFE_MONTAGE','STUDIO_RETURN'].includes(phase)?['03 / 04','오늘은 여기까지']:world==='studio'?['02 / 04','네 개의 기억']:['01 / 04','창가의 청년'];
 $('chapter-number').textContent=chapters[0];$('chapter-title').textContent=chapters[1];
 let goal=world==='train'?(phase==='INTRO'?'창가의 청년에게 다가가 보세요':phase==='STUDIO_OPEN'?'오른쪽 연결문으로 함께 이동하세요':phase==='WINDOW_PENDING'?'유리창을 살펴보세요':phase==='WINDOW_REVEALED'?'도윤과 마지막으로 이야기하세요':phase==='WAITING_CLAP'?(clapDone?'도윤의 마지막 연주를 지켜보세요.':'도윤의 마지막 노래를 들어 주세요'):'잠시 머물거나, 다음 칸으로 걸어가세요'):(phase==='STUDIO_RETURN'?'왼쪽 문으로 열차에 돌아가세요':phase==='FINAL_RECORDING_OPEN'?'컴퓨터에서 마지막 파일을 확인하세요':'서랍, 공연 안내장, 건반, 컴퓨터를 살펴보세요');
 $('recording-count').hidden=world!=='studio';
 $('recording-count').textContent=`녹음 ${found.length} / ${RECORDINGS.length}`;
 $('objective').textContent=goal;
}
function setPlay(){mode='play';$('dialogue').hidden=true;dialogue=null;dialogueTarget=null;memory=null;hud();focusGame();}
function say(lines,done,scene,target=null){mode='dialogue';keys.clear();dialogue=lines;dialogueTarget=target;lineIndex=0;choiceIndex=0;onClose=done||(()=>setPlay());memory=scene||null;$('dialogue').hidden=false;$('hint').hidden=true;hud();showLine();}
function speakerLabel(value=''){
 const label=value.match(/^\s*(.+?)\s*[·.\/]\s*(기억|문자)\s*$/);
 return label?`${label[1].trim()}\n${label[2]}`:value;
}
function showLine(){const item=dialogue[lineIndex];$('choices').replaceChildren();$('advance').hidden=false;
 const sceneCue=item.choices?item.memory:item[2]?.memory;
 if(sceneCue!==undefined){memory=sceneCue;hud();}
 const narrator=!!item.actions||(!item.choices&&!item[0]);
 $('dialogue').classList.toggle('is-narration',narrator);
 $('speaker').textContent='';
 if(item.choices){$('speaker').textContent=item.actions?'':'나';$('line').textContent=item.prompt||'어떤 말을 건넬까요?';$('advance').hidden=true;item.choices.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v[0];b.onclick=()=>choose(i);b.onfocus=()=>{choiceIndex=i;focusChoice(false);};$('choices').append(b);});focusChoice();}
 else{$('speaker').textContent=speakerLabel(item[0]||'');$('line').textContent=item[1];focusElement($('advance'));} }

// 문장마다 높이를 바꾸지 않는다. 화면/설정이 바뀔 때 모든 대사의 최대 자연 높이를 잰다.
let dialogueMeasurementKey='';
function measureDialogueHeight(force=false){
 const live=$('dialogue'),game=$('game');
 if(typeof live.cloneNode!=='function')return;
 const bounds=game.getBoundingClientRect(),key=[bounds.width,bounds.height,window.innerWidth,window.innerHeight,settings.textSize].join(':');
 if(!force&&dialogueMeasurementKey===key)return;
 const wasHidden=live.hidden,oldVisibility=live.style.visibility;
 live.style.visibility='hidden';live.hidden=false;
 const width=live.getBoundingClientRect().width;
 live.hidden=wasHidden;live.style.visibility=oldVisibility;
 if(!width)return;
 const probe=live.cloneNode(true);probe.removeAttribute('id');probe.hidden=false;probe.classList.add('dialogue-sizing-probe');
 probe.querySelectorAll('[id]').forEach(el=>{el.classList.add('measure-'+el.id);el.removeAttribute('id');});
 Object.assign(probe.style,{width:width+'px',height:'auto',minHeight:'0',maxHeight:'none',visibility:'hidden',pointerEvents:'none',position:'absolute',left:'0',right:'auto',top:'0',bottom:'auto',overflow:'auto'});
 probe.setAttribute('aria-hidden','true');game.append(probe);
 const pSpeaker=probe.querySelector('.measure-speaker'),pLine=probe.querySelector('.measure-line'),pChoices=probe.querySelector('.measure-choices'),pAdvance=probe.querySelector('.measure-advance');
 let height=0;
 const entries=[...Object.values(STORY).flat(),...Object.entries(S17).filter(([key,value])=>key!=='memoryStages'&&Array.isArray(value)).flatMap(([,value])=>value)];
 for(const entry of entries){
  probe.classList.toggle('is-narration',!entry.choices&&!entry[0]);
  pChoices.replaceChildren();pAdvance.hidden=!!entry.choices;
  if(entry.choices){pSpeaker.textContent='나';pLine.textContent='어떤 말을 건넬까요?';for(const choice of entry.choices){const button=document.createElement('button');button.textContent=choice[0];pChoices.append(button);}}
  else{pSpeaker.textContent=speakerLabel(entry[0]||'');pLine.textContent=entry[1];}
  window.UILayout?.applyProbe?.(probe,bounds.width/1280,window.UILayoutRuntime?.get());height=Math.max(height,probe.getBoundingClientRect().height);
 }
 // 선택 후 생성되는 주인공의 말과 도윤의 답변도 측정에 포함한다.
 for(const entry of entries.filter(item=>item.choices))for(const choice of entry.choices)for(const [speaker,content] of [['나',choice[0]],['도윤',choice[1]]]){
  probe.classList.remove('is-narration');pSpeaker.textContent=speakerLabel(speaker);pLine.textContent=content;pChoices.replaceChildren();pAdvance.hidden=false;window.UILayout?.applyProbe?.(probe,bounds.width/1280,window.UILayoutRuntime?.get());height=Math.max(height,probe.getBoundingClientRect().height);
 }
 probe.remove();game.style.setProperty('--dialogue-fixed-height',Math.ceil(height+2)+'px');dialogueMeasurementKey=key;
}
function focusChoice(moveFocus=true){const buttons=Array.from($('choices').children);buttons.forEach((b,i)=>{b.style.borderColor=i===choiceIndex?'#d5dbc5':'';});if(moveFocus)focusElement(buttons[choiceIndex]);}
function choose(i){const item=dialogue[lineIndex];if(!item||!item.choices)return;if(item.actions){tickSound();item.actions[i]();return;}dialogue=[...dialogue.slice(0,lineIndex),['나',item.choices[i][0]],['도윤',item.choices[i][1]],...dialogue.slice(lineIndex+1)];showLine();tickSound();}
function showWindowReveal(){const el=$('window-reveal');el.classList.toggle('dawn',world==='train'&&['WINDOW_PENDING','WINDOW_REVEALED','WAITING_CLAP','DOYUN_DEPARTED'].includes(phase));el.hidden=false;}
function afterCue(name){
 if(name==='blackWindowMotif'){audio.score?.cue('fragment');return false;}
 if(name==='glassFracture'){firstContact();mode='flash';$('dialogue').hidden=true;hud();return true;}
 if(name==='unfinishedMotif'){audio.score?.cue('fragment');return false;}
 if(name==='recordingVoiceBreak'){audio.score?.cue('unfinished');return false;}
 if(name==='elderlyReflection'){mode='reveal';revealTime=0;$('dialogue').hidden=true;showWindowReveal();hud();return true;}
 if(name==='doyunLastPhrase'){phase='WAITING_CLAP';save();mode='finalPhrase';listenTime=0;$('dialogue').hidden=true;memory=null;audio.score?.cue('finalPhrase');return true;}
 return false;
}
window.addEventListener('ui-layout-measure',()=>measureDialogueHeight(true));
function advance(){if(mode!=='dialogue'||!dialogue)return;const item=dialogue[lineIndex];if(item.choices){choose(choiceIndex);return;}tickSound();lineIndex++;const cue=item[2]?.cueAfter;if(cue&&afterCue(cue))return;if(lineIndex>=dialogue.length){const fn=onClose;dialogue=null;dialogueTarget=null;$('dialogue').hidden=true;memory=null;fn();}else showLine();}
async function transition(fn){if(fadeBusy)return;fadeBusy=true;keys.clear();$('hint').hidden=true;$('fade').classList.add('on');await new Promise(r=>setTimeout(r,470));fn();cam=Math.max(0,Math.min(worldWidth()-W,x-W*.38));$('fade').classList.remove('on');fadeBusy=false;}
function worldWidth(){return world==='train'?2048:1720;}
function fresh(){if(!Art.loaded)return;closeMenuFocus(false);cancelMontagePreparation();clearFirstContact();firstContactSeen=false;glimpseSeen=false;glimpseRemaining=0;audioInit();audio.score?.reset();found=[];x=160;cam=0;world='train';phase='INTRO';musicStarted=false;leaveTime=0;memory=null;montageTime=0;clapDone=false;$('window-reveal').hidden=true;$('life-montage').hidden=true;$('clap-prompt').hidden=true;$('title').hidden=true;$('ending').hidden=true;$('menu').hidden=true;save();say(S17.intro,setPlay);}
function continueGame(){const s=safeGet();if(!s||![1,2,3,4].includes(s.version)||!checkpoints.has(s.phase))return;audioInit();phase=s.phase;world=s.world==='studio'?'studio':'train';x=Math.max(100,Math.min(worldWidth()-100,Number(s.x)||160));found=Array.isArray(s.found)?[...new Set(s.found.filter(v=>RECORDINGS.includes(v)))]:[];
 clearFirstContact();firstContactSeen=s.firstContactSeen===true||phase!=='INTRO';glimpseSeen=s.glimpseSeen===true||phase!=='INTRO';glimpseRemaining=0;
 if(s.version<3&&phase==='DOYUN_DEPARTED'){phase='WINDOW_PENDING';world='train';x=WINDOW_FOCUS_X;}
 if(s.version<4&&world==='train'&&['WINDOW_PENDING','WINDOW_REVEALED','WAITING_CLAP'].includes(phase)&&x>1150)x=WINDOW_FOCUS_X+145;
 // 이전 컵라면 기록으로 새 기억을 들었다고 처리하지 않는다. 하차 이후 진행은 유지한다.
 if(['RECORDINGS_SEARCH','FINAL_RECORDING_OPEN'].includes(phase))phase=found.length===RECORDINGS.length?'FINAL_RECORDING_OPEN':'RECORDINGS_SEARCH';
 if(phase==='RETURN_TO_TRAIN')phase=world==='studio'?'STUDIO_RETURN':'WINDOW_PENDING';
 volume=Math.max(0,Math.min(1,Number.isFinite(Number(s.volume))?Number(s.volume):.55));settings.textSize=['1','1.15','1.3'].includes(s.textSize)?s.textSize:'1';applySettings();audio.score?.reset();audio.score?.setStage(found.length);musicStarted=phase==='DOYUN_DEPARTED';leaveTime=musicStarted?4:0;montageTime=Math.min(MONTAGE_DURATION-.01,Math.max(0,Number(s.montageTime)||0));clapDone=!!s.clapDone;cam=Math.max(0,Math.min(worldWidth()-W,x-W*.38));$('title').hidden=true;$('ending').hidden=true;$('menu').hidden=true;$('life-montage').hidden=true;$('window-reveal').hidden=true;$('clap-prompt').hidden=true;setPlay();if(phase==='LIFE_MONTAGE')startMontage(true);else if(phase==='WAITING_CLAP'){if(clapDone)afterClapSequence();else waitClap();}}
function enterStudio(){transition(()=>{world='studio';x=110;phase=found.length===RECORDINGS.length?'FINAL_RECORDING_OPEN':'RECORDINGS_SEARCH';save();say(STORY.studio,setPlay);});}
function recording(id){say(STORY[id],()=>{if(!found.includes(id)){found.push(id);audio.score?.setStage(found.length);phase=found.length===RECORDINGS.length?'FINAL_RECORDING_OPEN':'RECORDINGS_SEARCH';save();toast(S17.memoryStages[found.length-1].toast);if(found.length===4)setTimeout(()=>toast('마지막 파일을 들을 수 있다.'),4300);}setPlay();});}
function finalSequence(){say(S17.final,()=>startMontage());}
function computerFiles(){
 const finalReady=phase==='FINAL_RECORDING_OPEN',returned=phase==='STUDIO_RETURN';
 const first=finalReady?'오늘은 여기까지 · 재생':'폴더 살펴보기';
 const inspect=()=>say(returned?[['','공개곡 《내일의 너에게 작은 위로를 전하는 노래》와 마지막 미완성 파일 「오늘은 여기까지」는 별개의 녹음이다.']]:STORY.computerLocked,setPlay);
 say([{prompt:'녹음 파일을 선택하세요.',choices:[[first],[found.includes('nextSong')?'다음 곡 · 다시 듣기':'다음 곡 · 재생'],['다른곳을 살펴보기']],actions:[finalReady?finalSequence:inspect,()=>recording('nextSong'),setPlay]}],setPlay);
}
function startMontage(resuming=false){
 const request=++montageRequest;phase='LIFE_MONTAGE';mode='montage';memory=null;montageReady=false;
 if(!resuming)montageTime=0;montageFrame=-1;
 $('life-montage').hidden=true;$('view-counter').hidden=true;$('dialogue').hidden=true;$('hint').hidden=true;
 $('montage-loading-text').textContent='기억을 불러오고 있습니다.';$('montage-retry').hidden=true;
 save();hud();
 const begin=()=>{if(request!==montageRequest)return;renderMontageFrame();$('montage-loading').hidden=true;$('life-montage').hidden=false;montageReady=true;};
 if(montageImages.length===MONTAGE_CUTS.length){begin();return;}
 $('montage-loading').hidden=false;
 prepareMontageImages().then(begin).catch(()=>{
  if(request!==montageRequest)return;
  $('montage-loading-text').textContent='기억을 불러오지 못했습니다. 다시 시도해 주세요.';$('montage-retry').hidden=false;
 });
}
function renderMontageFrame(){
 let frame=0;for(let i=1;i<MONTAGE_CUTS.length;i++)if(montageTime>=MONTAGE_CUTS[i])frame=i;
 const visual=$('montage-image'),flash=$('montage-flash');
 if(frame!==montageFrame){
  // Keep the decoded Image itself: switching a CSS URL can discard an in-flight frame.
  montageFrame=frame;visual.replaceChildren(montageImages[frame]);
  visual.style.setProperty('--rush-x',frame%2?'-3.2%':'3.2%');
  visual.classList.remove('cut');void visual.offsetWidth;visual.classList.add('cut');
  if(frame>0){flash.classList.remove('pulse');void flash.offsetWidth;flash.classList.add('pulse');}
 }
 visual.style.filter=`grayscale(${Math.max(0,1-montageTime/7.1)})`;
 const counter=$('view-counter');counter.hidden=montageTime<.65||montageTime>=1.95;
 counter.textContent=`《내일의 너에게 작은 위로를 전하는 노래》  조회수 ${montageTime<1.3?30:31}`;
}
function endMontage(){if(mode!=='montage')return;montageReady=false;$('life-montage').hidden=true;$('view-counter').hidden=true;audio.score?.cue('complete');toast('노래가 완성되었다.');phase='STUDIO_RETURN';save();say(S17.afterMontage,()=>{save();setPlay();});}
function waitClap(){mode='clap';memory=null;$('dialogue').hidden=true;$('clap-prompt').hidden=false;hud();}
function afterClapSequence(){say(S17.afterClap,()=>{mode='departure';memory=null;leaveTime=0;hud();$('objective').textContent='도윤의 마지막 연주를 지켜보세요.';},null,'doyun');}
function clap(){if(mode!=='clap'||clapDone)return;clapDone=true;$('clap-prompt').hidden=true;audio.score?.cue('clap');save();afterClapSequence();}
function depart(){say(S17.finale,waitClap,null,'doyun');}
function finishDeparture(){phase='DOYUN_DEPARTED';musicStarted=true;save();setPlay();toast('도윤의 모습은 사라졌다.');}
function objects(){if(world==='train')return[{id:'window',x:WINDOW_FOCUS_X,reach:180,label:phase==='WINDOW_PENDING'?'유리창 살펴보기':'유리창 조사하기'},{id:'doyun',x:DOYUN_INTERACT_X,label:phase==='DOYUN_DEPARTED'?'남겨진 녹음기':'도윤과 이야기하기'},{id:'next',x:1860,label:phase==='DOYUN_DEPARTED'?'다음 칸으로':phase==='STUDIO_OPEN'?'녹음실로':'연결문 살펴보기'}];return[{id:'back',x:108,label:'열차로 돌아가기'},{id:'laugh',x:375,label:found.includes('laugh')?'노래의 시작 다시 듣기':'책상 서랍 살펴보기'},{id:'computer',x:780,label:phase==='FINAL_RECORDING_OPEN'?'오늘은 여기까지 · 재생':'컴퓨터 살펴보기'},{id:'chair',x:990,label:'오래된 의자 살펴보기'},{id:'concert',x:1290,label:found.includes('concert')?'첫 공개 다시 듣기':'공연 안내장 살펴보기'},{id:'doubt',x:1450,label:found.includes('doubt')?'조회수 31회 다시 듣기':'건반 옆 녹음 살펴보기'},{id:'medicine',x:1620,label:'약 봉투 살펴보기'}];}
function nearest(){let best=null,dist=Infinity;for(const o of objects()){const d=Math.abs(x-o.x);if(d<(o.reach||105)&&d<dist){best=o;dist=d;}}return best;}
function showWindowCloseup(lines){showWindowReveal();say(lines,()=>{$('window-reveal').hidden=true;setPlay();});}
function interact(){if(mode!=='play'||fadeBusy)return;audioInit();const o=nearest();if(!o)return;
 if(o.id==='window'){if(phase==='WINDOW_PENDING')say(S17.revealStart,()=>{mode='reveal';revealTime=0;showWindowReveal();hud();});else if(['WINDOW_REVEALED','WAITING_CLAP','DOYUN_DEPARTED'].includes(phase))showWindowCloseup(S17.revealRepeat);else showWindowCloseup(S17.windowInitialCloseup);}
 else if(o.id==='doyun'){if(phase==='INTRO'){say(S17.meet,()=>{phase='STUDIO_OPEN';save();setPlay();},null,'doyun');}else if(phase==='WINDOW_PENDING')say(S17.revealEarly,setPlay,null,'doyun');else if(phase==='WINDOW_REVEALED')depart();else if(phase==='DOYUN_DEPARTED')say(S17.empty,setPlay);else say([['도윤','오른쪽 문으로 가면 돼요. 작업실이 그쪽이에요.']],setPlay,null,'doyun');}
 else if(o.id==='next'){if(phase==='STUDIO_OPEN')enterStudio();else if(phase==='DOYUN_DEPARTED'){mode='ending';$('ending').hidden=false;hud();$('hint').hidden=true;focusElement($('return-train'));}else if(phase==='WINDOW_PENDING')say([['','유리창에 남은 빛이 자꾸 눈에 밟힌다.']],setPlay);else if(phase==='WINDOW_REVEALED')say([['','도윤과 마지막 이야기를 나누고 싶다.']],setPlay);else say([['','문은 열리지 않는다.\n창가의 청년에게 먼저 말을 걸어보자.']],setPlay);}
 else if(o.id==='back'){if(phase==='STUDIO_RETURN')transition(()=>{world='train';x=WINDOW_FOCUS_X+145;phase='WINDOW_PENDING';save();setPlay();});else say([['도윤','돌아가도 되지만, 마지막 녹음을 아직 못 찾았어요.\n조금만 더 같이 봐줄래요?']],setPlay);}
 else if(['laugh','concert','doubt'].includes(o.id)){if(phase==='STUDIO_RETURN')say(STORY[o.id],setPlay);else recording(o.id);}
 else if(o.id==='computer')computerFiles();
 else say(STORY[o.id],setPlay);
}
function pause(){if(fadeBusy||['title','exited','ending','departure'].includes(mode))return;if(mode==='menu'){resume();return;}clearFirstContact();glimpseRemaining=0;returnMode=mode;mode='menu';keys.clear();$('menu').hidden=false;$('hint').hidden=true;hud();openMenuFocus();}
function resume(){mode=returnMode;$('menu').hidden=true;hud();closeMenuFocus();}
function title(){closeMenuFocus(false);cancelMontagePreparation();clearFirstContact();glimpseRemaining=0;mode='title';$('exit-screen').hidden=true;keys.clear();dialogue=null;dialogueTarget=null;memory=null;$('dialogue').hidden=true;$('menu').hidden=true;$('ending').hidden=true;$('life-montage').hidden=true;$('view-counter').hidden=true;$('window-reveal').hidden=true;$('clap-prompt').hidden=true;$('title').hidden=false;$('hint').hidden=true;updateContinue();hud();focusTitle();}
function exitGame(){if(mode!=='title')return;keys.clear();mode='exited';$('title').hidden=true;$('exit-screen').hidden=false;audio.ctx?.suspend?.().catch(()=>{});hud();focusElement($('exit-return'));}
function applySettings(){document.documentElement.style.setProperty('--text-scale',settings.textSize);$('text-size').value=settings.textSize;$('volume').value=Math.round(volume*100);if(audio.master)audio.master.gain.setTargetAtTime(volume*.22,audio.ctx.currentTime,.1);measureDialogueHeight();}
$('exit-game').onclick=exitGame;$('exit-return').onclick=title;$('new-game').onclick=fresh;$('continue').onclick=continueGame;$('advance').onclick=advance;$('resume').onclick=resume;$('to-title').onclick=title;$('restart-end').onclick=fresh;$('return-train').onclick=()=>{$('ending').hidden=true;setPlay();x=1050;};$('action').onclick=()=>mode==='clap'?clap():interact();$('clap-prompt').onclick=clap;$('game').addEventListener('pointerdown',e=>{if(mode==='clap'&&e.target.id!=='clap-prompt')clap();});
$('volume').oninput=e=>{volume=Number(e.target.value)/100;applySettings();save();};$('text-size').onchange=e=>{settings.textSize=e.target.value;applySettings();save();};
$('montage-retry').onclick=()=>startMontage(true);
for(const [id,key] of [['left','ArrowLeft'],['right','ArrowRight']]){$(id).onpointerdown=e=>{e.preventDefault();keys.add(key);$(id).setPointerCapture(e.pointerId);};$(id).onpointerup=$(id).onpointercancel=()=>keys.delete(key);}
document.addEventListener('keydown',e=>{
 if(e.repeat&&['e','E','Enter',' ','Escape'].includes(e.key)){e.preventDefault();return;}
 if(e.key==='Escape'){e.preventDefault();if(mode==='exited')title();else pause();return;}
 if(mode==='menu'){if(e.key==='Tab')trapMenuTab(e);return;}
 const active=document.activeElement;
 if(['INPUT','SELECT'].includes(active.tagName))return;
 if(active.tagName==='BUTTON'&&['Enter',' '].includes(e.key))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))e.preventDefault();
 if(mode==='clap'){if(['e','E','Enter',' '].includes(e.key))clap();return;}
 if(mode==='dialogue'){const item=dialogue&&dialogue[lineIndex];if(item&&item.choices&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){choiceIndex=(choiceIndex+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+item.choices.length)%item.choices.length;focusChoice();}else if(['Enter',' ','e','E'].includes(e.key))advance();return;}
 if(mode==='play'){keys.add(e.key);if(['e','E','Enter'].includes(e.key))interact();}
});document.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{keys.clear();if(!isUIEditor&&!['title','exited','ending','menu','departure'].includes(mode))pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(!isUIEditor&&!['title','exited','ending','menu','departure'].includes(mode))pause();}});

function update(dt){clock+=dt;if(fractureRemaining>0){fractureRemaining=Math.max(0,fractureRemaining-dt);if(!fractureRemaining)clearFirstContact();}if(glimpseRemaining>0&&previewScene!=='glimpse')glimpseRemaining=Math.max(0,glimpseRemaining-dt);audioTick();if(mode==='play'&&!fadeBusy){let d=0;if(keys.has('ArrowLeft')||keys.has('a')||keys.has('A'))d--;if(keys.has('ArrowRight')||keys.has('d')||keys.has('D'))d++;if(d){x=Math.max(78,Math.min(worldWidth()-83,x+d*dt*185));facing=d;walk+=dt;}
 if(world==='train'&&phase==='INTRO'&&!glimpseSeen&&x>=GLIMPSE_X){glimpseSeen=true;glimpseRemaining=GLIMPSE_DURATION;save();}
 const target=Math.max(0,Math.min(worldWidth()-W,x-W*.38));cam+=(target-cam)*Math.min(1,dt*7);
 const o=nearest();$('hint').hidden=!o||glimpseRemaining>0;if(o){const hx=Math.max(100,Math.min(W-100,(o.id==='doyun'?DOYUN_SEAT_X:o.x)-cam));$('hint').style.left=`${hx/W*100}%`;$('hint').style.top=(world==='train'?(o.id==='window'?56:37):o.id==='concert'?26:43)+'%';$('hint-text').textContent=o.label;}
 }else $('hint').hidden=true;
 if(mode==='departure'&&!Number.isFinite(previewFrame)){leaveTime+=dt;if(leaveTime>5.8)finishDeparture();}
 if(mode==='flash'&&fractureRemaining<=0){mode='dialogue';$('dialogue').hidden=false;hud();showLine();}
 if(mode==='montage'&&montageReady){montageTime+=dt;renderMontageFrame();if(Math.floor(montageTime)!==Math.floor(montageTime-dt))save();if(montageTime>=MONTAGE_DURATION)endMontage();}
 if(mode==='reveal'){revealTime+=dt;if(revealTime>=REVEAL_LEAD_DURATION){say(S17.revealFinish,()=>{$('window-reveal').hidden=true;phase='WINDOW_REVEALED';save();setPlay();});}}
 if(mode==='finalPhrase'){listenTime+=dt;if(listenTime>=4)waitClap();}
}
function draw(){
 ctx.clearRect(0,0,W,H);
 const saturation=phase==='DOYUN_DEPARTED'||['WINDOW_REVEALED','WAITING_CLAP'].includes(phase)?1:(S17.memoryStages[found.length-1]?.saturation||.55);
 canvas.style.filter=`saturate(${saturation})`;
 const renderState={world,phase,mode,memory,x,cam,facing,walk,revealTime,glimpseRemaining,clapDone,walking:mode==='play'&&(keys.has('ArrowLeft')||keys.has('a')||keys.has('A')||keys.has('ArrowRight')||keys.has('d')||keys.has('D')),talkingToDoyun:dialogueTarget==='doyun',leaveTime,FLOOR,W,H};
 // 현재 공간은 계속 표시하고, 기억만 독립된 창에 그린다.
 Art.render(ctx,renderState);
 $('memory-window').hidden=!memory;
 if(memory){memoryCtx.clearRect(0,0,W,H);Art.renderMemory(memoryCtx,renderState);}
 const labels={laugh:'노래가 시작된 날',concert:'빈 객석과 첫 공개',doubt:'조회수 31회',nextSong:'끝내지 못한 다음 곡',hospital:'마지막 녹음'};
 $('memory-label').hidden=!memory;
 if(memory)$('memory-label').textContent='기억 / '+labels[memory];
 $('listen-caption').hidden=true;
}
function frame(t){const dt=Math.min((t-last)/1000,.05)||.016;last=t;update(dt);draw();requestAnimationFrame(frame);}

// Available only to the explicit same-origin editor iframe; all save() calls remain blocked.
if(isUIEditor)window.UIEditorBridge={ready:()=>Art.loaded,preset(name){
 if(!Art.loaded)return;title();keys.clear();if(document.body)document.body.dataset.uiPreview=name;clearTimeout(toastTimer);$('toast').style.opacity=0;$('toast').classList.remove('show');found=['laugh','concert'];world=name==='studio'||name==='memory'?'studio':'train';x=world==='studio'?620:1080;cam=world==='studio'?220:594;phase='RECORDINGS_SEARCH';
 if(name==='title')return;
 $('title').hidden=true;setPlay();
 if(name==='train'||name==='studio'){phase=world==='train'?'STUDIO_OPEN':'RECORDINGS_SEARCH';hud();}
 if(name==='dialogue')say(S17.finale,()=>setPlay());
 if(name==='choices')say([S17.meet.find(row=>row.choices)],()=>setPlay());
 if(name==='memory')say(STORY.laugh,()=>setPlay(),'laugh');
 if(name==='menu')pause();
 if(name==='clap')waitClap();
 if(name==='ending'){mode='ending';$('ending').hidden=false;hud();}
 if(name==='touch'){$('touch').hidden=false;}
 if(name==='toast'){$('toast').textContent='멜로디가 남았다.';$('toast').classList.add('show');}
 if(name==='montage'){mode='ui-still';memory=null;hud();$('hud').hidden=true;$('controls').hidden=true;$('touch').hidden=true;$('life-montage').hidden=false;$('view-counter').hidden=false;$('view-counter').textContent='조회수 30 → 31';const image=new Image();image.className='montage-frame';image.src='assets/s17-life-02.png';image.alt='';$('montage-image').replaceChildren(image);}

},measure(){measureDialogueHeight(true);}};

updateContinue();hud();$('new-game').disabled=true;$('continue').disabled=true;
Art.ready.then(ok=>{
 if(ok){$('asset-loading').hidden=true;$('new-game').disabled=false;updateContinue();
  if(mode==='title'&&!isArtPreview)focusTitle();
  if(isUIEditor)document.dispatchEvent?.(new Event('ui-editor-ready'));
  // Warm the complete sequence during play; startMontage still gates cold-cache/resume.
  prepareMontageImages().catch(()=>{});
  measureDialogueHeight();
  if(isArtPreview&&!isUIEditor){$('title').hidden=true;world=['train','glimpse','first-contact','departure','reveal','reveal-done','clap'].includes(previewScene)?'train':'studio';phase=world==='train'?'STUDIO_OPEN':'RECORDINGS_SEARCH';x=world==='train'?DOYUN_INTERACT_X:620;cam=world==='train'?594:220;setPlay();
   if(previewScene==='glimpse'){phase='INTRO';x=GLIMPSE_X;cam=204;glimpseSeen=true;glimpseRemaining=GLIMPSE_DURATION/2;hud();}
   else if(previewScene==='departure'){phase='WAITING_CLAP';mode='departure';leaveTime=Number.isFinite(previewFrame)?Math.min(5.79,Math.max(0,previewFrame)):0;$('objective').textContent='도윤의 마지막 연주를 지켜보세요.';}
   else if(previewScene==='first-contact'){phase='INTRO';hud();}
   else if(previewScene==='reveal'){world='train';phase='WINDOW_PENDING';x=WINDOW_FOCUS_X+145;cam=439;setPlay();}
   else if(previewScene==='reveal-done'){world='train';phase='WINDOW_REVEALED';x=WINDOW_FOCUS_X+145;cam=439;setPlay();}
   else if(previewScene==='clap'){world='train';phase='WAITING_CLAP';x=DOYUN_INTERACT_X;cam=594;waitClap();}
   else if(world==='train')say([['도윤','잠깐만 들어 볼래요? 마지막 부분이 좀 이상해서.']],setPlay,null,'doyun');
   else if(previewScene==='memory-listen'||previewScene==='montage'){found=[...RECORDINGS];startMontage();}
   else if(previewScene==='memory-hospital')say(S17.final.filter(row=>row[2]?.memory==='hospital'),setPlay);
   else if(previewScene.startsWith('memory'))recording(previewScene==='memory-concert'?'concert':previewScene==='memory-doubt'?'doubt':previewScene==='memory-next-song'?'nextSong':'laugh');
  }
 }
 else{$('asset-loading').replaceChildren();const p=document.createElement('p');p.textContent='그림을 불러오지 못했습니다. 연결을 확인한 뒤 다시 열어 주세요.';$('asset-loading').append(p);const retry=document.createElement('button');retry.textContent='다시 불러오기';retry.onclick=()=>window.location.reload();$('asset-loading').append(retry);}
});
let measureFrame=0;
window.addEventListener('resize',()=>{if(measureFrame)return;measureFrame=requestAnimationFrame(()=>{measureFrame=0;measureDialogueHeight();});});
if(document.fonts?.ready)document.fonts.ready.then(()=>measureDialogueHeight(true));
requestAnimationFrame(frame);
})();
