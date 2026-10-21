import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..',process.env.SERVE_DIST==='1'?'dist':'.');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
const CSP="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; manifest-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const headers={'Content-Security-Policy':CSP,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-cache'};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  let decoded;try{decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return;}
  if(decoded.includes('\\')||decoded.includes('\0')){res.writeHead(400).end();return;}
  const safeName=decoded==='/'?'index.html':decoded.replace(/^\/+/,''),path=resolve(root,safeName),rel=relative(root,path);
  const publicFiles=new Set(['index.html','styles.css','manifest.webmanifest','robots.txt','sw.js']);
  if(!publicFiles.has(safeName)&&!safeName.startsWith('assets/')&&!safeName.startsWith('src/')){res.writeHead(404,headers).end('Not found');return;}
  if(rel==='..'||rel.startsWith('..'+sep)||decoded.includes('/.')){res.writeHead(403).end();return;}
  try{const info=await stat(path);if(!info.isFile())throw Error();const ext='.'+safeName.split('.').pop().toLowerCase();if(!types[ext]){res.writeHead(404).end();return;}
    res.writeHead(200,{...headers,'Content-Type':types[ext], 'Content-Length':info.size});if(req.method==='HEAD'){res.end();return;}res.end(await readFile(path));
  }catch{res.writeHead(404,headers).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Applygrove at http://127.0.0.1:${port}`));
