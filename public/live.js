'use strict';
// Each app frame stays mounted so stage changes preserve this visit's inputs.
window.createLiveDemo=function(onChange){
 const $=id=>document.getElementById(id),frames=new Map();
 const steps={'home.jpeg':'home','trade.png':'trade','workers.png':'workers','health.png':'healthPpe','risk.png':'hazards','sign.png':'sign','safety-guide.png':'guide','field-tools.png':'tools','upload.png':'upload'};
 let active=null,wanted=null,timer=null,mode='live',ready=false,hasImage=false;
 function paint(){
  const visible=!!wanted&&mode==='live'&&ready;
  $('live-wrap').hidden=!visible;$('image-wrap').hidden=visible||!hasImage;
  $('canvas').classList.toggle('is-live',visible);
  $('live-controls').hidden=!wanted;
  $('show-live').setAttribute('aria-pressed',String(mode==='live'));
  $('show-example').setAttribute('aria-pressed',String(mode==='example'));
  $('live-status').textContent=!wanted?'':mode==='example'?'준비된 예시 화면':ready?'화면을 직접 눌러보세요':'연결 중 · 예시 화면으로 설명할 수 있습니다';
  if(visible)$('focus-box').hidden=true;
  onChange(visible);
 }
 function send(){if(active&&wanted)active.frame.contentWindow.postMessage({type:'tbm-demo:go',step:wanted.step,channel:active.channel},'*');}
 function timeout(){clearTimeout(timer);timer=setTimeout(()=>{if(!ready&&wanted){mode='example';paint();$('live-status').textContent='앱 연결을 확인하지 못했습니다. 예시 화면으로 계속하거나 직접 체험을 다시 눌러 주세요.';}},10000);}
 function show(scene){
  hasImage=!!scene.file;
  clearTimeout(timer);
  if(active)active.frame.contentWindow.postMessage({type:'tbm-demo:pause',channel:active.channel},'*');
  frames.forEach(v=>v.frame.hidden=true);wanted=steps[scene.file]?{step:steps[scene.file],file:scene.file}:null;
  ready=false;mode='live';active=null;
  if(wanted){
   const key=wanted.step==='upload'?'education':'tbm';
   active=frames.get(key);
   if(!active){
    const frame=document.createElement('iframe'),channel=crypto.randomUUID();
    frame.title=key==='tbm'?'파워TBM 실제 화면 체험':'파워TBM AI 안전교육 입력 체험';
    frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';
    frame.src=(key==='tbm'?'https://power-tbm.vercel.app/exhibit.html':'https://power-tbm.vercel.app/safety-toons/exhibit.html')+'?channel='+encodeURIComponent(channel)+'&step='+wanted.step;
    active={frame,channel};frames.set(key,active);$('live-wrap').append(frame);
    frame.addEventListener('load',()=>{if(active?.frame===frame){send();}});
   }
   active.frame.hidden=false;send();timeout();
  }
  paint();
 }
 window.addEventListener('message',e=>{
  if(!active||e.source!==active.frame.contentWindow||e.data?.channel!==active.channel||e.data.step!==wanted?.step)return;
  if(e.data.type==='tbm-demo:ready'){clearTimeout(timer);ready=true;paint();}
  if(e.data.type==='tbm-demo:error'){clearTimeout(timer);mode='example';paint();$('live-status').textContent='앱 화면을 열지 못해 예시 화면으로 전환했습니다.';}
 });
 $('show-live').onclick=()=>{if(!wanted)return;mode='live';send();if(!ready)timeout();paint();};
 $('show-example').onclick=()=>{mode='example';clearTimeout(timer);paint();};
 return {show,isVisible:()=>!!wanted&&mode==='live'&&ready,reset(){clearTimeout(timer);frames.forEach(v=>v.frame.remove());frames.clear();active=null;wanted=null;ready=false;}};
};
