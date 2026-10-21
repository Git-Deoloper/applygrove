import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=43218;
let server;
test('development server restricts methods and files',async t=>{
  server=spawn(process.execPath,['scripts/serve.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)}});
  t.after(()=>server.kill());
  let ready=false;for(let i=0;i<80;i++){try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,60))}
  assert.ok(ready,'server started');
  const response=await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  assert.equal((await fetch(`http://127.0.0.1:${port}/src/core.js`)).status,200);
  assert.equal((await fetch(`http://127.0.0.1:${port}/tests/core.test.js`)).status,404);
  assert.equal((await fetch(`http://127.0.0.1:${port}/package.json`)).status,404);
  assert.equal((await fetch(`http://127.0.0.1:${port}/`,{method:'POST'})).status,405);
  assert.equal((await fetch(`http://127.0.0.1:${port}/index.html`,{method:'HEAD'})).status,200);
});
