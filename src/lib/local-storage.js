const path=require('node:path');
const fs=require('node:fs/promises');
const os=require('node:os');
const localRoot=path.join(__dirname,'..','..','tmp','uploads');
const hostingerRoot=path.join(os.homedir(),'tmp','uploads');
const legacyHostingerRoot=path.join(os.homedir(),'domains','goadharma.com','tmp','uploads');
const root=path.resolve(process.env.UPLOAD_DIR||(process.env.NODE_ENV==='production'?hostingerRoot:localRoot));

async function ensureFolder(name){
  if(process.env.NODE_ENV==='production'&&!process.env.UPLOAD_DIR){try{await fs.access(root)}catch(e){if(e.code==='ENOENT'){try{await fs.rename(legacyHostingerRoot,root)}catch(moveError){if(moveError.code!=='ENOENT')throw moveError}}else throw e}}
  const folder=path.join(root,name);
  await fs.mkdir(folder,{recursive:true,mode:0o700});
  return folder;
}
async function saveJson(folder,name,value){
  const dir=await ensureFolder(folder);
  const file=path.join(dir,name);
  await fs.writeFile(file,JSON.stringify(value,null,2),{encoding:'utf8',flag:'wx',mode:0o600});
  return file;
}
function safeName(value){
  return path.basename(String(value||'file').replace(/\\/g,'/')).replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,120)||'file';
}
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-')+'_'+require('node:crypto').randomBytes(3).toString('hex')}
module.exports={root,ensureFolder,saveJson,safeName,stamp};
