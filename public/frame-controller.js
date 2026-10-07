'use strict';
// Owns only the embedded app's lifecycle; presentation changes never reload it.
window.createAppFrame=function({container,onState,timeoutMs=15000}){
 const origin='https://power-tbm.vercel.app';
 let frame=null,state='idle',channel='',deadline=null,probeTimer=null,attempt=0,canInspect=false;
 function stopTimers(){clearTimeout(deadline);clearInterval(probeTimer);deadline=null;probeTimer=null;}
 function transition(next){if(state===next)return;state=next;onState(state);}
 function hasRenderedApp(){
  // A cached app can render without its readiness bridge. Only inspect our
  // same-origin home document; never treat a load event or blank frame as ready.
  try{
   if(!canInspect)return false;
   const doc=frame?.contentDocument;
   if(!doc||doc.readyState==='loading')return false;
   const url=new URL(doc.URL);
   if(url.origin!==origin||!['/','/index.html'].includes(url.pathname))return false;
   return ['app','authGate','securedApp'].some(id=>{
    const node=doc.getElementById(id);
    if(!node?.children.length||!node.textContent.trim()||node.getBoundingClientRect().height<=0)return false;
    for(let el=node;el;el=el.parentElement){
     const style=doc.defaultView.getComputedStyle(el);
     if(el.hidden||style.display==='none'||style.visibility==='hidden'||style.opacity==='0')return false;
    }
    return true;
   });
  }catch{return false;}
 }
 function probe(){
  if(hasRenderedApp()){stopTimers();transition('ready');return;}
  frame?.contentWindow?.postMessage({type:'tbm:presentation-probe',channel},origin);
 }
 function fail(reason){stopTimers();console.warn('[app-frame]',reason);transition('error');}
 function waitForApp(){
  if(state==='error')return;
  channel=crypto.randomUUID();
  transition('loading');
  // Repeated loading/load signals cannot extend this attempt indefinitely.
  if(deadline===null)deadline=setTimeout(()=>fail('readiness-timeout'),timeoutMs);
  if(probeTimer===null)probeTimer=setInterval(probe,750);
  probe();
 }
 function start(){
  if(!frame){
   frame=document.createElement('iframe');frame.title='파워TBM 전체 앱';
   frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads');
   // Let the embedded TBM app request location; the user must still grant consent.
   frame.setAttribute('allow','geolocation '+origin);
   frame.referrerPolicy='strict-origin-when-cross-origin';
   // load is not proof of a rendered app: blocked frames also fire load.
   // Every document navigation (including the cartoon app) needs a fresh handshake.
   frame.addEventListener('load',()=>{canInspect=true;waitForApp();});
   frame.addEventListener('error',()=>fail('frame-load-failed'));
   container.append(frame);
  }
  stopTimers();state='idle';canInspect=false;
  // Assign before probing so a retry cannot accept the previous document.
  frame.src=origin+'/?presentation=1&trial=1'+(attempt++?'&presentationRetry='+crypto.randomUUID():'');
  waitForApp();
 }
 function onMessage(e){
  if(!frame||e.source!==frame.contentWindow||e.origin!==origin||e.data?.type!=='tbm:presentation-status'||e.data.channel!==channel)return;
  if(e.data.state==='ready'){stopTimers();transition('ready');}
  else if(e.data.state==='blank')fail('app-content-empty');
  else if(e.data.state==='loading'&&state==='ready'){canInspect=false;waitForApp();}
 }
 window.addEventListener('message',onMessage);
 return {
  ensure(){if(!frame)start();},
  retry:start,
  getState:()=>state,
  destroy(){stopTimers();window.removeEventListener('message',onMessage);frame?.remove();frame=null;}
 };
};
