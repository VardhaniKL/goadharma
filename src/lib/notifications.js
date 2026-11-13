const nodemailer=require('nodemailer');
const {getAdminEmails}=require('./admin-emails');
let transport;
function getTransport(){
  if(transport)return transport;
  const missing=['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].filter(key=>!process.env[key]);
  if(missing.length)throw Error('Email delivery is not configured. Missing: '+missing.join(', '));
  transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT)||465,secure:String(process.env.SMTP_SECURE||'true')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
  return transport;
}
async function sendEmail(message){return getTransport().sendMail({from:process.env.SMTP_FROM,...message})}
async function notifyAdmin(subject,lines){
  try{
    const recipients=getAdminEmails();
    if(!recipients.length)return false;
    await getTransport().sendMail({from:process.env.SMTP_FROM,to:recipients[0],bcc:recipients.slice(1),subject,text:lines.join('\n')});
    return true;
  }catch(e){console.error('Admin notification email failed:',e.message);return false}
}
module.exports={notifyAdmin,sendEmail};
