'use strict';
// Presentation gestures never intercept the embedded app or media controls.
window.bindPageSwipe=function({surfaces,onTurn,isBlocked}){
 let swipe=null;
 const isControl=target=>!!target.closest('button,a,input,textarea,select,summary,iframe,video,audio,[contenteditable]:not([contenteditable="false"]),[role="slider"],.live-wrap,.frame-message');
 function reset(){
  const previous=swipe;swipe=null;
  if(!previous)return;
  previous.surface.classList.remove('is-page-dragging');
  if(previous.surface.hasPointerCapture?.(previous.id))previous.surface.releasePointerCapture(previous.id);
 }
 document.addEventListener('pointerdown',e=>{if(swipe&&swipe.id!==e.pointerId)reset();},{capture:true,passive:true});
 for(const surface of surfaces){
  surface.addEventListener('pointerdown',e=>{
   if(!e.isPrimary||e.button!==0||isBlocked()||isControl(e.target))return;
   if(e.pointerType==='touch'&&(e.clientX<18||e.clientX>window.innerWidth-18))return;
   swipe={surface,id:e.pointerId,x:e.clientX,y:e.clientY,horizontal:false};
  },{passive:true});
  surface.addEventListener('lostpointercapture',reset);
  surface.addEventListener('dragstart',e=>{if(!isControl(e.target))e.preventDefault();});
 }
 window.addEventListener('pointermove',e=>{
  if(!swipe||swipe.id!==e.pointerId)return;
  if(isBlocked()){reset();return;}
  const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;
  if(!swipe.horizontal){
   if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;
   if(Math.abs(dx)<=Math.abs(dy)*1.35){reset();return;}
   swipe.horizontal=true;
   swipe.surface.classList.add('is-page-dragging');
   swipe.surface.setPointerCapture?.(e.pointerId);
  }
  if(e.cancelable)e.preventDefault();
 },{passive:false});
 window.addEventListener('pointerup',e=>{
  if(!swipe||swipe.id!==e.pointerId)return;
  const gesture=swipe,dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  const threshold=Math.max(44,Math.min(90,gesture.surface.clientWidth*.08));
  reset();
  if(!isBlocked()&&gesture.horizontal&&Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.35)onTurn(dx<0?1:-1);
 });
 window.addEventListener('pointercancel',reset);
 window.addEventListener('blur',reset);
 document.addEventListener('visibilitychange',reset);
 return {reset};
};
