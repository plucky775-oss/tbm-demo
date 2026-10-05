'use strict';
(() => {
 let pending=null,busy=false,installed=false;
 const standalone=window.matchMedia('(display-mode: standalone)');
 const $=id=>document.getElementById(id);
 function update(){
  const button=$('install-app');
  if(!button)return;
  button.hidden=installed||standalone.matches||navigator.standalone===true;
  button.disabled=busy;
  $('install-now').hidden=!pending;
  $('install-now').disabled=busy;
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();pending=event;update();
 });
 window.addEventListener('appinstalled',()=>{
  installed=true;pending=null;update();
  if($('install-help')?.open)$('install-help').close();
 });
 standalone.addEventListener?.('change',update);
 function help(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  $('install-instructions').textContent=ios
   ?'Safari에서 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택해 주세요.'
   :'안드로이드 Chrome에서 오른쪽 위 ⋮ 메뉴 → ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택해 주세요. 삼성 인터넷에서는 메뉴의 ‘현재 페이지 추가’ → ‘홈 화면’을 확인해 주세요.';
  if(!$('install-help').open)$('install-help').showModal();
  update();
 }
 async function install(){
  if(busy)return;
  if(!pending){help();return;}
  const event=pending;pending=null;busy=true;update();
  try{
   await event.prompt();
   const choice=await event.userChoice;
   if(choice.outcome==='accepted'){
    if($('install-help').open)$('install-help').close();
   }else help();
  }catch(_error){help();}
  finally{busy=false;update();}
 }
 function init(){
  $('install-app').addEventListener('click',install);
  $('install-now').addEventListener('click',install);
  $('install-close').addEventListener('click',()=>$('install-help').close());
  update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
