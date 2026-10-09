import {readdir,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function fishAssetModule(root){
  const dir=resolve(root,'public/assets/fish'),files={};
  for(const name of (await readdir(dir)).sort()){
    if(!/^fish_(0[1-9]|[1-4]\d|5[0-7])\.(webp|png)$/.test(name))continue;
    const file=await stat(resolve(dir,name));if(file.isFile()&&file.size>0)files[name]=true;
  }
  return `// Generated from uploaded fish artwork.\nexport const FISH_IMAGE_FILES=Object.freeze(${JSON.stringify(files)});\n`;
}
