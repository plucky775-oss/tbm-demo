const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../public/frame-controller.js'),'utf8');
function setup(){
 const events={},timers=new Map(),states=[],messages=[];let seq=0,frame;
 const context={window:{addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]},document:{createElement:()=>frame={contentWindow:{postMessage:m=>messages.push(m)},events:{},attributes:{},setAttribute(n,v){this.attributes[n]=v;},addEventListener(n,f){this.events[n]=f;},remove(){}}},crypto:{randomUUID:()=>String(++seq)},console:{warn(){}},setTimeout:f=>(timers.set(++seq,f),seq),setInterval:f=>(timers.set(++seq,f),seq),clearTimeout:n=>timers.delete(n),clearInterval:n=>timers.delete(n)};
 vm.runInNewContext(source,context);
 const app=context.window.createAppFrame({container:{append(){}},onState:s=>states.push(s)});
 function reply(state,extra={}){events.message({source:frame.contentWindow,origin:'https://power-tbm.vercel.app',data:{type:'tbm:presentation-status',channel:messages.at(-1).channel,state},...extra});}
 return {app,states,timers,reply,messages,get frame(){return frame;}};
}
test('load alone and untrusted messages cannot expose a blank frame',()=>{
 const h=setup();h.app.ensure();assert.equal(h.frame.src,'https://power-tbm.vercel.app/?presentation=1&trial=1');h.frame.events.load();assert.equal(h.frame.referrerPolicy,'strict-origin-when-cross-origin');assert.equal(h.app.getState(),'loading');
 h.reply('ready',{origin:'https://untrusted.example'});assert.equal(h.app.getState(),'loading');
 h.reply('ready',{source:{}});assert.equal(h.app.getState(),'loading');
 h.reply('ready');assert.equal(h.app.getState(),'ready');assert.equal(h.timers.size,0);
});
test('ensure preserves app state; blank content enters recoverable error',()=>{
 const h=setup();h.app.ensure();h.reply('ready');const frame=h.frame;h.app.ensure();assert.equal(h.frame,frame);assert.equal(h.app.getState(),'ready');
 h.reply('blank');assert.equal(h.app.getState(),'error');h.reply('ready');assert.equal(h.app.getState(),'ready');
});
test('location requests are delegated only to the TBM origin, including after retry',()=>{
 const h=setup();h.app.ensure();
 assert.equal(h.frame.attributes.allow,'geolocation https://power-tbm.vercel.app');
 assert.equal(new URL(h.frame.src).origin,'https://power-tbm.vercel.app');
 h.app.retry();assert.equal(h.frame.attributes.allow,'geolocation https://power-tbm.vercel.app');
 h.app.destroy();
});
test('timeout and explicit retry have a fresh readiness channel',()=>{
 const h=setup();h.app.ensure();[...h.timers.values()][0]();assert.equal(h.app.getState(),'error');assert.equal(h.timers.size,0);
 const frame=h.frame;h.app.retry();assert.equal(h.frame,frame);assert.equal(h.app.getState(),'loading');h.reply('ready');assert.equal(h.app.getState(),'ready');h.app.destroy();assert.equal(h.timers.size,0);
});
test('a blocked cartoon navigation cannot retain the previous ready state',()=>{
 const h=setup();h.app.ensure();h.reply('ready');const previousChannel=h.messages.at(-1).channel;
 h.frame.events.load();assert.equal(h.app.getState(),'loading');
 assert.notEqual(h.messages.at(-1).channel,previousChannel);
 h.reply('ready',{data:{type:'tbm:presentation-status',channel:previousChannel,state:'ready'}});
 assert.equal(h.app.getState(),'loading');
 [...h.timers.values()][0]();assert.equal(h.app.getState(),'error');
 h.app.destroy();
});
test('cartoon readiness and returning to TBM reuse the same frame',()=>{
 const h=setup();h.app.ensure();h.reply('ready');const frame=h.frame;
 h.reply('loading');assert.equal(h.app.getState(),'loading');
 frame.events.load();h.reply('ready');assert.equal(h.app.getState(),'ready');
 frame.events.load();h.reply('ready');assert.equal(h.app.getState(),'ready');
 assert.equal(h.frame,frame);h.app.destroy();
});
