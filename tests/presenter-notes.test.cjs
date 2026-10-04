const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createStore}=require('../public/presenter-notes.js');
const defaults={text:'기본 발표 멘트',cue:'화면을 짚습니다.'};
function memoryStorage(){
 const data=new Map();
 return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
}
test('saved notes survive reopening while other pages keep their defaults',()=>{
 const storage=memoryStorage();
 createStore(()=>storage).save('home.jpeg',{text:'수정한 첫 화면\n\n두 번째 문단',cue:''},defaults);
 const reopened=createStore(()=>storage);
 assert.deepEqual(reopened.read('home.jpeg',defaults),{text:'수정한 첫 화면\n\n두 번째 문단',cue:'',custom:true});
 assert.deepEqual(reopened.read('trade.png',defaults),{...defaults,custom:false});
});
test('restoring one page keeps other saved pages and uses future default wording',()=>{
 const storage=memoryStorage(),store=createStore(()=>storage);
 store.save('home.jpeg',{text:'내 소개',cue:''},defaults);
 store.save('trade.png',{text:'내 공종 설명',cue:'공종'},defaults);
 store.save('home.jpeg',defaults,defaults);
 const updated={text:'새 기본 멘트',cue:'새 안내'};
 assert.deepEqual(store.read('home.jpeg',updated),{...updated,custom:false});
 assert.equal(store.read('trade.png',defaults).text,'내 공종 설명');
});
test('unavailable storage and malformed data do not blank the presentation',()=>{
 for(const saved of ['not-json','null','{}','{"text":123,"cue":""}','{"text":" ","cue":""}',JSON.stringify({text:'a'.repeat(12001),cue:''})]){
  const store=createStore(()=>({getItem:()=>saved}));
  assert.deepEqual(store.read('home.jpeg',defaults),{...defaults,custom:false});
 }
 const blocked=createStore(()=>{throw new Error('SecurityError');});
 assert.deepEqual(blocked.read('home.jpeg',defaults),{...defaults,custom:false});
 assert.throws(()=>blocked.save('home.jpeg',{text:'편집',cue:''},defaults));
});
test('failed or invalid saves leave previous notes intact instead of claiming success',()=>{
 const storage=memoryStorage(),store=createStore(()=>storage);
 store.save('home.jpeg',{text:'보관할 멘트',cue:''},defaults);
 assert.throws(()=>store.save('home.jpeg',{text:'  ',cue:''},defaults));
 storage.setItem=()=>{throw new Error('QuotaExceededError');};
 assert.throws(()=>store.save('home.jpeg',{text:'새 멘트',cue:''},defaults));
 assert.equal(store.read('home.jpeg',defaults).text,'보관할 멘트');
 storage.removeItem=()=>{throw new Error('SecurityError');};
 assert.throws(()=>store.save('home.jpeg',defaults,defaults));
 assert.equal(store.read('home.jpeg',defaults).text,'보관할 멘트');
});
test('every scene has a unique storage identity independent of its position or label',()=>{
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/content.js'),'utf8'),context);
 const scenes=context.window.DEMO.scenes;
 const keys=scenes.map(s=>s.file||s.format);
 assert.equal(new Set(keys).size,scenes.length);
 assert.ok(keys.every(Boolean));
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.ok(html.indexOf('src="presenter-notes.js')<html.indexOf('src="app.js'));
});
