(()=>{'use strict';
const U=window.UILayout,$=id=>document.getElementById(id),frame=$('game-frame'),storage=U.getStorage(window);
let viewW=1280,viewH=720;
let doc=null,selected='dialogue',playing=false,scale=1,dragState=null,outlineFrame=0;
let state=U.read(storage,U.peek(storage,U.DRAFT)?U.DRAFT:U.KEY),hist=U.history(state);
const message=text=>$('status').textContent=text;
const fields=[['x','X 이동량 (px)'],['y','Y 이동량 (px)'],['width','가로 크기 (px)'],['height','세로 크기 (px)'],['fontSize','글자 크기 (px)'],['lineHeight','줄간격 (배수)']];
function commit(next,label='변경했습니다.'){state=U.validate(next);hist.push(state);render();message(label);}
function nodeFor(id=selected){return doc?.querySelector(U.byId[id].selector);}
function isVisible(node){if(!node)return false;const r=node.getBoundingClientRect(),s=frame.contentWindow.getComputedStyle(node);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&Number(s.opacity)!==0;}
function apply(){if(doc)frame.contentWindow.UILayoutRuntime?.set(state);}
function outline(){if(!doc||playing)return;const node=nodeFor(),box=$('selection'),handle=$('move-handle');if(!isVisible(node)){box.hidden=true;handle.hidden=true;$('element-status').textContent='현재 장면에서는 숨겨져 있습니다. 장면을 전환하세요.';return;}
 const r=node.getBoundingClientRect();box.hidden=false;handle.hidden=false;handle.textContent='✥ 이동 · '+U.byId[selected].label;Object.assign(handle.style,{left:Math.max(0,Math.min(r.x,viewW-180/scale))+'px',top:Math.max(0,Math.min(r.y-38/scale,viewH-38/scale))+'px',transform:'scale('+1/scale+')'});Object.assign(box.style,{left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px'});box.querySelector('span').textContent=U.byId[selected].label;
 const item=U.byId[selected],parent=item.parent?nodeFor(item.parent):doc.getElementById('game'),pr=parent.getBoundingClientRect(),s=doc.getElementById('game').getBoundingClientRect().width/1280;
 $('element-status').textContent=`실제 부모 안쪽 위치: ${((r.x-pr.x)/s).toFixed(1)}, ${((r.y-pr.y)/s).toFixed(1)} px · 표시 크기 ${(r.width/s).toFixed(1)}×${(r.height/s).toFixed(1)} px`;
}
function refreshFields(){const item=U.byId[selected];$('selected-name').textContent=item.label;const parent=item.parent?U.byId[item.parent].label:'게임 화면';$('coordinate-help').textContent=`${parent} 기준 원래 배치에서의 X/Y 이동량 · 1280×720 설계px. ${item.image?'이미지 비율은 유지됩니다.':''}`;
 $('fields').replaceChildren();for(const [key,label]of fields){if(item.image&&['height','fontSize','lineHeight'].includes(key))continue;
  const row=document.createElement('label');row.textContent=item.image&&key==='width'?'이미지/묶음 가로 크기':label;const input=document.createElement('input');input.type='number';input.step=key==='lineHeight'?.05:1;[input.min,input.max]=U.ranges[key];input.dataset.key=key;input.value=state.elements[selected]?.[key]??'';input.placeholder=key==='x'||key==='y'?'0':'기본값';
  input.addEventListener('input',()=>{try{let next=U.validate(state);if(input.value===''){delete next.elements[selected]?.[key];}else next=U.patch(next,selected,{[key]:Number(input.value)});state=next;apply();outline();message('수정 중 · 즉시 미리보기');}catch(e){message(e.message);}});
  input.addEventListener('change',()=>{hist.push(state);$('undo').disabled=!hist.canUndo();$('redo').disabled=!hist.canRedo();message('변경했습니다.');});
  input.addEventListener('wheel',e=>{if(document.activeElement!==input)e.preventDefault();},{passive:false});row.append(input);$('fields').append(row);
 }
}
function render(){apply();for(const b of $('elements').children)b.classList.toggle('active',b.dataset.id===selected);$('undo').disabled=!hist.canUndo();$('redo').disabled=!hist.canRedo();refreshFields();outline();}
function select(id){selected=id;render();}
for(const item of U.elements){const b=document.createElement('button');b.textContent=(item.parent?'↳ ':'')+item.label;b.dataset.id=item.id;b.onclick=()=>select(item.id);$('elements').append(b);}
function fit(){if(dragState)cancelDrag('화면 배율이 바뀌어 이동을 취소했습니다.');for(const node of [$('preview-stage'),frame]){node.style.width=viewW+'px';node.style.height=viewH+'px';}$('overlay').style.width=viewW+'px';$('overlay').style.height=viewH+'px';frame.style.pointerEvents=playing?'auto':'none';const available=$('preview-area').clientWidth-40,chosen=$('zoom').value;scale=chosen==='fit'?Math.max(.15,Math.min(1,available/viewW)):Number(chosen);$('preview-stage').style.transform=`scale(${scale})`;$('preview-space').style.width=viewW*scale+'px';$('preview-space').style.height=viewH*scale+'px';outline();}
function point(event){const r=$('preview-stage').getBoundingClientRect();return {x:(event.clientX-r.left)/scale,y:(event.clientY-r.top)/scale};}
function hit(p){return U.elements.map((item,index)=>{const n=nodeFor(item.id);if(!isVisible(n))return null;const r=n.getBoundingClientRect();return {item,index,r,area:r.width*r.height};}).filter(v=>v&&p.x>=v.r.left&&p.x<=v.r.right&&p.y>=v.r.top&&p.y<=v.r.bottom).sort((a,b)=>a.area-b.area||b.index-a.index)[0]?.item.id;}

function releaseDrag(d){try{if($('overlay').hasPointerCapture?.(d.pointerId))$('overlay').releasePointerCapture(d.pointerId);}catch{}}
function finishDrag(){if(!dragState)return;const d=dragState;dragState=null;releaseDrag(d);if(d.moved){hist.push(state);render();message('마우스로 이동했습니다. 실행취소 한 번으로 되돌립니다.');}else{if(d.clickId)select(d.clickId);else render();}}
function cancelDrag(text='이동을 취소했습니다.'){if(!dragState)return;const d=dragState;dragState=null;state=d.start;releaseDrag(d);render();message(text);}
$('overlay').addEventListener('pointerdown',e=>{
 if(playing||!doc||e.button!==0||dragState)return;
 const p=point(e),node=nodeFor(),r=isVisible(node)?node.getBoundingClientRect():null;
 const inside=r&&p.x>=r.x&&p.x<=r.right&&p.y>=r.y&&p.y<=r.bottom;
 const fromHandle=e.target===$('move-handle')||$('move-handle').contains(e.target),clickId=fromHandle?selected:hit(p),id=fromHandle||inside?selected:clickId;
 if(!id)return;if(id!==selected)select(id);
 const gameScale=doc.getElementById('game').getBoundingClientRect().width/1280;
 dragState={pointerId:e.pointerId,id,start:structuredClone(state),props:{...state.elements[id]},point:p,screenX:e.clientX,screenY:e.clientY,gameScale,moved:false,clickId};
 $('overlay').focus({preventScroll:true});
 try{$('overlay').setPointerCapture(e.pointerId);}catch{message('포인터 캡처를 사용할 수 없어 창 안의 이동 경로를 사용합니다.');}
 e.preventDefault();
});
window.addEventListener('pointermove',e=>{
 const d=dragState;if(!d||e.pointerId!==d.pointerId||playing)return;
 if(!d.moved&&Math.hypot(e.clientX-d.screenX,e.clientY-d.screenY)<3)return;
 d.moved=true;const p=point(e);state=U.patch(d.start,d.id,U.drag(d.props,p.x-d.point.x,p.y-d.point.y,1,d.gameScale));apply();outline();e.preventDefault();
},{passive:false});
window.addEventListener('pointerup',e=>{if(dragState&&e.pointerId===dragState.pointerId)finishDrag();});
window.addEventListener('pointercancel',e=>{if(dragState&&e.pointerId===dragState.pointerId)cancelDrag();});
$('overlay').addEventListener('lostpointercapture',e=>{if(dragState&&e.pointerId===dragState.pointerId)finishDrag();});
window.addEventListener('blur',()=>{if(dragState)cancelDrag('창 포커스를 벗어나 이동을 취소했습니다.');});

document.addEventListener('keydown',e=>{if(playing||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)||document.activeElement.isContentEditable)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();state=e.shiftKey?hist.redo():hist.undo();render();return;}const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!directions[e.key])return;e.preventDefault();const [x,y]=directions[e.key],step=e.shiftKey?10:1;try{commit(U.patch(state,selected,U.drag(state.elements[selected]||{},x*step,y*step,1)),'미세 이동했습니다.');}catch(err){message(err.message);}});
$('undo').onclick=()=>{state=hist.undo();render();};$('redo').onclick=()=>{state=hist.redo();render();};
$('reset-one').onclick=()=>{const next=U.validate(state);delete next.elements[selected];commit(next,'선택 요소를 기본값으로 되돌렸습니다.');};$('reset-all').onclick=()=>commit(U.empty(),'전체 기본값으로 되돌렸습니다. 실행취소할 수 있습니다.');
$('mode').onclick=()=>{if(dragState)finishDrag();playing=!playing;frame.style.pointerEvents=playing?'auto':'none';$('move-handle').hidden=playing;$('overlay').classList.toggle('play',playing);$('mode').textContent=playing?'배치 편집으로 전환':'플레이 확인으로 전환';$('mode').setAttribute('aria-pressed',String(playing));if(playing)frame.contentWindow.focus();else outline();message(playing?'플레이 확인 중 · 게임 진행은 저장하지 않습니다.':'배치 편집 중');};
function preset(){if(!frame.contentWindow.UIEditorBridge){message('게임 이미지를 준비하고 있습니다. 잠시 후 장면을 다시 선택하세요.');return;}frame.contentWindow.UIEditorBridge.preset($('preset').value);apply();outline();}
$('viewport').onchange=()=>{[viewW,viewH]=$('viewport').value.split(',').map(Number);fit();apply();};
$('preset').onchange=()=>{if(dragState)cancelDrag();preset();};$('zoom').onchange=fit;window.addEventListener('resize',fit);
$('draft-save').onclick=()=>{try{U.write(storage,state,U.DRAFT);message('초안만 이 브라우저에 임시저장했습니다. 게임 적용과 별개입니다.');}catch(e){message('저장하지 못했습니다: '+e.message);}};
$('draft-load').onclick=()=>{try{const text=storage?.getItem(U.DRAFT);if(!text)throw Error('저장된 초안이 없습니다.');commit(U.parse(text),'초안을 불러왔습니다.');}catch(e){message(e.message);}};
$('apply').onclick=()=>{try{U.write(storage,state);message('같은 주소의 로컬 게임에 배치를 적용했습니다. 진행 저장은 그대로입니다. 소스/웹배포는 바뀌지 않습니다.');}catch(e){message('적용하지 못했습니다: '+e.message);}};
$('clear-applied').onclick=()=>{try{if(!storage)throw Error('브라우저 저장을 사용할 수 없습니다.');storage.removeItem(U.KEY);message('게임 적용 배치만 해제했습니다. 편집 초안과 진행 저장은 그대로입니다.');}catch(e){message(e.message);}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(U.validate(state),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='안개열차-UI배치.json';a.click();URL.revokeObjectURL(url);message('JSON 파일로 저장했습니다. 소스 영구반영은 별도입니다.');};
$('import').onchange=async()=>{try{const file=$('import').files[0];if(!file)return;if(file.size>100000)throw Error('100KB 이하 파일을 선택하세요.');commit(U.parse(await file.text()),'JSON을 불러왔습니다. 게임 적용은 별도 버튼입니다.');}catch(e){message('불러오기 실패: '+e.message);}finally{$('import').value='';}};
function connectFrame(){const next=frame.contentDocument;if(!next||doc===next)return;doc=next;apply();fit();render();message('편집 준비 완료 · 대사창을 선택해 수정하세요.');doc.addEventListener('ui-editor-ready',()=>{preset();render();});if(frame.contentWindow.UIEditorBridge?.ready()){preset();render();}}
frame.addEventListener('load',connectFrame);
if(frame.contentDocument?.readyState==='complete'&&frame.contentWindow.UILayoutRuntime)connectFrame();
function tick(){if(doc&&!playing)outline();outlineFrame=requestAnimationFrame(tick);}tick();window.addEventListener('beforeunload',()=>cancelAnimationFrame(outlineFrame));
fit();render();
})();
