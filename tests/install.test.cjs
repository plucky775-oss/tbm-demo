const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/install.js'),'utf8');
function boot(standalone=false){
 const events={},elements={};
 for(const id of ['install-app','install-now','install-help','install-close','install-instructions'])elements[id]={hidden:false,disabled:false,open:false,events:{},addEventListener(n,f){this.events[n]=f;},showModal(){this.open=true;},close(){this.open=false;}};
 const window={addEventListener:(n,f)=>events[n]=f,matchMedia:()=>({matches:standalone,addEventListener(){}})};
 vm.runInNewContext(source,{window,navigator:{userAgent:'Android',platform:'Linux'},document:{readyState:'complete',getElementById:id=>elements[id]}});
 return {events,elements,click:()=>elements['install-app'].events.click()};
}
test('without a native event button opens installation help',async()=>{
 const app=boot();await app.click();assert.equal(app.elements['install-help'].open,true);assert.equal(app.elements['install-now'].hidden,true);
});
test('native event is prompted once; dismissal offers help and a new event enables retry',async()=>{
 const app=boot();let calls=0,prevented=0;
 const event=()=>({preventDefault(){prevented++;},prompt:async()=>{calls++;},userChoice:Promise.resolve({outcome:'dismissed'})});
 app.events.beforeinstallprompt(event());await app.click();await app.click();
 assert.equal(calls,1);assert.equal(app.elements['install-help'].open,true);
 app.events.beforeinstallprompt(event());assert.equal(app.elements['install-now'].hidden,false);await app.click();assert.equal(calls,2);assert.equal(prevented,2);
});
test('prompt failure recovers and appinstalled hides buttons without persisting a guess',async()=>{
 const app=boot();app.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('unavailable');}});
 await app.click();assert.equal(app.elements['install-app'].disabled,false);assert.equal(app.elements['install-help'].open,true);
 app.events.appinstalled();assert.equal(app.elements['install-app'].hidden,true);assert.equal(app.elements['install-help'].open,false);
 assert.equal(boot(true).elements['install-app'].hidden,true);
});
test('manifest launch and identity remain inside the briefing path with green icons',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/manifest.webmanifest'),'utf8'));
 const base='https://power-tbm.vercel.app/presentation/manifest.webmanifest';
 for(const key of ['id','start_url','scope'])assert.ok(new URL(m[key],base).pathname.startsWith('/presentation/'));
 assert.equal(m.name,'TBM 브리핑');assert.deepEqual(m.icons.map(x=>x.sizes),['192x192','512x512']);
 for(const icon of m.icons)assert.ok(fs.existsSync(path.join(__dirname,'../public',icon.src)));
});
