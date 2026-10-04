'use strict';
(() => {
 const {chapters,scenes}=window.DEMO;
 const $=id=>document.getElementById(id);
 const video=$('video');
 let current=0;
 const live=window.createLiveDemo(visible=>{
  $('enlarge').hidden=visible||!scenes[current].file;
  $('enlarge').textContent=visible?'크게 체험하기':'화면 확대';
  updateStatus();requestAnimationFrame(updateFocus);
 });
 function updateFocus(){
  const s=scenes[current],box=$('focus-box'),img=$('screen');
  if(live.isVisible()||!s.focus||!s.file||!img.complete||!img.naturalWidth){box.hidden=true;return;}
  const r=img.getBoundingClientRect(),c=$('canvas').getBoundingClientRect();
  const [x,y,w,h]=s.focus;
  Object.assign(box.style,{left:(r.left-c.left+x*r.width)+'px',top:(r.top-c.top+y*r.height)+'px',width:(w*r.width)+'px',height:(h*r.height)+'px'});
  box.hidden=false;
 }
 function updateSound(){ $('video-sound').textContent=video.muted?'영상 소리 켜기':'영상 소리 끄기';$('video-sound').setAttribute('aria-pressed',String(video.muted)); }
 $('video-sound').addEventListener('click',()=>{video.muted=!video.muted;updateSound();});
 video.addEventListener('volumechange',updateSound);
 $('screen').addEventListener('load',updateFocus);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateFocus).observe($('canvas'));
 window.addEventListener('resize',updateFocus);
 const firstOfChapter=n=>scenes.findIndex(s=>s.chapter===n);
 const pad=n=>String(n).padStart(2,'0');
 const escapeText=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 $('chapters').innerHTML=chapters.map((c,i)=>`<button class="chapter" data-chapter="${i}" aria-current="${i===0?'step':'false'}"><span>${pad(i+1)}</span>${c.name}</button>`).join('');
 $('chapters').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)go(firstOfChapter(Number(b.dataset.chapter)));});
 function updateStatus(){
  $('status-text').textContent=scenes[current].format==='video'?'영상은 재생 버튼을 눌러 주세요':live.isVisible()?'앱은 직접 조작 · 이전·다음은 발표 멘트 이동':'직접 넘기며 설명하세요';
 }
 function render(){
  const s=scenes[current],c=chapters[s.chapter];
  video.pause();$('focus-box').hidden=true;
  $('canvas').classList.remove('expanded');
  $('media-error').hidden=true;
  document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.chapter)===s.chapter?'step':'false'));
  $('chapter-number').textContent=`${pad(s.chapter+1)} / ${pad(chapters.length)}`;
  $('chapter-tag').textContent=c.tag;$('title').innerHTML=c.title;$('description').innerHTML=c.description;
  $('note-text').innerHTML=`<strong>${escapeText(s.label)}</strong>`+(s.notes||c.notes).map(p=>`<p>${escapeText(p)}</p>`).join('')+(s.presenterCue?`<p class="presenter-cue"><b>진행 안내</b> ${escapeText(s.presenterCue)}</p>`:'');
  $('notes').scrollTop=0;
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
  live.show(s);updateStatus();requestAnimationFrame(updateFocus);
  const following=scenes[current+1];if(following&&following.file){const im=new Image();im.src='assets/'+following.file;}
 }
 function go(index){
  current=Math.max(0,Math.min(scenes.length-1,index));render();
 }
 const reset=()=>{live.reset();go(0);$('notes').open=false;};
 $('scene-list').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b)go(Number(b.dataset.scene));});
 $('prev').addEventListener('click',()=>go(current-1,true));
 $('next').addEventListener('click',()=>go((current+1)%scenes.length,true));
 $('brand').addEventListener('click',reset);$('reset').addEventListener('click',reset);$('restart').addEventListener('click',reset);
 $('play-video').addEventListener('click',()=>video.play().then(()=>{$('play-video').hidden=true;}).catch(()=>{$('media-error').textContent='동영상을 재생하지 못했습니다. 아래의 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}));
 video.addEventListener('play',()=>{$('play-video').hidden=true;});
 video.addEventListener('ended',()=>{$('play-video').textContent='영상 다시 재생';$('play-video').hidden=false;});
 video.addEventListener('error',()=>{if(scenes[current].format==='video'){$('media-error').textContent='영상이 열리지 않습니다. 연결 상태를 확인하거나 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}});
 $('screen').addEventListener('error',()=>{$('media-error').textContent='화면을 불러오지 못했습니다. 연결을 확인하고 페이지를 새로고침해 주세요.';$('media-error').hidden=false;});
 $('enlarge').addEventListener('click',()=>{
  if(live.isVisible()){
   const expanded=$('canvas').classList.toggle('expanded');
   $('enlarge').textContent=expanded?'크기 되돌리기':'크게 체험하기';
   return;
  }
  $('zoom-image').src=$('screen').src;$('zoom-image').alt=$('screen').alt;$('zoom-image').className=scenes[current].format==='portrait'?'portrait':'';
  $('zoom-title').textContent=scenes[current].label;$('zoom').showModal();
 });
 $('zoom-close').addEventListener('click',()=>$('zoom').close());
 $('zoom').addEventListener('click',e=>{if(e.target===$('zoom'))$('zoom').close();});
 document.addEventListener('keydown',e=>{
  if($('zoom').open||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT','VIDEO'].includes(e.target.tagName))return;
  if(e.key==='ArrowRight'){e.preventDefault();go((current+1)%scenes.length);}
  if(e.key==='ArrowLeft'){e.preventDefault();go(current-1);}
  if(e.key==='Home'){e.preventDefault();reset();}
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)video.pause();
 });
 window.addEventListener('pagehide',()=>{video.pause();});
 render();
})();
