const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const html=read('index.html');

function setup({reduced=false,width=1024}={}){
 class Element{
  constructor(tag='DIV'){
   this.tagName=tag;this.listeners={};this.attrs={};this.dataset={};this.style={};this.clientWidth=width;
   this.open=false;this.hidden=false;this.complete=true;this.naturalWidth=700;this.currentTime=0;this.muted=false;this.paused=true;
   const classes=new Set();
   this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)};
  }
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  fire(type,e={}){e.target??=this;e.cancelable??=true;e.preventDefault??=()=>e.defaultPrevented=true;for(const f of this.listeners[type]||[])f(e);this['on'+type]?.(e);return e;}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
  closest(selector){
   if(selector==='[data-chapter]')return this.dataset.chapter!==undefined?this:null;
   if(selector==='[data-scene]')return this.dataset.scene!==undefined?this:null;
   return selector.split(',').some(s=>s===this.tagName.toLowerCase())||this.control?this:null;
  }
  getBoundingClientRect(){return {left:0,top:0,width:700,height:900};}
  setPointerCapture(id){this.pointer=id;}hasPointerCapture(id){return this.pointer===id;}releasePointerCapture(){this.pointer=null;this.fire('lostpointercapture');}
  pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}
  focus(){}showModal(){this.open=true;}close(){this.open=false;this.fire('close');}setCustomValidity(){}reportValidity(){}
 }
 const nodes=new Map();for(const m of html.matchAll(/<([a-z]+)[^>]*\bid="([^"]+)"/g))nodes.set(m[2],new Element(m[1].toUpperCase()));
 const doc=new Element();doc.getElementById=id=>nodes.get(id);doc.querySelectorAll=()=>[];doc.hidden=false;
 const win=new Element();win.innerWidth=width;win.matchMedia=()=>({matches:reduced});
 const stored=new Map();const storage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
 win.createPresenterNotesStore=()=>require('../public/presenter-notes.js').createStore(()=>storage);
 let frames=0,ensures=0;win.createAppFrame=()=>{frames++;return {getState:()=> 'ready',ensure:()=>ensures++,retry(){}};};
 let clock=0,id=0;const timers=new Map();
 const context=vm.createContext({window:win,document:doc,Image:class{},console,requestAnimationFrame:fn=>fn(),setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id)});
 for(const file of ['content.js','live.js','page-swipe.js','app.js'])vm.runInContext(read(file),context,{filename:file});
 const node=id=>nodes.get(id);
 const tick=(ms=450)=>{const end=clock+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;const [key,t]=next;timers.delete(key);clock=t.at;t.fn();}clock=end;};
 const point=(type,x,y=250,extra={})=>{const e={target:node('screen'),pointerId:1,isPrimary:true,button:0,pointerType:'touch',clientX:x,clientY:y,...extra};if(type==='pointerdown'){doc.fire(type,e);(extra.surface||node('main')).fire(type,e);}else win.fire(type,e);};
 const swipe=(dx=-180,dy=0,extra={})=>{point('pointerdown',200,250,extra);point('pointermove',200+dx,250+dy,extra);point('pointerup',200+dx,250+dy,extra);};
 return {node,doc,win,tick,point,swipe,scenes:win.DEMO.scenes,current:()=>parseInt(node('media-count').textContent,10)-1,click:id=>node(id).fire('click'),frameCount:()=>frames,ensures:()=>ensures,stored,Element};
}

