const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const localRoot=path.join(__dirname,'..','..','credentials');
const hostingerRoot=path.join(os.homedir(),'credentials');
const legacyHostingerRoot=path.join(os.homedir(),'domains','goadharma.com','credentials');
const root=path.resolve(process.env.CREDENTIALS_DIR||(process.env.NODE_ENV==='production'?hostingerRoot:localRoot));
const usersFile=path.join(root,'users.json');
const secretFile=path.join(root,'session-secret.json');
const sessionCookie='et_application_session';
const sessionAge=7*24*60*60;
let secretPromise;
let updateQueue=Promise.resolve();

async function ensureStorage(){
  if(process.env.NODE_ENV==='production'&&!process.env.CREDENTIALS_DIR){try{await fs.access(root)}catch(e){if(e.code==='ENOENT'){try{await fs.rename(legacyHostingerRoot,root)}catch(moveError){if(moveError.code!=='ENOENT')throw moveError}}else throw e}}
  await fs.mkdir(root,{recursive:true,mode:0o700});
  try{await fs.access(usersFile)}catch(e){if(e.code==='ENOENT')await fs.writeFile(usersFile,JSON.stringify({version:1,users:[]},null,2),{flag:'wx',mode:0o600}).catch(err=>{if(err.code!=='EEXIST')throw err});else throw e;}
  await getSecret();
}
async function getSecret(){
  if(!secretPromise)secretPromise=(async()=>{
    try{return JSON.parse(await fs.readFile(secretFile,'utf8')).secret}
    catch(e){if(e.code!=='ENOENT')throw e;const value=crypto.randomBytes(48).toString('base64url');await fs.writeFile(secretFile,JSON.stringify({secret:value}),{flag:'wx',mode:0o600}).catch(err=>{if(err.code!=='EEXIST')throw err});return JSON.parse(await fs.readFile(secretFile,'utf8')).secret;}
  })();
  return secretPromise;
}
async function readUsers(){
  const data=JSON.parse(await fs.readFile(usersFile,'utf8'));
  if(!data||!Array.isArray(data.users))throw Error('Credential store format is invalid.');
  return data.users;
}
async function writeUsers(users){
  const temp=usersFile+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
  await fs.writeFile(temp,JSON.stringify({version:1,users},null,2),{encoding:'utf8',flag:'wx',mode:0o600});
  await fs.rename(temp,usersFile);
}
function serializeUpdate(work){
  const task=updateQueue.then(work);
  updateQueue=task.catch(()=>{});
  return task;
}
function normalizeUsername(value){return String(value||'').trim().toLowerCase()}
function validUsername(value){return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value)}
function validPassword(password){return typeof password==='string'&&password.length>=6&&password.length<=128&&/[0-9]/.test(password)&&/[^A-Za-z0-9\s]/.test(password)}
async function makePasswordHash(password,salt){return await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024})}
async function createAccount(username,email,password){
  await ensureStorage();
  const normalized=normalizeUsername(username),normalizedEmail=String(email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)||normalizedEmail.length>254)throw Error('Enter a valid email address.');
  if(!validUsername(normalized))throw Error('Use a username with 3–32 letters, numbers, dots, underscores, or hyphens.');
  if(!validPassword(password))throw Error('Use at least 6 characters, including at least one number and one special character.');
  const salt=crypto.randomBytes(16),hash=await makePasswordHash(password,salt);
  return serializeUpdate(async()=>{
    const users=await readUsers();
    if(users.some(user=>user.username===normalized))throw Error('That username is already in use.');
    if(users.some(user=>user.email===normalizedEmail))throw Error('That email address is already registered.');
    const verifyToken=crypto.randomBytes(32).toString('base64url');
    const user={id:crypto.randomUUID(),username:normalized,email:normalizedEmail,emailVerified:false,verificationTokenHash:crypto.createHash('sha256').update(verifyToken).digest('hex'),verificationExpiresAt:Date.now()+86400000,salt:salt.toString('hex'),passwordHash:hash.toString('hex'),createdAt:new Date().toISOString()};
    await writeUsers([...users,user]);
    return {id:user.id,username:user.username,email:user.email,verifyToken};
  });
}
async function authenticate(username,password){
  await ensureStorage();
  const normalized=normalizeUsername(username),users=await readUsers(),user=users.find(item=>item.username===normalized);
  const salt=user?Buffer.from(user.salt,'hex'):Buffer.alloc(16,7);
  const candidate=await makePasswordHash(typeof password==='string'?password.slice(0,128):'',salt);
  if(!user||candidate.length!==Buffer.from(user.passwordHash,'hex').length||!crypto.timingSafeEqual(candidate,Buffer.from(user.passwordHash,'hex')))return null;if(!user.emailVerified)throw Error('Confirm your email using the link we sent before signing in.');
  return {id:user.id,username:user.username,email:user.email,verifyToken};
}
async function resendVerification(email){await ensureStorage();const normalized=String(email||'').trim().toLowerCase();return serializeUpdate(async()=>{const users=await readUsers(),user=users.find(item=>item.email===normalized&&!item.emailVerified);if(!user)return null;const token=crypto.randomBytes(32).toString('base64url');user.verificationTokenHash=crypto.createHash('sha256').update(token).digest('hex');user.verificationExpiresAt=Date.now()+86400000;await writeUsers(users);return {email:user.email,verifyToken:token}})}
async function confirmEmail(token){await ensureStorage();const digest=crypto.createHash('sha256').update(String(token)).digest('hex');return serializeUpdate(async()=>{const users=await readUsers(),user=users.find(item=>item.verificationTokenHash===digest);if(!user||user.verificationExpiresAt<Date.now())throw Error('Confirmation link invalid or expired.');user.emailVerified=true;delete user.verificationTokenHash;delete user.verificationExpiresAt;await writeUsers(users);return {id:user.id,username:user.username,email:user.email,name:user.username,provider:'password'}})}
async function setResetCode(email,code){await ensureStorage();return serializeUpdate(async()=>{const users=await readUsers(),user=users.find(item=>item.email===String(email||'').trim().toLowerCase()&&item.emailVerified);if(!user)return false;user.resetCodeHash=crypto.createHash('sha256').update(String(code)).digest('hex');user.resetExpiresAt=Date.now()+600000;user.resetAttempts=0;await writeUsers(users);return true})}
async function resetPassword(email,code,password){if(!validPassword(password))throw Error('Use at least 6 characters, including at least one number and one special character.');const salt=crypto.randomBytes(16),hash=await makePasswordHash(password,salt),digest=crypto.createHash('sha256').update(String(code)).digest('hex');return serializeUpdate(async()=>{const users=await readUsers(),user=users.find(item=>item.email===String(email||'').trim().toLowerCase()&&item.emailVerified);if(!user||!user.resetCodeHash||user.resetExpiresAt<Date.now()||user.resetAttempts>=5||user.resetCodeHash!==digest){if(user&&user.resetCodeHash){user.resetAttempts=(user.resetAttempts||0)+1;await writeUsers(users)}throw Error('The email or reset code is incorrect or expired.')}user.salt=salt.toString('hex');user.passwordHash=hash.toString('hex');delete user.resetCodeHash;delete user.resetExpiresAt;delete user.resetAttempts;await writeUsers(users)})}
function encode(value){return Buffer.from(JSON.stringify(value)).toString('base64url')}
function sign(payload,secret){return crypto.createHmac('sha256',secret).update(payload).digest('base64url')}
async function issueSession(res,user){
  const session={id:user.id,username:user.username||'',name:user.name||user.username||user.email||'',email:user.email||'',provider:user.provider||'password',expiresAt:Date.now()+sessionAge*1000};
  const payload=encode(session),value=payload+'.'+sign(payload,await getSecret());
  const secure=process.env.NODE_ENV==='production'?'; Secure':'';
  res.setHeader('Set-Cookie',sessionCookie+'='+value+'; Path=/; Max-Age='+sessionAge+'; HttpOnly; SameSite=Lax'+secure);
}
async function loadSession(req,res,next){
  try{
    const raw=String(req.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(sessionCookie+'='))?.slice(sessionCookie.length+1);
    if(raw){const [payload,provided]=raw.split('.');if(payload&&provided){const expected=sign(payload,await getSecret()),a=Buffer.from(provided),b=Buffer.from(expected);if(a.length===b.length&&crypto.timingSafeEqual(a,b)){const session=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));if(session.expiresAt>Date.now()&&session.id){req.user={id:session.id,username:session.username,name:session.name,email:session.email,provider:session.provider};}}}}
    res.locals.currentUser=req.user||null;
    next();
  }catch(e){next(e)}
}
function requireUser(req,res,next){if(req.user)return next();res.status(401).json({error:'Sign in before submitting an application.'})}
function clearSession(res){const secure=process.env.NODE_ENV==='production'?'; Secure':'';res.setHeader('Set-Cookie',sessionCookie+'=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'+secure)}
module.exports={root,ensureStorage,createAccount,confirmEmail,resendVerification,setResetCode,resetPassword,authenticate,issueSession,loadSession,requireUser,clearSession,sessionAge};

