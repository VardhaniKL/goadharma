const router=require('express').Router();
const path=require('node:path'),fs=require('node:fs/promises');
const multer=require('multer'),rateLimit=require('express-rate-limit');
const storage=require('../lib/local-storage');
const {notifyAdmin}=require('../lib/notifications');
const limit=rateLimit({windowMs:900000,limit:8,standardHeaders:true,legacyHeaders:false});
const upload=multer({storage:multer.diskStorage({destination:async(req,file,cb)=>{try{cb(null,await storage.ensureFolder('consultation-attachments'))}catch(e){cb(e)}},filename:(req,file,cb)=>cb(null,'consultation_attachment_'+storage.stamp()+'_'+storage.safeName(file.originalname))}),limits:{fileSize:10*1024*1024,files:1,fields:8,fieldSize:3000}});
router.post('/contact',limit,upload.single('attachment'),async(req,res)=>{
 let keepFile=false;
 try{
  const {name,email,company='',need='',message=''}=req.body||{};
  if(typeof name!=='string'||name.trim().length<2||name.length>100||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof need!=='string'||need.length>100||typeof company!=='string'||company.length>120||typeof message!=='string'||message.length>2000)return res.status(400).json({error:'Please check the consultation form and try again.'});
  const id=storage.stamp(),receivedAt=new Date().toISOString();
  await storage.saveJson('contact','contact_'+id+'.json',{name:name.trim(),email:email.trim(),company:company.trim(),need,message:message.trim(),...(req.file?{attachmentFileName:req.file.filename,attachmentOriginalName:storage.safeName(req.file.originalname),attachmentPath:path.relative(storage.root,req.file.path)}:{}),signedInAccountName:req.user?.name||req.user?.username||'',signedInAccountEmail:req.user?.email||'',receivedAt});
  keepFile=true;
  await notifyAdmin('New IT consultation inquiry', ['A new consultation inquiry was saved on the server.','','Name: '+name.trim(),'Work email: '+email.trim(),'Signed-in account name: '+(req.user?.name||req.user?.username||'(not signed in)'),'Signed-in account email: '+(req.user?.email||'(not signed in)'),'Company: '+(company.trim()||'(not provided)'),'Topic: '+(need.trim()||'(not provided)'),'Message: '+(message.trim()||'(not provided)'),'Attachment: '+(req.file?req.file.originalname+' (saved in tmp/uploads/consultation-attachments)':'None'),'Received: '+receivedAt]);
  res.json({ok:true});
 }catch(e){console.error('Contact save failed:',e.message);res.status(500).json({error:'We could not save your inquiry on the server. Please try again later.'})}
 finally{if(req.file?.path&&!keepFile)await fs.rm(req.file.path,{force:true}).catch(()=>{})}
});
router.use((e,req,res,next)=>{if(e instanceof multer.MulterError)return res.status(400).json({error:e.code==='LIMIT_FILE_SIZE'?'Please choose an attachment smaller than 10 MB.':'The attachment could not be processed.'});if(e)return res.status(400).json({error:e.message||'The attachment could not be processed.'});next()});
module.exports=router;