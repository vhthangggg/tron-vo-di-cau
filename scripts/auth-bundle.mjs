import {build} from 'esbuild';
import {resolve} from 'node:path';
let cached;
export async function authBundle(){
 if(!cached)cached=build({entryPoints:[resolve(import.meta.dirname,'../src/auth-provider.js')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true}).then(r=>r.outputFiles[0].contents);
 return cached;
}
