import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const port=Number(arg('--port','5173'));
const base='/'+arg('--base','').replace(/^\/+|\/+$/g,'');
const mime={'.mp4':'video/mp4','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{
  try{
    let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(base!=='/'){
      if(path===base){res.writeHead(302,{Location:base+'/'});res.end();return;}
      if(!path.startsWith(base+'/')){res.writeHead(404);res.end('Not found');return;}
      path=path.slice(base.length);
    }
    if(path.endsWith('/'))path+='index.html';
    const file=path.startsWith('/assets/items/')?resolve(root,'public'+path):resolve(root,'.'+path);
    if(!file.startsWith(root+sep)||path.split('/').some(p=>p.startsWith('.')&&p!=='.nojekyll')){res.writeHead(403);res.end('Forbidden');return;}
    if(!(await stat(file)).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Game: http://127.0.0.1:${port}${base==='/'?'/':base+'/'}`));
