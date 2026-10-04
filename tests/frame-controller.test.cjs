const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../public/frame-controller.js'),'utf8');
function setup(){
 const events={},timers=new Map(),states=[],messages=[];let seq=0,frame;
 const context={window:{addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n]},document:{createElement:()=>frame={contentWindow:{postMessage:m=>messages.push(m)},events:{},setAttribute(){},addEventListener(n,f){this.events[n]=f;},remove(){}}},crypto:{randomUUID:()=>String(++seq)},console:{warn(){}},setTimeout:f=>(timers.set(++seq,f),seq),setInterval:f=>(timers.set(++seq,f),seq),clearTimeout:n=>timers.delete(n),clearInterval:n=>timers.delete(n)};
 vm.runInNewContext(source,context);
 const app=context.window.createAppFrame({container:{append(){}},onState:s=>states.push(s)});
 function reply(state,extra={}){frame.events.load();events.message({source:frame.contentWindow,origin:'https://power-tbm.vercel.app',data:{type:'tbm:presentation-status',channel:messages.at(-1).channel,state},...extra});}
 return {app,states,timers,reply,get frame(){return frame;}};
}
test('load alone and untrusted messages cannot expose a blank frame',()=>{
 const h=setup();h.app.ensure();h.frame.events.load();assert.equal(h.app.getState(),'loading');
 h.reply('ready',{origin:'https://untrusted.example'});assert.equal(h.app.getState(),'loading');
 h.reply('ready',{source:{}});assert.equal(h.app.getState(),'loading');
 h.reply('ready');assert.equal(h.app.getState(),'ready');assert.equal(h.timers.size,0);
});
test('ensure preserves app state; blank content enters recoverable error',()=>{
 const h=setup();h.app.ensure();h.reply('ready');const frame=h.frame;h.app.ensure();assert.equal(h.frame,frame);assert.equal(h.app.getState(),'ready');
 h.reply('blank');assert.equal(h.app.getState(),'error');h.reply('ready');assert.equal(h.app.getState(),'ready');
});
test('timeout and explicit retry have a fresh readiness channel',()=>{
 const h=setup();h.app.ensure();[...h.timers.values()][0]();assert.equal(h.app.getState(),'error');assert.equal(h.timers.size,0);
 const frame=h.frame;h.app.retry();assert.equal(h.frame,frame);assert.equal(h.app.getState(),'loading');h.reply('ready');assert.equal(h.app.getState(),'ready');h.app.destroy();assert.equal(h.timers.size,0);
});
