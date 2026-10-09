import React from 'react';import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';import App from '../src/App.jsx';import {StoreProvider} from '../src/store.jsx';
const root=document.getElementById('root');
const show=m=>{root.innerHTML='<pre style="padding:16px;color:#b91c1c;white-space:pre-wrap">PawConnect failed to start:\n'+m+'</pre>'};
addEventListener('error',e=>{if(!root.children.length)show(e.message)});
try{createRoot(root).render(<BrowserRouter><StoreProvider><App/></StoreProvider></BrowserRouter>)}catch(e){show(String(e&&e.stack||e))}
