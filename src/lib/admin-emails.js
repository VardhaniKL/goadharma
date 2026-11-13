function getAdminEmails(){return [...new Set(String(process.env.ADMIN_EMAIL_FOR_NOTIFICATION||'').split(';').map(email=>email.trim().toLowerCase()).filter(email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))]}
function isAdminEmail(email){const normalized=String(email||'').trim().toLowerCase();return !!normalized&&getAdminEmails().includes(normalized)}
module.exports={getAdminEmails,isAdminEmail};