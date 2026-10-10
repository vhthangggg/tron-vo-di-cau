import handler from '../api/online.js';
import {authBundle} from './auth-bundle.mjs';
import {fishAssetModule} from './fish-assets.mjs';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const port=Number(arg('--port','5173'));
const base='/'+arg('--base','').replace(/^\/+|\/+$/g,'');
const mime={'.mp4':'video/mp4','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.csv':'text/csv; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{
  try{
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(base!=='/'){
      if(path===base){res.writeHead(302,{Location:base+'/'});res.end();return;}
      if(!path.startsWith(base+'/')){res.writeHead(404);res.end('Not found');return;}
      path=path.slice(base.length);
    }
    if(path==='/api/online'){await handler(req,res);return;}
    if(path==='/assets/vendor/supabase.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(await authBundle());return;}
    // Research exports are development files, never public game downloads.
    if(['/data/','/docs/','/server/','/supabase/','/api/','/tests/','/node_modules/'].some(prefix=>path.startsWith(prefix))){res.writeHead(404);res.end('Not found');return;}
    if(path==='/src/fish-assets.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(await fishAssetModule(root));return;}
    if(path.endsWith('/'))path+='index.html';
    const file=(path.startsWith('/assets/items/')||path.startsWith('/assets/fish/'))?resolve(root,'public'+path):resolve(root,'.'+path);
    if(!file.startsWith(root+sep)||path.split('/').some(p=>p.startsWith('.')&&p!=='.nojekyll')){res.writeHead(403);res.end('Forbidden');return;}
    if(!(await stat(file)).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Game: http://127.0.0.1:${port}${base==='/'?'/':base+'/'}`));
