'use strict';
(function(root){
 const prefix='tbm-demo:presenter-notes:v1:';
 function createStore(getStorage){
  return {
   read(key,defaults){
    try{
     const saved=JSON.parse(getStorage().getItem(prefix+key));
     if(saved&&typeof saved.text==='string'&&saved.text.trim()&&saved.text.length<=12000&&typeof saved.cue==='string'&&saved.cue.length<=2000){
      return {text:saved.text,cue:saved.cue,custom:true};
     }
    }catch(_error){}
    return {...defaults,custom:false};
   },
   save(key,value,defaults){
    const text=value.text.trim(),cue=value.cue.trim();
    if(!text||text.length>12000||cue.length>2000)throw new Error('invalid-notes');
    const storage=getStorage();
    if(text===defaults.text&&cue===defaults.cue)storage.removeItem(prefix+key);
    else storage.setItem(prefix+key,JSON.stringify({text,cue}));
   }
  };
 }
 if(typeof module==='object'&&module.exports)module.exports={createStore};
 else root.createPresenterNotesStore=()=>createStore(()=>root.localStorage);
})(typeof window==='undefined'?globalThis:window);
