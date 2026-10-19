/* Applies only the independently saved UI layout; no game progress access. */
(()=>{'use strict';const U=window.UILayout;if(!U)return;const storage=U.getStorage(window);let layout=U.read(storage);const apply=()=>U.apply(document,layout);
const measureKey=value=>JSON.stringify(Object.fromEntries(['dialogue','speaker','line','choices','choice1','choice2','choice3','advance'].map(id=>[id,Object.fromEntries(Object.entries(value.elements[id]||{}).filter(([k])=>!['x','y'].includes(k)))])));
const measure=()=>window.dispatchEvent(new Event('ui-layout-measure'));
window.UILayoutRuntime={set(value){const next=U.validate(value),needsMeasure=measureKey(layout)!==measureKey(next);layout=next;apply();if(needsMeasure)measure();},get(){return U.validate(layout);}};
apply();measure();window.addEventListener('resize',apply);window.addEventListener('storage',e=>{if(new URLSearchParams(window.location.search).get('uiEditor')==='1')return;if(e.key===U.KEY){const next=U.read(storage),needsMeasure=measureKey(layout)!==measureKey(next);layout=next;apply();if(needsMeasure)measure();}});
// Choice buttons are recreated by the actual game. Layout belongs to the container.
if(typeof MutationObserver!=='undefined'){let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}).observe(document.getElementById('game'),{childList:true,subtree:true});}
})();
