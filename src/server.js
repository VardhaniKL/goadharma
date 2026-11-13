require('dotenv').config();
const path=require('node:path'),express=require('express'),helmet=require('helmet'),compression=require('compression');
const app=express(),prod=process.env.NODE_ENV==='production';
app.disable('x-powered-by');app.set('view engine','ejs');app.set('views',path.join(__dirname,'..','views'));app.set('trust proxy',prod?1:false);
app.use(helmet({contentSecurityPolicy:false,crossOriginOpenerPolicy:{policy:'same-origin-allow-popups'}}));app.use(compression());app.use(express.urlencoded({extended:false,limit:'10kb'}));app.use(express.json({limit:'10kb'}));
app.use('/assets',express.static(path.join(__dirname,'..','public'),{maxAge:prod?'7d':0,etag:true,index:false}));
// Keep submission files private; only the public assets folder is served.
const localStorage=require('./lib/local-storage');
console.log('Submission files stored in:',localStorage.root);
localStorage.ensureFolder('job-applications').catch(e=>console.error('Upload folder setup failed:',e.message));
const auth=require('./lib/auth');
console.log('Applicant credential store:',auth.root);
auth.ensureStorage().catch(e=>console.error('Credential storage setup failed:',e.message));
app.use(auth.loadSession);
app.use('/api',require('./routes/auth'));app.use('/api/admin',require('./routes/admin'));app.use('/api',require('./routes/contact'));app.use('/api',require('./routes/chat'));app.use('/api',require('./routes/applications'));app.use('/',require('./routes/pages'));
app.use((req,res)=>res.status(404).render('pages/error',{title:'Not found | goadharma',code:'404'}));
app.use((err,req,res,next)=>{if(res.headersSent)return next(err);console.error('Request failed:',err.message);res.status(err.status||500).json({error:err.status&&err.status<500?err.message:'Unable to process your request. Please try again.'})});
app.listen(Number(process.env.PORT)||3000,()=>console.log('goadharma listening'));
