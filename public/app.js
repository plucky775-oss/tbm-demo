'use strict';
(() => {
 const {chapters,scenes}=window.DEMO;
 const $=id=>document.getElementById(id);
 const video=$('video');
 const notesStore=window.createPresenterNotesStore();
 let current=0;
 let editingScene=null;
 let turnTimers=[];
 let swipeNavigation;
 const dialogOpen=()=>['zoom','notes-editor','install-help'].some(id=>$(id).open);
 const live=window.createLiveDemo((visible,wantsApp)=>{
  $('enlarge').hidden=wantsApp||!scenes[current].file;
  $('enlarge').textContent='화면 확대';
  updateStatus();requestAnimationFrame(updateFocus);
 });
 function updateFocus(){
  const s=scenes[current],box=$('focus-box'),img=$('screen');
  if(turnTimers.length||live.isAppMode()||!s.focus||!s.file||!img.complete||!img.naturalWidth){box.hidden=true;return;}
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
 const notesKey=s=>s.file||s.format;
 const defaultNotes=s=>({text:(s.notes||chapters[s.chapter].notes).join('\n\n'),cue:s.presenterCue||''});
 function renderNotes(message=''){
  const s=scenes[current],saved=notesStore.read(notesKey(s),defaultNotes(s));
  $('notes-source').textContent=saved.custom?'내가 수정한 멘트':'기본 멘트';
  $('note-text').innerHTML=`<strong>${escapeText(s.label)}</strong>`+saved.text.split(/\n\s*\n/).map(p=>`<p class="note-paragraph">${escapeText(p)}</p>`).join('')+(saved.cue?`<p class="presenter-cue"><b>진행 안내</b> ${escapeText(saved.cue)}</p>`:'');
  $('notes-feedback').textContent=message;
 }
 function clearNotesError(){
  $('notes-editor-error').hidden=true;
  $('notes-input').setCustomValidity('');
 }
 $('edit-notes').addEventListener('click',()=>{
  editingScene=scenes[current];
  const saved=notesStore.read(notesKey(editingScene),defaultNotes(editingScene));
  $('notes-editor-page').textContent=`${pad(current+1)} / ${scenes.length} · ${editingScene.label}`;
  $('notes-input').value=saved.text;$('cue-input').value=saved.cue;
  clearNotesError();video.pause();$('notes-editor').showModal();
  $('notes-input').focus();
 });
 $('notes-input').addEventListener('input',clearNotesError);
 $('cue-input').addEventListener('input',clearNotesError);
 $('notes-default').addEventListener('click',()=>{
  const defaults=defaultNotes(editingScene);
  $('notes-input').value=defaults.text;$('cue-input').value=defaults.cue;
  clearNotesError();$('notes-input').focus();
 });
 $('notes-cancel').addEventListener('click',()=>$('notes-editor').close());
 $('notes-editor').addEventListener('close',()=>{editingScene=null;$('edit-notes').focus();});
 $('notes-form').addEventListener('submit',e=>{
  e.preventDefault();
  if(!editingScene)return;
  if(!$('notes-input').value.trim()){
   $('notes-input').setCustomValidity('발표 멘트를 입력해 주세요.');$('notes-input').reportValidity();return;
  }
  try{
   notesStore.save(notesKey(editingScene),{text:$('notes-input').value,cue:$('cue-input').value},defaultNotes(editingScene));
  }catch(_error){
   $('notes-editor-error').textContent='이 브라우저에 저장하지 못했습니다. 작성한 내용을 복사해 보관하고, 저장 공간이나 브라우저 설정을 확인해 주세요.';
   $('notes-editor-error').hidden=false;return;
  }
  $('notes-editor').close();renderNotes('이 기기·브라우저에 저장했습니다.');
 });
 window.addEventListener('storage',e=>{
  if(!e.key||e.key==='tbm-demo:presenter-notes:v1:'+notesKey(scenes[current]))renderNotes();
 });
 $('chapters').innerHTML=chapters.map((c,i)=>`<button class="chapter" data-chapter="${i}" aria-current="${i===0?'step':'false'}"><span>${pad(i+1)}</span>${c.name}</button>`).join('');
 $('chapters').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)go(firstOfChapter(Number(b.dataset.chapter)));});
 function updateStatus(){
  $('status-text').textContent=scenes[current].format==='video'?'영상은 직접 재생 · 아래 안내 영역을 좌우로 쓸어 이동':live.isAppMode()?'앱은 직접 조작 · 설명 또는 아래 안내 영역을 좌우로 쓸어 이동':'왼쪽으로 쓸면 다음 · 오른쪽으로 쓸면 이전';
 }
 function render(){
  const s=scenes[current],c=chapters[s.chapter];
  video.pause();$('focus-box').hidden=true;
  $('media-error').hidden=true;
  document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.chapter)===s.chapter?'step':'false'));
  $('chapter-number').textContent=`${pad(s.chapter+1)} / ${pad(chapters.length)}`;
  $('chapter-tag').textContent=c.tag;$('title').innerHTML=c.title;$('description').innerHTML=c.description;
  renderNotes();
  $('notes').scrollTop=0;
  $('scene-list').innerHTML=scenes.map((v,i)=>({v,i})).filter(({v})=>v.chapter===s.chapter).map(({v,i},local)=>`<button class="scene-button" data-scene="${i}" aria-current="${i===current}"><span class="dot">${local+1}</span><span>${v.label}</span></button>`).join('');
  $('screen-label').textContent=s.label;$('caption').textContent=s.caption;
  $('media-count').textContent=`${pad(current+1)} / ${scenes.length}`;
  $('canvas').dataset.format=s.format;
  $('enlarge').hidden=!s.file;
  if(s.file){$('screen').src='assets/'+s.file;$('screen').alt=s.label+' · 실제 앱 화면';}
  if(s.format==='video'){video.currentTime=0;$('play-video').textContent='교육영상 재생';$('play-video').hidden=false;updateSound();}
  $('outro-actions').hidden=s.format!=='closing';
  const percent=Math.round((current+1)/scenes.length*100);
  $('progress-fill').style.width=percent+'%';$('progress').setAttribute('aria-valuenow',String(percent));
  live.show(s);updateStatus();requestAnimationFrame(updateFocus);
  const following=scenes[current+1];if(following&&following.file){const im=new Image();im.src='assets/'+following.file;}
 }
 function clearTurn(){
  turnTimers.forEach(clearTimeout);turnTimers=[];
  delete $('main').dataset.pageTurn;delete $('main').dataset.turnDirection;
 }
 function go(index,animate=false){
  swipeNavigation?.reset();clearTurn();
  const target=Math.max(0,Math.min(scenes.length-1,index));
  if(!animate||target===current||window.matchMedia('(prefers-reduced-motion: reduce)').matches){current=target;render();return;}
  video.pause();
  $('main').dataset.turnDirection=target>current?'next':'previous';
  $('main').dataset.pageTurn='out';
  turnTimers=[setTimeout(()=>{current=target;render();$('main').dataset.pageTurn='in';},80),setTimeout(()=>{clearTurn();updateFocus();},180)];
 }
 function turnPage(direction){
  if(turnTimers.length||dialogOpen())return;
  const target=current+direction;
  if(target<0||target>=scenes.length){$('status-text').textContent=target<0?'첫 페이지입니다.':'마지막 페이지입니다. 처음으로를 누르면 다시 시작합니다.';return;}
  go(target,true);
 }
 swipeNavigation=window.bindPageSwipe({surfaces:[$('main'),$('page-swipe-area')],onTurn:turnPage,isBlocked:()=>turnTimers.length>0||dialogOpen()});
 const reset=()=>{live.reset();go(0);$('notes').open=false;};
 $('scene-list').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b)go(Number(b.dataset.scene));});
 $('brand').addEventListener('click',reset);$('reset').addEventListener('click',reset);$('restart').addEventListener('click',reset);
 $('play-video').addEventListener('click',()=>video.play().then(()=>{$('play-video').hidden=true;}).catch(()=>{$('media-error').textContent='동영상을 재생하지 못했습니다. 아래의 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}));
 video.addEventListener('play',()=>{$('play-video').hidden=true;});
 video.addEventListener('ended',()=>{$('play-video').textContent='영상 다시 재생';$('play-video').hidden=false;});
 video.addEventListener('error',()=>{if(scenes[current].format==='video'){$('media-error').textContent='영상이 열리지 않습니다. 연결 상태를 확인하거나 영상만 열기를 눌러 주세요.';$('media-error').hidden=false;}});
 $('screen').addEventListener('error',()=>{$('media-error').textContent='화면을 불러오지 못했습니다. 연결을 확인하고 페이지를 새로고침해 주세요.';$('media-error').hidden=false;});
 $('enlarge').addEventListener('click',()=>{
  $('zoom-image').src=$('screen').src;$('zoom-image').alt=$('screen').alt;$('zoom-image').className=scenes[current].format==='portrait'?'portrait':'';
  $('zoom-title').textContent=scenes[current].label;$('zoom').showModal();
 });
 $('zoom-close').addEventListener('click',()=>$('zoom').close());
 $('zoom').addEventListener('click',e=>{if(e.target===$('zoom'))$('zoom').close();});
 document.addEventListener('keydown',e=>{
  if(dialogOpen()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,video,audio,[contenteditable]:not([contenteditable="false"])'))return;
  if(e.key==='ArrowRight'){e.preventDefault();turnPage(1);}
  if(e.key==='ArrowLeft'){e.preventDefault();turnPage(-1);}
  if(e.key==='Home'){e.preventDefault();reset();}
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)video.pause();
 });
 window.addEventListener('pagehide',()=>{video.pause();});
 render();
})();
