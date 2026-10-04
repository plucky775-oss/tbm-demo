'use strict';
// Keep one complete production app mounted. Presentation navigation never drives its routes.
window.createLiveDemo=function(onChange){
 const $=id=>document.getElementById(id);
 let frame=null,scene=null,mode='live';
 function paint(){
  const visible=!!scene?.file&&mode==='live';
  $('live-wrap').hidden=!visible;$('image-wrap').hidden=visible||!scene?.file;
  $('canvas').classList.toggle('is-live',visible);
  $('live-controls').hidden=!scene?.file;
  $('show-live').setAttribute('aria-pressed',String(mode==='live'));
  $('show-example').setAttribute('aria-pressed',String(mode==='example'));
  $('live-status').textContent=mode==='live'?'실제 앱 · 기존 계정으로 로그인':'발표용 예시 화면';
  if(visible){$('focus-box').hidden=true;$('screen-label').textContent='파워TBM';$('caption').textContent='앱은 자유롭게 조작하고, 발표 멘트는 아래 이전·다음으로 넘기세요.';}
  else if(scene){$('screen-label').textContent=scene.label;$('caption').textContent=scene.caption;}
  onChange(visible);
 }
 function show(value){
  scene=value;
  if(scene.file&&!frame){
   frame=document.createElement('iframe');frame.title='파워TBM 전체 앱';
   frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads');
   frame.referrerPolicy='no-referrer';frame.src='https://power-tbm.vercel.app/';
   $('live-wrap').append(frame);
  }
  paint();
 }
 $('show-live').onclick=()=>{mode='live';paint();};
 $('show-example').onclick=()=>{mode='example';paint();};
 // Restart only the presentation; never discard a user's live app session or work.
 return {show,isVisible:()=>!!scene?.file&&mode==='live',reset(){mode='live';}};
};