test('previous/next buttons and handlers are gone; gesture script loads before app',()=>{
 assert.doesNotMatch(html,/id="(?:prev|next)"/);assert.doesNotMatch(read('app.js'),/\$\('(?:prev|next)'\)/);
 assert(html.indexOf('src="page-swipe.js')<html.indexOf('src="app.js'));
 assert(html.includes('live.js?v=14-swipe'));
 for(const file of ['app.js','style.css'])assert(html.includes(file+'?v=16-calm'));
 assert(html.includes('page-swipe.js?v=15-touch-fix'));
});
test('swipes turn every scene in both directions; ends are bounded',()=>{
 const h=setup();h.swipe(180);h.tick();assert.equal(h.current(),0);
 for(let i=1;i<h.scenes.length;i++){h.swipe();h.tick();assert.equal(h.current(),i);}
 h.swipe();h.tick();assert.equal(h.current(),h.scenes.length-1);
 for(let i=h.scenes.length-2;i>=0;i--){h.swipe(180);h.tick();assert.equal(h.current(),i);}
});
test('touch capture transfer from example image does not cancel the swipe',()=>{
 const h=setup();h.point('pointerdown',200);h.point('pointermove',60);
 h.node('main').fire('lostpointercapture',{target:h.node('screen'),pointerId:1});
 h.point('pointerup',20);h.tick();assert.equal(h.current(),1);
 h.point('pointerdown',200);h.point('pointermove',340);
 h.node('main').fire('lostpointercapture',{target:h.node('screen'),pointerId:1});
 h.point('pointerup',380);h.tick();assert.equal(h.current(),0);
});
test('genuine surface capture loss cancels a gesture',()=>{
 const h=setup();h.point('pointerdown',200);h.point('pointermove',60);
 h.node('main').pointer=null;
 h.node('main').fire('lostpointercapture',{pointerId:1});
 h.point('pointerup',20);h.tick();assert.equal(h.current(),0);
});
test('soft transition direction, rapid swipe lock, reset cancellation and focus alignment',()=>{
 const h=setup();h.swipe();assert.equal(h.node('main').dataset.pageTurn,'out');assert.equal(h.node('main').dataset.turnDirection,'next');h.swipe();h.tick(80);
 assert.equal(h.current(),1);assert.equal(h.node('main').dataset.pageTurn,'in');assert.equal(h.node('focus-box').hidden,true);
 h.tick(100);assert.equal(h.node('main').dataset.pageTurn,undefined);assert.equal(h.node('focus-box').hidden,false);
 h.swipe(180);assert.equal(h.node('main').dataset.turnDirection,'previous');h.tick();assert.equal(h.current(),0);
 h.swipe();h.click('reset');h.tick();assert.equal(h.current(),0);assert.equal(h.node('main').dataset.pageTurn,undefined);
});
test('tap, short drag, vertical and diagonal gestures do not turn pages',()=>{
 for(const [dx,dy] of [[0,0],[25,0],[5,150],[100,150],[120,120]]){const h=setup();h.swipe(dx,dy);h.tick();assert.equal(h.current(),0);}
});
test('cancel, multitouch, nonprimary mouse and browser edge are ignored',()=>{
 const h=setup();h.point('pointerdown',200);h.point('pointermove',60);h.point('pointercancel',60);h.point('pointerup',20);h.tick();assert.equal(h.current(),0);
 h.point('pointerdown',200);h.point('pointermove',60);h.point('pointerdown',250,250,{pointerId:2,isPrimary:false});h.point('pointerup',20);h.tick();assert.equal(h.current(),0);
 h.swipe(-180,0,{button:2,pointerType:'mouse'});h.tick();assert.equal(h.current(),0);
 h.point('pointerdown',3);h.point('pointermove',180);h.point('pointerup',220);h.tick();assert.equal(h.current(),0);
});
test('buttons, media, iframe, summary and modal dialogs keep their own gestures',()=>{
 for(const tag of ['BUTTON','VIDEO','IFRAME','INPUT','TEXTAREA','SELECT','SUMMARY','A']){const h=setup();h.swipe(-180,0,{target:new h.Element(tag)});h.tick();assert.equal(h.current(),0);}
 for(const id of ['zoom','notes-editor','install-help']){const h=setup();h.node(id).open=true;h.swipe();h.tick();assert.equal(h.current(),0);}
});
test('footer works in live-app mode and preserves the same app frame',()=>{
 const h=setup();h.click('show-live');assert.equal(h.node('live-wrap').hidden,false);const frames=h.frameCount();
 h.swipe(-180,0,{target:h.node('status-text'),surface:h.node('page-swipe-area')});h.tick();
 assert.equal(h.current(),1);assert.equal(h.node('live-wrap').hidden,false);assert.equal(h.node('show-live').attrs['aria-pressed'],'true');assert.equal(h.frameCount(),frames);assert(h.ensures()>=2);
});
test('mouse, keyboard and reduced-motion navigation work at phone/tablet/desktop widths',()=>{
 for(const width of [390,768,1024,1440]){const h=setup({width});h.swipe(-180,0,{pointerType:'mouse'});h.tick();assert.equal(h.current(),1);h.doc.fire('keydown',{key:'ArrowRight',target:h.node('main')});h.tick();assert.equal(h.current(),2);}
 const h=setup({reduced:true});h.swipe();assert.equal(h.current(),1);assert.equal(h.node('main').dataset.pageTurn,undefined);
});
test('scene/chapter selection cancels old gestures and video is paused when leaving',()=>{
 const h=setup();h.point('pointerdown',200);h.point('pointermove',60);
 const button=new h.Element('BUTTON');button.dataset.scene='5';h.node('scene-list').fire('click',{target:button});h.point('pointerup',20);h.tick();assert.equal(h.current(),5);
 button.dataset.chapter='2';h.node('chapters').fire('click',{target:button});assert.equal(h.current(),h.scenes.findIndex(s=>s.chapter===2));
 button.dataset.scene=String(h.scenes.findIndex(s=>s.format==='video'));h.node('scene-list').fire('click',{target:button});h.node('video').play();h.swipe();assert.equal(h.node('video').paused,true);h.tick();assert.equal(h.scenes[h.current()].format,'closing');
});
