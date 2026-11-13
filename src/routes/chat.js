const router=require('express').Router();
const rateLimit=require('express-rate-limit');
const multer=require('multer'),path=require('node:path'),fs=require('node:fs/promises');
const {ensureFolder,saveJson,safeName,stamp}=require('../lib/local-storage');
const {notifyAdmin}=require('../lib/notifications');
const limit=rateLimit({windowMs:900000,limit:30,standardHeaders:true,legacyHeaders:false});
const upload=multer({
 storage:multer.diskStorage({
  destination:async(req,file,cb)=>{try{cb(null,await ensureFolder('chat'))}catch(e){cb(e)}},
  filename:(req,file,cb)=>cb(null,'chat_attachment_'+stamp()+'_'+safeName(file.originalname))
 }),
 limits:{fileSize:10*1024*1024,files:1,fields:3,fieldSize:3000}
});
router.post('/chat',limit,upload.single('attachment'),async(req,res)=>{
 let keepFile=false;
 try{
  const {conversationId='',message='',reply=''}=req.body||{};
  if(typeof message!=='string'||message.trim().length<2||message.length>2000||typeof reply!=='string'||reply.length>2000||typeof conversationId!=='string'||conversationId.length>80)return res.status(400).json({error:'Please check the chat message and try again.'});
  const id=stamp();
  await saveJson('chat','chat_'+id+'.json',{
   conversationId,message:message.trim(),reply:reply.trim(),senderAccountName:req.user?.name||req.user?.username||'',senderAccountEmail:req.user?.email||'',
   ...(req.file?{attachmentFileName:req.file.filename,attachmentOriginalName:safeName(req.file.originalname),attachmentPath:path.relative(require('../lib/local-storage').root,req.file.path)}:{}),
   receivedAt:new Date().toISOString()
  });
  keepFile=true;
  await notifyAdmin('New website chat message', ['A new chat message was saved on the server.','','Message: '+message.trim(),'Reply: '+(reply.trim()||'(none)'), 'Signed-in account name: '+(req.user?.name||req.user?.username||'(not signed in)'), 'Signed-in account email: '+(req.user?.email||'(not signed in)'),'Attachment: '+(req.file?req.file.originalname+' (saved in tmp/uploads/chat)':'None'),'Conversation: '+(conversationId||'(not provided)'),'Received: '+new Date().toISOString()]);
  res.json({ok:true});
 }catch(e){console.error('Chat save failed:',e.message);res.status(500).json({error:'We could not save this message on the server. Please try again later.'})}
 finally{if(req.file?.path&&!keepFile)await fs.rm(req.file.path,{force:true}).catch(()=>{})}
});
router.use((e,req,res,next)=>{if(e instanceof multer.MulterError)return res.status(400).json({error:e.code==='LIMIT_FILE_SIZE'?'Please choose a file smaller than 10 MB.':'The attachment could not be processed.'});if(e)return res.status(400).json({error:'The attachment could not be processed.'});next()});
module.exports=router;
