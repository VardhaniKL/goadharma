const router=require('express').Router();
const rateLimit=require('express-rate-limit');
const {OAuth2Client}=require('google-auth-library');
const nodemailer=require('nodemailer');
const crypto=require('node:crypto');
function mailer(){const missing=['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].filter(key=>!process.env[key]);if(missing.length)throw Error('Email delivery is not configured. Missing: '+missing.join(', '));return nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT)||465,secure:String(process.env.SMTP_SECURE||'true')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}})}
async function sendMail(to,message){await mailer().sendMail({from:process.env.SMTP_FROM,to,subject:message.subject,text:message.text,html:message.html})}

const auth=require('../lib/auth');
const emailTemplates=require('../lib/email-templates');
const jobs=require('../data/jobs');
const signUpLimit=rateLimit({windowMs:900000,limit:5,standardHeaders:true,legacyHeaders:false});
const signInLimit=rateLimit({windowMs:900000,limit:12,standardHeaders:true,legacyHeaders:false});
const resetLimit=rateLimit({windowMs:900000,limit:5,standardHeaders:true,legacyHeaders:false});
const googleClients=new Map();
router.post('/auth/signup',signUpLimit,async(req,res)=>{
  try{const {username,email,password}=req.body||{};const user=await auth.createAccount(username,email,password);const base=process.env.APP_BASE_URL||'https://goadharma.com';const link=base+'/api/auth/verify-email?token='+encodeURIComponent(user.verifyToken);await sendMail(user.email,emailTemplates.verifyEmail(link));res.json({ok:true,message:'Check your email for the confirmation link.'})}
  catch(e){if(e.message==='That username is already in use.'||e.message==='That email address is already registered.')return res.status(409).json({error:e.message});if(e.message.startsWith('Use a username')||e.message.startsWith('Use a password')||e.message==='Enter a valid email address.')return res.status(400).json({error:e.message});console.error('Account creation failed:',e.message);res.status(500).json({error:'We could not create your account. Please try again later.'})}
});
router.post('/auth/login',signInLimit,async(req,res)=>{
  try{const {username,password}=req.body||{};const user=await auth.authenticate(username,password);if(!user)return res.status(401).json({error:'Username or password is incorrect.'});await auth.issueSession(res,user);res.json({ok:true})}
  catch(e){if(e.message.startsWith('Confirm your email'))return res.status(403).json({error:e.message});console.error('Account sign-in failed:',e.message);res.status(500).json({error:'We could not sign you in. Please try again later.'})}
});
router.post('/auth/google',signInLimit,async(req,res)=>{
  const clientId=process.env.GOOGLE_OAUTH_CLIENT_ID||'';
  if(!clientId)return res.status(503).json({error:'Google sign-in is not configured yet.'});
  try{
    let client=googleClients.get(clientId);if(!client){client=new OAuth2Client(clientId);googleClients.set(clientId,client)}
    const credential=String(req.body?.credential||'');if(!credential||credential.length>12000)return res.status(400).json({error:'Google sign-in could not be verified.'});
    const ticket=await client.verifyIdToken({idToken:credential,audience:clientId}),payload=ticket.getPayload();
    if(!payload?.sub||!payload.email||payload.email_verified!==true)return res.status(401).json({error:'Use a verified Google account to continue.'});
    const user={id:'google:'+payload.sub,username:payload.email,name:payload.name||payload.email,email:payload.email,provider:'google'};
    await auth.issueSession(res,user);res.json({ok:true});
  }catch(e){console.error('Google account sign-in failed:',e.message);res.status(401).json({error:'Google sign-in could not be verified. Please try again.'})}
});
router.get('/auth/verify-email',async(req,res)=>{try{await auth.confirmEmail(String(req.query.token||''));res.redirect('/careers/sign-in?verified=1')}catch(e){res.status(400).send('This email confirmation link is invalid or expired. Please create your account again.')}});
router.post('/auth/resend-verification',resetLimit,async(req,res)=>{try{const user=await auth.resendVerification(req.body?.email);if(user){const base=process.env.APP_BASE_URL||'https://goadharma.com';const link=base+'/api/auth/verify-email?token='+encodeURIComponent(user.verifyToken);await sendMail(user.email,emailTemplates.verifyEmail(link))}res.json({ok:true,message:'If the account needs confirmation, a new link has been sent.'})}catch(e){console.error('Confirmation email failed:',e.message);res.status(503).json({error:'We could not send the confirmation link. Please try again later.'})}});router.post('/auth/forgot-password',resetLimit,async(req,res)=>{const email=String(req.body?.email||'').trim().toLowerCase();const code=String(crypto.randomInt(100000,1000000));try{const exists=await auth.setResetCode(email,code);if(exists)await sendMail(email,emailTemplates.resetPassword(code));res.json({ok:true,message:'If that verified email is registered, a reset code has been sent.'})}catch(e){console.error('Password reset email failed:',e.message);res.status(503).json({error:'We could not send a reset code. Please try again later.'})}});
router.post('/auth/reset-password',resetLimit,async(req,res)=>{try{const {email,code,password}=req.body||{};await auth.resetPassword(email,code,password);res.json({ok:true})}catch(e){res.status(e.message.startsWith('Use a password')?400:400).json({error:e.message||'The reset code could not be verified.'})}});
router.post('/auth/logout',(req,res)=>{auth.clearSession(res);res.json({ok:true})});
module.exports=router;
