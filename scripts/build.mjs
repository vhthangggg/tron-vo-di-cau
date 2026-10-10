import {authBundle} from './auth-bundle.mjs';
import {fishAssetModule} from './fish-assets.mjs';
import {cp,mkdir,rm,stat,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {MAPS} from '../src/content.js';
const root=resolve(import.meta.dirname,'..');
await rm(resolve(root,'dist'),{recursive:true,force:true});
await mkdir(resolve(root,'dist'),{recursive:true});
await cp(resolve(root,'public/assets/items'),resolve(root,'dist/assets/items'),{recursive:true});
await cp(resolve(root,'public/assets/fish'),resolve(root,'dist/assets/fish'),{recursive:true});
for(const file of ['index.html','styles.css','desktop.css','workbench.css','online.css','.nojekyll','assets','src'])await cp(resolve(root,file),resolve(root,'dist',file),{recursive:true});
for(const file of ['assets/ao-lang.webp','assets/viet-sans.woff','assets/viet-bold.woff','assets/viet-serif.woff'])await stat(resolve(root,'dist',file));
for(const map of MAPS)for(const asset of [map.background,map.thumbnail,...map.spots.flatMap(spot=>spot.video?[spot.video]:[])]){const file=await stat(resolve(root,'dist',asset));if(file.size<1000)throw Error(`Missing landscape for ${map.name}`);}
await writeFile(resolve(root,'dist/src/fish-assets.js'),await fishAssetModule(root));
const {version}=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
let commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||null;
if(!commit)try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}
await writeFile(resolve(root,'dist/release.json'),JSON.stringify({version,commit},null,2)+'\n');
await mkdir(resolve(root,'dist/assets/vendor'),{recursive:true});
await writeFile(resolve(root,'dist/assets/vendor/supabase.js'),await authBundle());
console.log('Static game ready in dist/. Online API runs separately on Vercel.');
