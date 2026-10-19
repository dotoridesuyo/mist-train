/* R84: fixed allowlist, numeric-only layout data; independent of game progress. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.UILayout=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const KEY='misttrain-ui-layout-v1',DRAFT='misttrain-ui-draft-v1';
const elements=[
 ['dialogue','#dialogue','대사창',null],['speaker','#speaker','화자 이름','dialogue'],['line','#line','대사 본문','dialogue'],['advance','#advance','계속 버튼','dialogue'],['choices','#choices','선택지 묶음','dialogue'],['choice1','#choices button:nth-child(1)','첫 번째 선택지','choices'],['choice2','#choices button:nth-child(2)','두 번째 선택지','choices'],['choice3','#choices button:nth-child(3)','세 번째 선택지','choices'],
 ['hud','#hud','HUD 전체',null],['place','.location','장소 표시','hud'],['objective','#objective','목표 안내','hud'],['chapter','#chapter','챕터 묶음','hud'],['chapterTitle','#chapter-title','챕터 제목','chapter'],['chapterNumber','#chapter-number','챕터 번호','chapter'],['recording','#recording-count','기억 개수','chapter'],
 ['controls','#controls','조작 안내',null],['hint','#hint','조사 표시',null],['memory','#memory-window','기억 창',null],['memoryLabel','#memory-label','기억 제목',null],['toast','#toast','중앙 안내',null],
 ['viewCounter','#view-counter','주마등 조회수',null],['clap','#clap-prompt','박수 안내',null],['ending','#ending .ending-content','엔딩',null],['touch','#touch','터치 조작 묶음',null],
 ['menu','#menu .menu-card','일시정지 창',null],['menuTitle','#menu-title','일시정지 제목','menu'],['volume','#menu .volume-setting','음악 설정','menu'],['textSize','#menu .font-setting','글자 설정','menu'],['toTitle','#to-title','첫 화면 버튼','menu'],['resume','#resume','계속하기 버튼','menu'],
 ['titleGroup','#title .title-content','타이틀 전체',null,true],['logo','#title .title-logo','타이틀 로고','titleGroup',true],['titleMenus','#title .title-buttons','타이틀 메뉴 묶음','titleGroup',true],['newGame','#new-game','처음부터 걷기 이미지','titleMenus',true],['continue','#continue','이어서 걷기 이미지','titleMenus',true],['exit','#exit-game','종료 이미지','titleMenus',true]
].map(([id,selector,label,parent,image])=>({id,selector,label,parent,image:!!image}));
const byId=Object.fromEntries(elements.map(e=>[e.id,e]));
const ranges={x:[-2560,2560],y:[-1440,1440],width:[16,2560],height:[16,1440],fontSize:[8,120],lineHeight:[.7,4]};
function empty(){return {version:1,elements:{}};}
function validate(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||data.version!==1||!data.elements||typeof data.elements!=='object'||Array.isArray(data.elements))throw Error('레이아웃 형식 또는 버전이 올바르지 않습니다.');
 if(Object.keys(data).some(k=>!['version','elements'].includes(k)))throw Error('허용되지 않은 최상위 항목입니다.');
 const result=empty();
 for(const [id,props]of Object.entries(data.elements)){
  if(!Object.prototype.hasOwnProperty.call(byId,id))throw Error('허용되지 않은 요소: '+id);
  if(!props||typeof props!=='object'||Array.isArray(props))throw Error('속성 형식 오류: '+id);
  const clean={};for(const [key,value]of Object.entries(props)){
   if(!Object.prototype.hasOwnProperty.call(ranges,key)||typeof value!=='number'||!Number.isFinite(value)||value<ranges[key][0]||value>ranges[key][1])throw Error('속성 범위 오류: '+id+' / '+key);
   if(byId[id].image&&['height','fontSize','lineHeight'].includes(key))throw Error('이미지 요소는 가로 크기와 위치만 수정할 수 있습니다.');
   clean[key]=Math.round(value*1000)/1000;
  }result.elements[id]=clean;
 }return result;
}
function parse(text){if(typeof text!=='string'||text.length>100000)throw Error('파일은100KB 이하 JSON이어야 합니다.');return validate(JSON.parse(text));}
function getStorage(host){try{return host.localStorage||null;}catch{return null;}}
function peek(storage,key){try{return storage?.getItem(key)||null;}catch{return null;}}
function read(storage,key=KEY){try{const text=peek(storage,key);return text?parse(text):empty();}catch{return empty();}}
function write(storage,data,key=KEY){const clean=validate(data);if(!storage)throw Error('브라우저 저장을 사용할 수 없습니다. JSON 파일로 보관하세요.');storage.setItem(key,JSON.stringify(clean));return clean;}
function patch(data,id,props){if(!Object.prototype.hasOwnProperty.call(byId,id))throw Error('요소 오류');const next=validate(data);next.elements[id]={...next.elements[id],...props};return validate(next);}
function drag(start,dx,dy,displayScale,gameScale=1){if(!(displayScale>0&&gameScale>0))throw Error('배율 오류');return {x:Math.max(-2560,Math.min(2560,(start.x||0)+dx/displayScale/gameScale)),y:Math.max(-1440,Math.min(1440,(start.y||0)+dy/displayScale/gameScale))};}
function history(initial=empty()){let states=[validate(initial)],index=0;return {get:()=>validate(states[index]),push(value){const clean=validate(value);if(JSON.stringify(clean)===JSON.stringify(states[index]))return;states=states.slice(0,index+1);states.push(clean);if(states.length>150)states.shift();index=states.length-1;},undo(){if(index)index--;return this.get();},redo(){if(index<states.length-1)index++;return this.get();},canUndo:()=>index>0,canRedo:()=>index<states.length-1};}
const owned=new WeakMap();
function apply(doc,data){
 const clean=validate(data),game=doc.getElementById('game');if(!game)return;const scale=game.getBoundingClientRect().width/1280;
 for(const item of elements){const node=doc.querySelector(item.selector);if(!node)continue;
  let original=owned.get(node);if(!original){original={};owned.set(node,original);}
  const values=clean.elements[item.id]||{},styles={};
  if(item.id==='choices'){node.toggleAttribute?.('data-ui-font','fontSize'in values);node.toggleAttribute?.('data-ui-leading','lineHeight'in values);}
  if('x'in values||'y'in values)styles.translate=`${(values.x||0)*scale}px ${(values.y||0)*scale}px`;
  if('width'in values){styles.width=values.width*scale+'px';styles['max-width']='none';if(item.image&&['logo','newGame','continue','exit'].includes(item.id)){styles.height='auto';styles['aspect-ratio']='3 / 1';}}
  if('height'in values&&!item.image){styles.height=values.height*scale+'px';styles['max-height']='none';if(item.id==='dialogue')styles['overflow']='auto';}
  if('fontSize'in values)styles['font-size']=values.fontSize*scale+'px';
  if('lineHeight'in values)styles['line-height']=String(values.lineHeight);
  for(const property of new Set([...Object.keys(original),...Object.keys(styles)])){
   if(!(property in original))original[property]=[node.style.getPropertyValue(property),node.style.getPropertyPriority(property)];
   if(property in styles)node.style.setProperty(property,styles[property],'important');else{const [v,p]=original[property];if(v)node.style.setProperty(property,v,p);else node.style.removeProperty(property);}
  }
 }
}
function applyProbe(probe,scale,data){if(!data)return;const clean=validate(data);for(let i=1;i<=3;i++){const node=probe.querySelector('.measure-choices button:nth-child('+i+')');if(!node)continue;const values=clean.elements['choice'+i]||{};for(const [key,property]of [['width','width'],['height','height'],['fontSize','font-size'],['lineHeight','line-height']])if(key in values){node.style.setProperty(property,key==='lineHeight'?String(values[key]):values[key]*scale+'px','important');if(key==='width')node.style.setProperty('max-width','none','important');}}}
return {KEY,DRAFT,elements,byId,ranges,empty,validate,parse,getStorage,peek,read,write,patch,drag,history,apply,applyProbe};
});
