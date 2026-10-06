import {cp,mkdir,rm,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
for(const file of ['index.html','styles.css','.nojekyll','assets','src'])await cp(resolve(root,file),resolve(root,'dist',file),{recursive:true});
for(const file of ['assets/ao-lang.webp','assets/viet-sans.woff','assets/viet-bold.woff','assets/viet-serif.woff'])await stat(resolve(root,'dist',file));
console.log('Static game ready in dist/. No build-time or runtime dependencies.');
