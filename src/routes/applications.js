const router=require('express').Router();
const path=require('node:path'),fs=require('node:fs/promises');
const multer=require('multer'),rateLimit=require('express-rate-limit'),jobs=require('../data/jobs');
const {ensureFolder,saveJson,safeName,stamp}=require('../lib/local-storage');
const {requireUser}=require('../lib/auth');
const {notifyAdmin}=require('../lib/notifications');
const limit=rateLimit({windowMs:900000,limit:5,standardHeaders:true,legacyHeaders:false});
const extensions=new Set(['.pdf','.doc','.docx']);
const upload=multer({
  storage:multer.diskStorage({
    destination:async(req,file,cb)=>{try{cb(null,await ensureFolder('job-applications'))}catch(e){cb(e)}},
    filename:(req,file,cb)=>{const jobId=String(req.params.jobId||'job').replace(/[^a-zA-Z0-9_-]/g,'_');cb(null,'resume_'+jobId+'_'+stamp()+'_'+safeName(file.originalname))}
  }),
  limits:{fileSize:10*1024*1024,files:1,fields:8,fieldSize:3000},
  fileFilter:(req,file,cb)=>extensions.has(path.extname(file.originalname).toLowerCase())?cb(null,true):cb(Error('Please upload a PDF, DOC, or DOCX resume.'))
});
router.post('/applications/:jobId',requireUser,limit,upload.single('resume'),async(req,res)=>{
 let keepFile=false;
 try{
  const job=jobs.find(x=>x.id===req.params.jobId);
  if(!job)return res.status(404).json({error:'This job listing is no longer available.'});
  const {name='',phone=''}=req.body||{};
  if(!req.file)return res.status(400).json({error:'Please attach your resume.'});
  if(typeof name!=='string'||name.trim().length<1||name.length>160||typeof phone!=='string'||phone.trim().length<5||phone.length>40)return res.status(400).json({error:'Please check your name and phone number and try again.'});
  const id=job.id.replace(/[^a-zA-Z0-9_-]/g,'_'),receivedAt=new Date().toISOString();
  await saveJson('job-applications','application_'+id+'_'+stamp()+'.json',{
    jobId:job.id,jobTitle:job.title,name:name.trim(),phone:phone.trim(),
    resumeFileName:req.file.filename,resumeOriginalName:safeName(req.file.originalname),
    resumePath:path.relative(require('../lib/local-storage').root,req.file.path),applicantAccount:req.user.email||req.user.username,receivedAt
  });
  keepFile=true;
  await notifyAdmin('New job application: '+job.title, ['A new job application was saved on the server.','','Applicant: '+name.trim(),'Phone: '+phone.trim(),'Job: '+job.title+' ('+job.id+')','Email/account: '+(req.user.email||req.user.username),'Resume: '+req.file.originalname+' (saved in tmp/uploads/job-applications)','Received: '+receivedAt]);
  res.json({ok:true});
 }catch(e){console.error('Application save failed:',e.message);res.status(500).json({error:'We could not save your application on the server. Please try again later.'})}
 finally{if(req.file?.path&&!keepFile)await fs.rm(req.file.path,{force:true}).catch(()=>{})}
});
router.use((e,req,res,next)=>{
  if(e instanceof multer.MulterError)return res.status(400).json({error:e.code==='LIMIT_FILE_SIZE'?'Please choose a resume smaller than 10 MB.':'The uploaded file could not be processed.'});
  if(e)return res.status(400).json({error:e.message||'The uploaded file could not be processed.'});
  next();
});
module.exports=router;
