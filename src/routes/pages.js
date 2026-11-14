const router=require('express').Router();
const {isAdminEmail}=require('../lib/admin-emails');
const appVersion=require('../../package.json').version;
router.use((req,res,next)=>{res.locals.googleOAuthClientId=process.env.GOOGLE_OAUTH_CLIENT_ID||'';res.locals.isAdmin=isAdminEmail(req.user?.email);res.locals.appVersion='v'+appVersion;next()});
const countries=[
  {code:'sg',name:'Singapore',region:'Asia',challenge:'Teams often need to move sensitive data across borders while meeting strict privacy, security, and sector requirements.',response:'Map data flows and residency needs first, then design cloud and AI systems with clear access controls, audit trails, and approved hosting locations. Local specialists can coordinate delivery with your security, legal, and compliance advisers.',team:'Singapore-based delivery and client teams'},
  {code:'my',name:'Malaysia',region:'Asia',challenge:'Organizations may be modernizing across multiple sites while navigating local data protection obligations, varied connectivity, and legacy systems.',response:'Plan a phased migration, validate data handling with local advisers, and build for resilient connectivity with offline-friendly workflows, backups, and monitored recovery.',team:'Malaysia-based client and implementation team'},
  {code:'jp',name:'Japan',region:'Asia',challenge:'Legacy platforms, Japanese-language workflows, and high expectations for service continuity can slow technology change.',response:'Pair modernization with the systems already in use, localize interfaces and support, and roll out in measured stages with tested fallbacks and clear operational ownership.',team:'Japan-based delivery and client team'},
  {code:'au',name:'Australia',region:'Oceania',challenge:'Large distances, remote operations, severe weather events, and sector-specific privacy or security rules can disrupt service delivery.',response:'Design for regional hosting and access needs, resilient connectivity, tested disaster recovery, and continuity plans that account for remote sites and weather-related outages.',team:'Australia-based client and delivery team'},
  {code:'nz',name:'New Zealand',region:'Oceania',challenge:'Geographic distance, smaller specialist talent pools, and earthquakes or severe weather can put pressure on infrastructure and support coverage.',response:'Use cloud and managed operations to extend specialist capacity, and prepare for outages with redundant links, backups, recovery exercises, and plans for distributed teams.',team:'New Zealand-based client and delivery team'},
  {code:'us',name:'United States',region:'Americas',challenge:'State-by-state privacy rules, sector regulations, and a fragmented technology landscape can make a single rollout difficult.',response:'Map data and regulatory requirements by jurisdiction, then build modular solutions with configurable controls, clear auditability, and phased regional deployment.',team:'United States-based client and delivery teams'},
  {code:'ch',name:'Switzerland',region:'Europe',challenge:'Multilingual operations and strong expectations for privacy, data protection, and service reliability shape technology decisions.',response:'Design for language and regional needs, document data flows and hosting choices, and validate compliance requirements with qualified local advisers before implementation.',team:'Switzerland-based client and delivery team'}
];
router.get('/',(req,res)=>res.render('pages/home',{title:'GOA DHARMA | From legacy to what is next'}));
const jobs=require('../data/jobs');
router.get('/careers/apply/:jobId',(req,res)=>{const job=jobs.find(item=>item.id===req.params.jobId);if(!job)return res.status(404).render('pages/error',{title:'Job listing not found | goadharma',code:'404'});res.render('pages/application',{title:'Apply: '+job.title+' | goadharma',job});});
router.get('/careers/sign-in',(req,res)=>res.render('pages/sign-in',{title:'Sign in | goadharma',verified:req.query.verified==='1'}));
router.get('/careers/check-email',(req,res)=>res.render('pages/check-email',{title:'Confirm your email | goadharma'}));
router.get('/admin/inbox',(req,res)=>{if(!res.locals.isAdmin)return res.status(403).render('pages/error',{title:'Access denied | goadharma',code:'403'});res.render('pages/admin-inbox',{title:'Admin inbox | goadharma'});});
router.get('/admin/offers',(req,res)=>{if(!res.locals.isAdmin)return res.status(403).render('pages/error',{title:'Access denied | goadharma',code:'403'});res.render('pages/admin-offers',{title:'Offer letters | goadharma'});});
router.get('/admin/compose',(req,res)=>{if(!res.locals.isAdmin)return res.status(403).render('pages/error',{title:'Access denied | goadharma',code:'403'});res.render('pages/admin-compose',{title:'Compose email | goadharma'});});
router.get('/careers',(req,res)=>res.render('pages/careers',{title:'Careers | goadharma',jobs}));
router.get('/locations',(req,res)=>res.render('pages/locations',{title:'Worldwide locations | goadharma',countries}));
router.get('/search',(req,res)=>{
  const query=String(req.query.q||'').trim().slice(0,100);
  const pages=[
    {title:'AI, cloud & software services',description:'Explore AI integration, cloud engineering, software development, ERP, application management, and quantitative solutions.',href:'/#services',keywords:'ai cloud software services erp automation quantitative'},
    {title:'Our approach',description:'A practical path from discovery and planning to delivery and ongoing support.',href:'/#approach',keywords:'approach discovery delivery support'},
    {title:'Careers',description:'Explore opportunities in development, AI, IT support, cloud, network engineering, ERP, and more.',href:'/careers',keywords:'careers jobs resume recruiting developer ai support'},
    {title:'Worldwide locations',description:'Find country pages for Singapore, Malaysia, Japan, Australia, New Zealand, the United States, and Switzerland.',href:'/locations',keywords:'locations worldwide countries singapore malaysia japan australia zealand united states switzerland'}
  ];
  const terms=query.toLowerCase().split(' ').filter(Boolean);
  const results=query?pages.filter(page=>{const text=(page.title+' '+page.description+' '+page.keywords).toLowerCase();return text.includes(query.toLowerCase())||terms.some(term=>text.includes(term));}):[];
  res.render('pages/search',{title:'Search | goadharma',query,results});
});
router.get(['/sg','/my','/jp','/au','/nz','/us','/ch'],(req,res)=>{
  const country=countries.find(item=>item.code===req.path.slice(1));
  res.render('pages/location-country',{title:'goadharma in '+country.name,country});
});
router.get(['/services','/contact'],(req,res)=>res.redirect('/#'+req.path.slice(1)));
module.exports=router;
