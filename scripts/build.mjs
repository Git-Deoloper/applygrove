import {copyFile,mkdir,rm,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const files=['index.html','styles.css','manifest.webmanifest','robots.txt','_headers','sw.js','src/app.js','src/core.js','assets/favicon.svg','assets/hero.webp','assets/hero-small.webp','assets/social-card.png','assets/icon-192.png','assets/icon-512.png'];
await rm(dist,{recursive:true,force:true});
for(const file of files){const dest=resolve(dist,file);await mkdir(dirname(dest),{recursive:true});await copyFile(resolve(root,file),dest)}
const total=(await Promise.all(files.map(async file=>(await stat(resolve(dist,file))).size))).reduce((a,b)=>a+b,0);
console.log(`Built Applygrove: ${files.length} static files, ${(total/1024).toFixed(0)} KiB total assets; no runtime packages.`);
