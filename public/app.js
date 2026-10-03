'use strict';
(() => {
 const {chapters,scenes}=window.DEMO;
 const $=id=>document.getElementById(id);
 const video=$('video');
 let current=0,automatic=false,timer=null,renderId=0;
 let restoreAuto=false;
 let mode='presenter';
 function updateFocus(){
  const s=scenes[current],box=$('focus-box'),img=$('screen');
  if(!s.focus||!s.file||!img.complete||!img.naturalWidth){box.hidden=true;return;}
  const r=img.getBoundingClientRect(),c=$('canvas').getBoundingClientRect();
  const [x,y,w,h]=s.focus;
  Object.assign(box.style,{left:(r.left-c.left+x*r.width)+'px',top:(r.top-c.top+y*r.height)+'px',width:(w*r.width)+'px',height:(h*r.height)+'px'});
  box.hidden=false;
 }
 function updateSound(){ $('video-sound').textContent=video.muted?'영상 소리 켜기':'영상 소리 끄기';$('video-sound').setAttribute('aria-pressed',String(video.muted)); }
 function setMode(value){
  mode=value;document.body.dataset.mode=value;
  $('presenter-mode').setAttribute('aria-pressed',String(value==='presenter'));
  $('kiosk-mode').setAttribute('aria-pressed',String(value==='kiosk'));
  if(value==='kiosk'){$('notes').open=false;video.muted=true;}
  else video.muted=false;
  updateSound();setAuto(value==='kiosk');requestAnimationFrame(updateFocus);
 }
 $('presenter-mode').addEventListener('click',()=>setMode('presenter'));
 $('kiosk-mode').addEventListener('click',()=>setMode('kiosk'));
 $('video-sound').addEventListener('click',()=>{video.muted=!video.muted;updateSound();});
 video.addEventListener('volumechange',updateSound);
 $('screen').addEventListener('load',updateFocus);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateFocus).observe($('canvas'));
 window.addEventListener('resize',updateFocus);
 const firstOfChapter=n=>scenes.findIndex(s=>s.chapter===n);
 const pad=n=>String(n).padStart(2,'0');
 const escapeText=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 $('chapters').innerHTML=chapters.map((c,i)=>`<button class="chapter" data-chapter="${i}" aria-current="${i===0?'step':'false'}"><span>${pad(i+1)}</span>${c.name}</button>`).join('');
 $('chapters').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)go(firstOfChapter(Number(b.dataset.chapter)),true);});
 function stopTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
 function autoLabel(){
  $('auto').setAttribute('aria-pressed',String(automatic));
  $('auto-icon').textContent=automatic?'Ⅱ':'▷';
  $('auto-label').textContent=automatic?'시연 멈춤':'자동 시연';
  $('status-text').textContent=automatic?'자동 반복 시연 중':scenes[current].format==='video'?'영상은 재생 버튼을 눌러 주세요':'직접 넘기며 설명하세요';
 }
 function schedule(){
  stopTimer();
  if(!automatic||document.hidden||$('zoom').open)return;
  if(scenes[current].format==='video'){
   video.play().then(()=>{$('play-video').hidden=true;}).catch(()=>{
    automatic=false;autoLabel();$('play-video').hidden=false;
    $('status-text').textContent='재생 버튼을 눌러 영상을 시작하세요';
   });
  }else{
   const token=renderId;timer=setTimeout(()=>{if(automatic&&token===renderId)go((current+1)%scenes.length);},scenes[current].seconds*1000);
  }
 }
 function render(){
  const s=scenes[current],c=chapters[s.chapter];renderId++;
  stopTimer();video.pause();$('focus-box').hidden=true;
  $('media-error').hidden=true;
  document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.chapter)===s.chapter?'step':'false'));
  $('chapter-number').textContent=`${pad(s.chapter+1)} / ${pad(chapters.length)}`;
  $('chapter-tag').textContent=c.tag;$('title').innerHTML=c.title;$('description').innerHTML=c.description;
  $('note-text').innerHTML=c.notes.map(p=>`<p>${escapeText(p)}</p>`).join('');
  $('scene-list').innerHTML=scenes.map((v,i)=>({v,i})).filter(({v})=>v.chapter===s.chapter).map(({v,i},local)=>`<button class="scene-button" data-scene="${i}" aria-current="${i===current}"><span class="dot">${local+1}</span><span>${v.label}</span></button>`).join('');
  $('screen-label').textContent=s.label;$('caption').textContent=s.caption;
  $('media-count').textContent=`${pad(current+1)} / ${scenes.length}`;
  $('canvas').dataset.format=s.format;
  $('image-wrap').hidden=!s.file;$('closing-visual').hidden=s.format!=='closing';$('video-wrap').hidden=s.format!=='video';
  $('enlarge').hidden=!s.file;
  if(s.file){$('screen').src='assets/'+s.file;$('screen').alt=s.label+' · 실제 앱 화면';}
  if(s.format==='video'){video.currentTime=0;$('play-video').textContent='교육영상 재생';$('play-video').hidden=false;updateSound();}
  $('outro-actions').hidden=s.format!=='closing';
  $('prev').disabled=current===0;
  $('next').textContent=current===scenes.length-1?'다시 보기':'다음';
  const percent=Math.round((current+1)/scenes.length*100);
  $('progress-fill').style.width=percent+'%';$('progress').setAttribute('aria-valuenow',String(percent));
  autoLabel();schedule();requestAnimationFrame(updateFocus);
  const following=scenes[current+1];if(following&&following.file){const im=new Image();im.src='assets/'+following.file;}
 }
 function setAuto(value){automatic=value;autoLabel();if(automatic)schedule();else{stopTimer();if(scenes[current].format==='video')video.pause();}}
 function go(index,manual=false){
  if(manual)setAuto(false);
  current=Math.max(0,Math.min(scenes.length-1,index));render();
 }
 const reset=()=>{go(0,true);$('notes').open=false;};
 $('scene-list').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b)go(Number(b.dataset.scene),true);});
 $('auto').addEventListener('click',()=>setAuto(!automatic));
 $('prev').addEventListener('click',()=>go(current-1,true));
 $('next').addEventListener('click',()=>go((current+1)%scenes.length,true));
 $('brand').addEventListener('click',reset);$('reset').addEventListener('click',reset);$('restart').addEventListener('click',reset);
 $('play-video').addEventListener('click',()=>video.play().then(()=>{$('play-video').hidden=true;}).catch(()=>{$('media-error').textContent='동영상을 재생하지 못했습니다. 아래의 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}));
 video.addEventListener('play',()=>{$('play-video').hidden=true;});
 video.addEventListener('ended',()=>{if(automatic)go((current+1)%scenes.length);else{$('play-video').textContent='영상 다시 재생';$('play-video').hidden=false;}});
 video.addEventListener('error',()=>{if(scenes[current].format==='video'){setAuto(false);$('media-error').textContent='영상이 열리지 않습니다. 연결 상태를 확인하거나 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}});
 $('screen').addEventListener('error',()=>{setAuto(false);$('media-error').textContent='화면을 불러오지 못했습니다. 연결을 확인하고 페이지를 새로고침해 주세요.';$('media-error').hidden=false;});
 $('enlarge').addEventListener('click',()=>{
  restoreAuto=automatic;setAuto(false);
  $('zoom-image').src=$('screen').src;$('zoom-image').alt=$('screen').alt;$('zoom-image').className=scenes[current].format==='portrait'?'portrait':'';
  $('zoom-title').textContent=scenes[current].label;$('zoom').showModal();
 });
 $('zoom-close').addEventListener('click',()=>$('zoom').close());
 $('zoom').addEventListener('close',()=>{if(restoreAuto)setAuto(true);restoreAuto=false;});
 $('zoom').addEventListener('click',e=>{if(e.target===$('zoom'))$('zoom').close();});
 $('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}else{$('status-text').textContent='이 기기에서는 브라우저의 전체화면 기능을 사용해 주세요';}}
  catch{$('status-text').textContent='전체화면을 열 수 없습니다. 현재 화면에서도 시연할 수 있습니다.';}
 });
 document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'전체화면 닫기':'전체화면';});
 document.addEventListener('keydown',e=>{
  if($('zoom').open||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT','VIDEO'].includes(e.target.tagName))return;
  if(e.key==='ArrowRight'){e.preventDefault();go((current+1)%scenes.length,true);}
  if(e.key==='ArrowLeft'){e.preventDefault();go(current-1,true);}
  if(e.key==='Home'){e.preventDefault();reset();}
  if(e.code==='Space'&&e.target===document.body){e.preventDefault();setAuto(!automatic);}
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopTimer();video.pause();}else if(automatic)schedule();
 });
 window.addEventListener('pagehide',()=>{stopTimer();video.pause();});
 render();
})();
