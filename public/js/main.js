const menu=document.querySelector('.menu'),nav=document.querySelector('.header nav');menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open)});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));
const form=document.getElementById('contactForm');
form?.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const status=document.getElementById('status'),button=form.querySelector('button');
  button.disabled=true;status.textContent='Sending your inquiry…';status.className='';
  try{
    const response=await fetch('/api/contact',{method:'POST',body:new FormData(form)}),data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Unable to save. Please try again.');
    form.reset();status.textContent='Your inquiry was saved on the server. We will be in touch shortly.';status.className='status-success';
  }catch(error){status.textContent=error.message||'Unable to save. Please try again.';status.className='status-error';}
  finally{button.disabled=false}
});

// Each exchange is answered in the browser and sent to the server for saving.
const chatForm=document.getElementById('chatForm'),chatPanel=document.getElementById('chatPanel'),chatLauncher=document.querySelector('.chat-launcher'),chatClose=document.querySelector('.chat-close'),chatMessages=document.getElementById('chatMessages'),chatStatus=document.getElementById('chatStatus'),chatContent=document.getElementById('chatContent'),chatAttachment=document.getElementById('chatAttachment'),chatAttachmentName=document.getElementById('chatAttachmentName');
function toggleChat(open){if(!chatPanel||!chatLauncher)return;chatPanel.hidden=!open;chatLauncher.setAttribute('aria-expanded',String(open));if(open&&chatContent&&!chatContent.hidden)chatForm?.elements.message.focus();}
chatLauncher?.addEventListener('click',()=>toggleChat(chatPanel.hidden));chatClose?.addEventListener('click',()=>toggleChat(false));
chatAttachment?.addEventListener('change',()=>{const f=chatAttachment.files[0];chatAttachmentName.textContent=f?`${f.name} · ${(f.size/1024/1024).toFixed(2)} MB`:'Optional · max 10 MB';if(f&&f.size>10*1024*1024){chatAttachment.value='';chatAttachmentName.textContent='Optional · max 10 MB';chatStatus.textContent='Please choose a file smaller than 10 MB.';}});

function addChatMessage(text,kind){const item=document.createElement('div');item.className='chat-message '+kind;item.textContent=text;chatMessages.append(item);chatMessages.scrollTop=chatMessages.scrollHeight;}
function answerFor(message){
  const text=message.toLowerCase();
  if(/\b(hello|hi|hey|good morning|good afternoon)\b/.test(text))return 'Hi! I’m the goadharma assistant. Ask about our services or how to reach our team.';
  if(/\b(price|pricing|cost|quote|budget|estimate)\b/.test(text))return 'Project pricing depends on scope and requirements. Email sales@goadharma.com and the team can discuss a suitable next step.';
  if(/\b(contact|email|reach|phone|speak|talk to|human|person)\b/.test(text))return 'You can reach our team at support@goadharma.com or sales@goadharma.com. Our contact emails are also listed at the bottom of this page.';
  if(/\b(service|services|ai|automation|cloud|software|development|erp|application|quant|migration|consulting|what do you do)\b/.test(text))return 'goadharma provides AI and automation, cloud and software development, ERP implementation and migration, application management, and quantitative solutions. Tell us which area you’re exploring or contact sales@goadharma.com.';
  return 'I don’t have a reliable answer for that yet. I’ve sent your question to the goadharma team for review.';
}
function chatConversationId(){let id=sessionStorage.getItem('et-chat-id');if(!id){id=crypto.randomUUID();sessionStorage.setItem('et-chat-id',id);}return id;}
chatForm?.addEventListener('submit',async event=>{
  event.preventDefault();if(!chatForm.reportValidity())return;
  const messageField=chatForm.elements.message,message=messageField.value.trim(),button=chatForm.querySelector('button[type="submit"]');
  if(!message)return;
  const reply=answerFor(message);addChatMessage(message,'user');messageField.value='';button.disabled=true;chatStatus.textContent='Sending your message…';
  try{
    const data=new FormData(chatForm);data.set('conversationId',chatConversationId());data.set('message',message);data.set('reply',reply);const response=await fetch('/api/chat',{method:'POST',body:data}),result=await response.json().catch(()=>({}));if(!response.ok)throw Error(result.error||'Unable to save this exchange. Please try again.');
    addChatMessage(reply,'bot');chatStatus.textContent='Your message was saved on the server for our team.';chatForm.reset();chatAttachmentName.textContent='Optional · max 10 MB';
  }catch(error){addChatMessage(error.message||'Unable to save this exchange. Please try again.','bot');chatStatus.textContent='Message was not saved.';}
  finally{button.disabled=false;messageField.focus();}
});

const searchToggle=document.querySelector('.search-toggle'),searchPopover=document.querySelector('.search-popover'),searchInput=document.getElementById('siteSearchInput');
searchToggle?.addEventListener('click',()=>{const open=searchPopover.hidden;searchPopover.hidden=!open;searchToggle.setAttribute('aria-expanded',String(open));if(open)searchInput?.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&searchPopover&&!searchPopover.hidden){searchPopover.hidden=true;searchToggle?.setAttribute('aria-expanded','false');searchToggle?.focus();}});
document.querySelectorAll('[data-region-filter]').forEach(button=>button.addEventListener('click',()=>{const region=button.dataset.regionFilter;document.querySelectorAll('[data-region-filter]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));document.querySelectorAll('.country-card').forEach(card=>{card.hidden=region!=='all'&&card.dataset.region!==region;});}));


const accountToggle=document.getElementById('accountMenuToggle'),accountMenu=document.getElementById('accountMenu');
accountToggle?.addEventListener('click',()=>{const open=accountMenu.hidden;accountMenu.hidden=!open;accountToggle.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',event=>{if(accountMenu&&!accountMenu.hidden&&!event.target.closest('.account-menu')){accountMenu.hidden=true;accountToggle?.setAttribute('aria-expanded','false');}});
document.querySelectorAll('[data-auth-action]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{await fetch('/api/auth/logout',{method:'POST'});window.location.assign(button.dataset.redirect||'/careers/sign-in')}catch{button.disabled=false;}}));
const cookieNotice=document.getElementById('cookieNotice'),acceptCookies=document.getElementById('acceptCookies');
try{if(cookieNotice&&localStorage.getItem('et-cookie-consent')!=='accepted')cookieNotice.hidden=false;}catch{if(cookieNotice)cookieNotice.hidden=false;}
acceptCookies?.addEventListener('click',()=>{try{localStorage.setItem('et-cookie-consent','accepted')}catch{}cookieNotice.hidden=true;});

const expertiseCarousel=document.querySelector('[data-carousel]');
if(expertiseCarousel){
  const slides=[...expertiseCarousel.querySelectorAll('.expertise-slide')];
  let current=0,paused=false,timer;
  const showSlide=index=>{
    current=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{const active=i===current;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',String(!active));});
  };
  const startTimer=()=>{clearInterval(timer);if(!paused&&!document.hidden)timer=setInterval(()=>showSlide(current+1),2000);};
  expertiseCarousel.addEventListener('mouseenter',()=>{paused=true;clearInterval(timer);});
  expertiseCarousel.addEventListener('mouseleave',()=>{paused=false;startTimer();});
  expertiseCarousel.addEventListener('focusin',()=>{paused=true;clearInterval(timer);});
  expertiseCarousel.addEventListener('focusout',event=>{if(!expertiseCarousel.contains(event.relatedTarget)){paused=false;startTimer();}});
  document.addEventListener('visibilitychange',startTimer);
  startTimer();
}
