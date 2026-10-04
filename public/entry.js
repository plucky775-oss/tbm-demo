'use strict';
// Keep the presentation and its live app on one origin for first-party sign-in.
// This HTML is also served through the TBM rewrite, where no redirect is needed.
if(window.top === window && window.location.origin === 'https://tbm-demo-two.vercel.app'){
 window.location.replace('https://power-tbm.vercel.app/presentation/index.html');
}
