'use strict';
// Owns only the embedded app's lifecycle; presentation changes never reload it.
window.createAppFrame=function({container,onState,timeoutMs=15000}){
 const origin='https://power-tbm.vercel.app';
 let frame=null,state='idle',channel='',deadline=null,probeTimer=null;
 function stopTimers(){clearTimeout(deadline);clearInterval(probeTimer);deadline=null;probeTimer=null;}
 function transition(next){if(state===next)return;state=next;onState(state);}
 function probe(){frame?.contentWindow?.postMessage({type:'tbm:presentation-probe',channel},origin);}
 function fail(reason){stopTimers();console.warn('[app-frame]',reason);transition('error');}
 function start(){
  stopTimers();channel=crypto.randomUUID();
  if(!frame){
   frame=document.createElement('iframe');frame.title='파워TBM 전체 앱';
   frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads');
   frame.referrerPolicy='strict-origin-when-cross-origin';
   // load is not proof of a rendered app: blocked frames also fire load.
   frame.addEventListener('load',probe);
   frame.addEventListener('error',()=>fail('frame-load-failed'));
   container.append(frame);
  }
  transition('loading');
  frame.src=origin+'/?presentation=1';
  deadline=setTimeout(()=>fail('readiness-timeout'),timeoutMs);
  probeTimer=setInterval(probe,750);
 }
 function onMessage(e){
  if(!frame||e.source!==frame.contentWindow||e.origin!==origin||e.data?.type!=='tbm:presentation-status'||e.data.channel!==channel)return;
  if(e.data.state==='ready'){stopTimers();transition('ready');}
  else if(e.data.state==='blank')fail('app-content-empty');
 }
 window.addEventListener('message',onMessage);
 return {
  ensure(){if(!frame)start();},
  retry:start,
  getState:()=>state,
  destroy(){stopTimers();window.removeEventListener('message',onMessage);frame?.remove();frame=null;}
 };
};
