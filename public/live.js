'use strict';
// One owner for media visibility, independent of the app lifecycle and slide text.
window.createLiveDemo=function(onChange){
 const $=id=>document.getElementById(id);
 let scene=null,mode='example';
 const app=window.createAppFrame({container:$('live-wrap'),onState:paint});
 function paint(){
  if(!scene)return;
  const wantsApp=!!scene.file&&mode==='live',state=app.getState();
  const visible=wantsApp&&state==='ready';
  const waiting=wantsApp&&!visible;
  $('canvas').classList.toggle('is-live',wantsApp);
  // Keep the app painted beneath the loading overlay, including on iPad Safari.
  $('live-wrap').hidden=!wantsApp;
  $('live-wrap').inert=!visible;
  $('live-wrap').setAttribute('aria-hidden',String(!visible));
  $('image-wrap').hidden=wantsApp||!scene.file;
  $('video-wrap').hidden=scene.format!=='video';
  $('closing-visual').hidden=scene.format!=='closing';
  $('frame-message').hidden=!waiting;
  $('frame-message').setAttribute('aria-busy',String(state==='loading'));
  $('frame-message-title').textContent=state==='error'?'앱 화면을 불러오지 못했습니다':'파워TBM을 불러오는 중입니다';
  $('frame-message-text').textContent=state==='error'?'다시 불러오거나 새 창에서 앱을 열어 주세요. 예시 화면으로 발표를 계속할 수도 있습니다.':'앱 화면이 준비되면 여기에 표시됩니다.';
  $('retry-app').hidden=state!=='error';
  $('live-controls').hidden=!scene.file;
  $('show-live').setAttribute('aria-pressed',String(mode==='live'));
  $('show-example').setAttribute('aria-pressed',String(mode==='example'));
  $('live-status').textContent=!wantsApp?'발표용 예시 화면':state==='ready'?'로그인 없는 체험 · 안전 4컷 제외':state==='error'?'연결 확인 필요':'연결 중';
  $('screen-label').textContent=wantsApp?'파워TBM':scene.label;
  $('caption').textContent=wantsApp?'앱은 자유롭게 조작하고, 설명 영역이나 아래 안내 영역을 좌우로 쓸어 발표 페이지를 넘기세요.':scene.caption;
  if(wantsApp)$('focus-box').hidden=true;
  onChange(visible,wantsApp);
 }
 function show(value){scene=value;if(scene.file&&mode==='live')app.ensure();paint();}
 $('show-live').onclick=()=>{mode='live';app.ensure();paint();};
 $('show-example').onclick=()=>{mode='example';paint();};
 $('retry-app').onclick=()=>app.retry();
 return {show,isVisible:()=>!!scene?.file&&mode==='live'&&app.getState()==='ready',isAppMode:()=>!!scene?.file&&mode==='live',reset(){mode='example';}};
};
