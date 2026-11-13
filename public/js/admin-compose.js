const form=document.getElementById('adminComposeForm');
const status=document.getElementById('adminComposeStatus');
const successDialog=document.getElementById('adminComposeSuccess');
const returnButton=document.getElementById('returnToAdminConsole');
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const file=form.elements.attachment.files[0];
  if(file&&file.size>5*1024*1024){status.textContent='Attachments must be 5 MB or smaller.';return}
  const button=form.querySelector('button[type=submit]');button.disabled=true;status.textContent='Sending email…';
  try{
    const response=await fetch('/api/admin/reply',{method:'POST',body:new FormData(form)}),data=await response.json();
    if(!response.ok)throw Error(data.error||'The email could not be sent.');
    status.textContent='Email sent successfully.';successDialog.showModal();returnButton.focus();
  }catch(error){status.textContent=error.message||'The email could not be sent.';button.disabled=false}
});
successDialog.addEventListener('cancel',event=>event.preventDefault());
returnButton.addEventListener('click',()=>window.location.assign('/admin/inbox?tab=sent'));
