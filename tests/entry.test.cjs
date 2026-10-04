const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/entry.js'),'utf8');
function visit(origin,embedded=false){
 const redirects=[];
 const window={location:{origin,replace:url=>redirects.push(url)}};
 window.top=embedded?{}:window;
 vm.runInNewContext(source,{window});
 return redirects;
}
test('old public entry moves to the first-party presentation without forwarding URL secrets',()=>{
 assert.deepEqual(visit('https://tbm-demo-two.vercel.app'),['https://power-tbm.vercel.app/presentation/index.html']);
});
test('rewritten presentation, local previews and embedded pages never redirect in a loop',()=>{
 for(const origin of ['https://power-tbm.vercel.app','http://localhost:3000','https://preview.example']){
  assert.deepEqual(visit(origin),[]);
 }
 assert.deepEqual(visit('https://tbm-demo-two.vercel.app',true),[]);
});
test('entry runs before the app and relative assets resolve inside the rewritten path',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.ok(html.indexOf('src="entry.js?v=1"') < html.indexOf('src="content.js'));
 const urls=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(url=>!url.startsWith('https:'));
 for(const url of urls){
  const resolved=new URL(url,'https://power-tbm.vercel.app/presentation/index.html');
  assert.ok(resolved.pathname.startsWith('/presentation/'),url);
 }
});
