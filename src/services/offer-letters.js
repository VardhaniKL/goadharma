const fs=require('node:fs/promises');
const path=require('node:path');
const PDFDocument=require('pdfkit');
const storage=require('../lib/local-storage');

const singaporeSources=[
  {title:'MOM Key Employment Terms',url:'https://www.mom.gov.sg/employment-practices/contract-of-service/key-employment-terms'},
  {title:'MOM Hours of work, overtime and rest days',url:'https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days'},
  {title:'MOM Annual leave eligibility and entitlement',url:'https://www.mom.gov.sg/employment-practices/leave/annual-leave/eligibility-and-entitlement'},
  {title:'MOM Sick leave eligibility and entitlement',url:'https://www.mom.gov.sg/employment-practices/leave/sick-leave/eligibility-and-entitlement'},
  {title:'MOM Paying salary',url:'https://www.mom.gov.sg/employment-practices/salary/paying-salary'}
];
const fields={offerDate:'Offer date',position:'Position name',joiningDate:'Date of joining',salary:'Monthly salary',country:'Country of offer',hrName:'Head of Human Resources',candidate:'Candidate name',address:'Candidate address',officeAddress:'Office address',duties:'Duties',probation:'Probation period',workingHours:'Working hours and break',payday:'Salary payment timing',annualLeave:'Annual leave',sickLeave:'Sick leave',notice:'Notice period',benefits:'Benefits',outsideWork:'Other work',tax:'Tax',additionalTerms:'Additional terms'};
const max={offerDate:20,position:120,joiningDate:20,salary:80,country:80,hrName:120,candidate:120,address:800,officeAddress:300,duties:1600,probation:240,workingHours:600,payday:240,annualLeave:600,sickLeave:600,notice:400,benefits:800,outsideWork:800,tax:400,additionalTerms:2000};
function clean(value,limit){return String(value??'').trim().replace(/\r/g,'').slice(0,limit)}
function normalize(input){const data={};for(const key of Object.keys(fields))data[key]=clean(input?.[key],max[key]);const required=['offerDate','position','joiningDate','salary','country','hrName','candidate','address','officeAddress'];for(const key of required)if(!data[key])throw Object.assign(new Error(fields[key]+' is required.'),{status:400});for(const key of ['offerDate','joiningDate'])if(!/^\d{4}-\d{2}-\d{2}$/.test(data[key])||Number.isNaN(Date.parse(data[key])))throw Object.assign(new Error('Enter valid offer and joining dates.'),{status:400});return data}
function fmtDate(value){const d=new Date(value+'T12:00:00Z');return new Intl.DateTimeFormat('en-SG',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(d)}
function formatSalary(value){const amount=String(value||'').trim().replace(/^(?:S\s*\$|SGD\s*\$?|SGD)\s*/i,'').replace(/,/g,'');const formatted=/^\d+(?:\.\d{1,2})?$/.test(amount)?Number(amount).toLocaleString('en-SG',{maximumFractionDigits:2}):amount;return 'SGD '+formatted}
function singleFinalPeriod(value){return String(value||'').trim().replace(/[.!?]+$/,'')+'.'}
function paragraph(doc,sectionNumber,heading,clauses,bodyStart){
  const x=doc.page.margins.left,width=doc.page.width-doc.page.margins.left-doc.page.margins.right;
  const bottomLimit=doc.page.height-doc.page.margins.bottom-24;
  function reserve(height){if(doc.y+height>bottomLimit){doc.addPage();doc.x=x;doc.y=bodyStart}}
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#25283a');
  const headingHeight=doc.heightOfString(heading,{width,font:'Helvetica-Bold',fontSize:10.5});
  const plainClause=clause=>Array.isArray(clause)?clause.map(part=>part.text).join(''):clause;
  const clauseHeights=clauses.map(clause=>doc.heightOfString(plainClause(clause),{width:width-30,font:'Helvetica',fontSize:9.5,lineGap:3}));
  const sectionHeight=headingHeight+14+clauseHeights.reduce((total,height)=>total+height+6,0);
  if(doc.y+sectionHeight>bottomLimit){doc.addPage({size:'A4',margins:{top:132,bottom:44,left:55,right:55}});doc.x=x;doc.y=bodyStart;}
  reserve(headingHeight+14);
  let y=doc.y;doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#25283a').text(heading,{x,y,width,continued:false});doc.y=y+headingHeight+7;
  const numberWidth=30,textX=x+numberWidth,textWidth=width-numberWidth;
  clauses.forEach((clause,index)=>{
    doc.font('Helvetica').fontSize(9.5).fillColor('#3d4352');
    const h=doc.heightOfString(plainClause(clause),{width:textWidth,font:'Helvetica',fontSize:9.5,lineGap:3});reserve(h+7);y=doc.y;
    doc.text(sectionNumber+'.'+(index+1),x+4,y,{width:numberWidth-6,lineGap:3});
    if(Array.isArray(clause)){clause.forEach((part,partIndex)=>{doc.font(part.bold?'Helvetica-Bold':'Helvetica').fontSize(9.5).fillColor('#3d4352');const continued=partIndex<clause.length-1;if(partIndex===0)doc.text(part.text,textX,y,{width:textWidth,lineGap:3,continued});else doc.text(part.text,{lineGap:3,continued})})}else doc.text(clause,textX,y,{width:textWidth,lineGap:3});
    doc.y=y+h+6;doc.x=x;
  });
  doc.moveDown(.35);
}
function buildSections(data){return [
  {heading:'1. DATE OF COMMENCEMENT',clauses:[
    [{text:'Your date of joining is '},{text:fmtDate(data.joiningDate),bold:true},{text:'. Any required work authorisation or visa must be obtained before you begin work.'}],
    'Your probation period will be '+singleFinalPeriod(data.probation||'as agreed in writing')+(/confirm/i.test(data.probation||'')?'':' Confirmation will be based on your performance and communicated to you in writing.'),
    ...(data.country.toLowerCase()==='singapore'?['If you are not based in Singapore and travel from outside Singapore to commence work, goadharma will reimburse you once for one-way airfare or bus/coach travel. You must use the most economical available mode of travel.']:[])
  ]},
  {heading:'2. SALARY',clauses:[
    [{text:'Your basic monthly salary will be '},{text:formatSalary(data.salary),bold:true},{text:'. Any additional allowances or benefits will be provided only where expressly stated in this letter or separately agreed in writing.'}],
    data.tax||'You are responsible for personal income tax under the applicable laws.',
    'No other allowances are included unless agreed in writing.',
    'Your monthly salary shall be paid on the last working day of each calendar month.',
    'Approved business travel and work-related expenses will be reimbursed under Company policy.'
  ]},
  {heading:'3. DUTIES',clauses:[
    'You must carry out the responsibilities of your position with due care and follow reasonable, lawful instructions from your manager.',
    data.duties||'Your specific responsibilities and deliverables will be set out by your manager and may be updated to meet the Company’s operational needs, provided they remain consistent with your role.',
    'Timesheets are due by the second (2nd) working day of each calendar month. You are responsible for making every effort to have each timesheet approved, signed off, and sent to goadharma on time.'
  ]},
  {heading:'4. OTHER WORK',clauses:[
    'This is a full-time position. You are expected to devote your working time to the Company.',
    data.outsideWork||'Obtain written approval before taking up other paid work or an advisory role that may conflict with your duties or the Company’s interests.'
  ]},
  {heading:'5. WORKING HOURS',clauses:[
    'Your ordinary working arrangements are: '+singleFinalPeriod(data.workingHours||'as agreed with the Company in writing'),
    'Overtime work, where applicable, will be subject to prior approval by the Company and compensated in accordance with the applicable provisions of the Singapore Employment Act.'
  ]},
  {heading:'6. ANNUAL LEAVE',clauses:[
    data.annualLeave||'Paid annual leave and public holidays will be provided in accordance with applicable law and Company policy.',
    'Leave requests and any unpaid leave are subject to the applicable law and the Company’s leave procedures.'
  ]},
  {heading:'7. SICK LEAVE',clauses:[
    'Notify the Company or your manager as soon as practicable if illness prevents you from working.',
    data.sickLeave||'Paid sick leave will be provided in accordance with applicable law and required medical certification.'
  ]},
  {heading:'8. TERMINATION AND NOTICE',clauses:[
    'Either party may terminate employment by giving '+String(data.notice||'the notice period agreed in writing').replace(/[.!?]+$/,'')+'. Salary in lieu may be paid where permitted by law.',
    'The Company may take disciplinary action, including termination, for misconduct or a material breach, following applicable law.',
    'On termination, you must return Company and client property and support an orderly handover.'
  ]},
  {heading:'9. CONFIDENTIALITY',clauses:[
    'You must not disclose confidential Company or client information except as authorised or required by law.',
    'Confidential information includes non-public trade, business, financial, client, personnel and technical information.',
    'These obligations continue after employment for as long as the information remains confidential.',
    'You must not copy, retain or destroy Company confidential information without written authorisation.'
  ]},
  {heading:'10. BENEFITS',clauses:[
    data.benefits||'Medical and other benefits, if any, will be provided as described in the applicable Company policy.',
    'Benefit eligibility, coverage and administration are subject to the applicable plan terms and Company policy.'
  ]},
  {heading:'11. GOVERNING LAW',clauses:[
    'This letter and your employment are subject to the applicable employment laws of '+data.country+'.',
    'Any contractual term that provides less than a mandatory legal entitlement is subject to that entitlement.'
  ]},
  ...(data.additionalTerms?[{heading:'12. ADDITIONAL TERMS',clauses:data.additionalTerms.split(/\n+/).map(value=>value.trim()).filter(Boolean)}]:[])
]}
const brandBlue='#502DFC';
function wrapOfficeAddress(value,limit=40){const words=String(value||'').replace(/[\r\n]+/g,' ').trim().split(/\s+/).filter(Boolean),lines=[];let line='';for(let word of words){while(word.length>limit){const piece=word.slice(0,limit);if(line){lines.push(line);line=''}lines.push(piece);word=word.slice(limit)}if(!word)continue;if(!line)line=word;else if((line+' '+word).length<=limit)line+=' '+word;else{lines.push(line);line=word}}if(line)lines.push(line);return lines.join('\n')}
function drawPin(doc,x,y,color){doc.save().strokeOpacity(.25).strokeColor(color).lineWidth(.9).moveTo(x,y+11).bezierCurveTo(x-2.2,y+8,x-5,y+5.5,x-5,y+3.4).bezierCurveTo(x-5,-2.5+y,x+5,-2.5+y,x+5,y+3.4).bezierCurveTo(x+5,y+5.5,x+2.2,y+8,x,y+11).stroke();doc.circle(x,y+3.2,1.5).stroke();doc.restore()}
function drawGlobe(doc,x,y,color){doc.save().strokeOpacity(.25).strokeColor(color).lineWidth(.8).circle(x,y+5,5).stroke().ellipse(x,y+5,2.4,5).stroke().moveTo(x-4.7,y+5).lineTo(x+4.7,y+5).stroke().restore()}
function createPdf(data,id,createdAt,version){
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margins:{top:132,bottom:44,left:55,right:55},bufferPages:true,info:{Title:'Offer Letter - '+data.candidate,Author:'goadharma',Subject:'Offer letter '+id+' - Version '+version}}),chunks=[];
    doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    const w=doc.page.width,left=55,right=w-55,contentWidth=right-left,ruleX=27,headerRight=320,headerWidth=right-headerRight,headerTextWidth=headerWidth-15,officeText=wrapOfficeAddress(data.officeAddress,40),addressY=29;
    doc.font('Helvetica').fontSize(8.5);const addressHeight=doc.heightOfString(officeText,{width:headerTextWidth,font:'Helvetica',fontSize:8.5,lineGap:2}),urlY=addressY+addressHeight+7,dividerY=Math.max(112,urlY+15),bodyStart=dividerY+17,iconX=right-2;
    const watermarkPath=path.join(__dirname,'..','..','public','images','goadharma-lockup.png');
    function drawWatermark(){doc.save().opacity(.065).image(watermarkPath,(w-450)/2,(doc.page.height-132)/2,{width:450}).restore()}
    function drawPageChrome(){
      const footerStripeY=doc.page.height-44,footerLogoY=footerStripeY+6;
      doc.save();doc.strokeOpacity(.25).fillOpacity(.25).strokeColor(brandBlue).lineWidth(1.1).moveTo(ruleX,0).lineTo(ruleX,footerStripeY).stroke();doc.rect(0,footerStripeY,doc.page.width,5).fill(brandBlue);doc.restore();
      doc.image(path.join(__dirname,'..','..','public','images','offer-footer-logos.png'),(w-185)/2,footerLogoY,{fit:[185,39],align:'center',valign:'center'});
      doc.image(path.join(__dirname,'..','..','public','images','goadharma-lockup.png'),43,30,{width:205});
      doc.font('Helvetica').fontSize(8.5).fillColor('#4c5260').text(officeText,headerRight,addressY,{width:headerTextWidth,align:'right',lineGap:2});
      doc.font('Helvetica').fontSize(9.5).fillColor('#1454a5').text('https://goadharma.com',headerRight,urlY,{width:headerTextWidth,align:'right',link:'https://goadharma.com',underline:true});
      drawPin(doc,iconX,addressY+Math.max(0,(addressHeight-10)/2),brandBlue);drawGlobe(doc,iconX,urlY+1,brandBlue);
      doc.save().strokeOpacity(.25).strokeColor(brandBlue).lineWidth(1.1).moveTo(0,dividerY).lineTo(right-10,dividerY).stroke().restore();
      doc.x=left;doc.y=bodyStart;
    }
    doc.on('pageAdded',()=>{drawWatermark();drawPageChrome();doc.font('Helvetica').fontSize(9.5).fillColor('#303443')});drawWatermark();drawPageChrome();
    const titleY=bodyStart+2;doc.font('Helvetica-Bold').fontSize(15).fillColor('#25283a').text('LETTER OF APPOINTMENT',left,titleY,{width:contentWidth,align:'center',characterSpacing:.7});
    const detailsY=titleY+36,dateX=left+48,toY=detailsY+35,toValueX=left+48;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#303443').text('Date:',left,detailsY,{width:42});doc.font('Helvetica').fontSize(9.5).text(fmtDate(data.offerDate),dateX,detailsY,{width:200});
    doc.font('Helvetica-Bold').fontSize(9.5).text('To:',left,toY,{width:42});doc.font('Helvetica-Bold').fontSize(10).text(data.candidate,toValueX,toY,{width:contentWidth-48});
    const candidateAddressY=toY+14,candidateAddressWidth=contentWidth-48;doc.font('Helvetica').fontSize(9.5).fillColor('#303443').text(data.address,toValueX,candidateAddressY,{width:candidateAddressWidth,lineGap:2});
    const bodyY=Math.max(candidateAddressY+doc.heightOfString(data.address,{width:candidateAddressWidth,font:'Helvetica',fontSize:9.5,lineGap:2})+22,toY+44);
    doc.x=left;doc.y=bodyY;doc.font('Helvetica').fontSize(9.5).fillColor('#303443').text('Dear '+data.candidate+',',{width:contentWidth});doc.moveDown(.65);
    doc.x=left;doc.font('Helvetica').fontSize(9.5).fillColor('#303443').text('We are pleased to offer you the position of “',{width:contentWidth,lineGap:3,continued:true});doc.font('Helvetica-Bold').fontSize(9.5).text(data.position,{continued:true});doc.font('Helvetica').fontSize(9.5).fillColor('#303443').text('” upon the following terms and conditions:',{width:contentWidth,lineGap:3});doc.moveDown(1.1);
    doc.x=left;buildSections(data).forEach((section,index)=>paragraph(doc,index+1,section.heading,section.clauses,bodyStart));
    const signatureGap=120,signatureHeight=100,bottomLimit=doc.page.height-doc.page.margins.bottom;if(doc.y+signatureGap+signatureHeight>bottomLimit)doc.addPage({size:'A4',margins:{top:132,bottom:44,left:55,right:55}});doc.x=left;const signY=doc.y+signatureGap;
    doc.font('Helvetica').fontSize(9.5).fillColor('#303443').text('For goadharma',left,signY,{width:230});doc.font('Helvetica').fontSize(9.5).text('Agreed and Accepted',370,signY,{width:165});
    const artY=signY+15;doc.image(path.join(__dirname,'..','..','public','images','offer-signature.png'),left,artY,{fit:[98,68],align:'left',valign:'top'});doc.image(path.join(__dirname,'..','..','public','images','offer-seal.png'),left+105,artY-4,{width:82,height:82});
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#303443').text(data.hrName,left,artY+71,{width:210});doc.font('Helvetica').fontSize(9).text('Head of Human Resources',left,artY+85,{width:230});
    doc.font('Helvetica').fontSize(10).fillColor('#303443').text(data.candidate,370,artY+27,{width:165});doc.font('Helvetica').fontSize(9).text('Date:',370,artY+52,{width:165});
    const pages=doc.bufferedPageRange();for(let i=pages.start;i<pages.start+pages.count;i++){doc.switchToPage(i);drawPageChrome()}
    doc.end();
  });
}
async function readOfferRecords(folder){let files=[];try{files=await fs.readdir(folder)}catch(e){if(e.code==='ENOENT')return[];throw e}const records=[];for(const filename of files.filter(name=>/^[a-f0-9]{64}\.json$/.test(name))){try{const record=JSON.parse(await fs.readFile(path.join(folder,filename),'utf8'));if(record.id===filename.slice(0,-5))records.push({...record,groupId:record.groupId||record.id,version:Number(record.version)||1})}catch(e){console.error('Offer record could not be read '+filename+':',e.message)}}return records}
async function getRecord(id){if(!/^[a-f0-9]{64}$/.test(String(id||'')))throw Object.assign(new Error('Select a valid offer version.'),{status:400});const folder=path.join(storage.root,'Offers');try{const record=JSON.parse(await fs.readFile(path.join(folder,id+'.json'),'utf8'));if(record.id!==id)throw Error('Offer ID mismatch.');return {...record,groupId:record.groupId||record.id,version:Number(record.version)||1}}catch(e){if(e.code==='ENOENT')throw Object.assign(new Error('Offer version not found.'),{status:404});throw e}}
async function generate(input,admin,baseVersionId){
  const data=normalize(input),folder=await storage.ensureFolder('Offers'),createdAt=new Date().toISOString(),records=await readOfferRecords(folder);
  let base=null,groupId,version=1;
  if(baseVersionId){
    base=await getRecord(baseVersionId);groupId=base.groupId;
    const family=records.filter(record=>record.groupId===groupId),seriesPath=path.join(folder,groupId+'.series.json');let seriesNext=1;
    try{seriesNext=Number(JSON.parse(await fs.readFile(seriesPath,'utf8')).nextVersion)||1}catch(e){if(e.code!=='ENOENT')throw e}
    version=Math.max(1,...family.map(record=>record.version+1),seriesNext);
  }
  const id=require('node:crypto').createHash('sha256').update(JSON.stringify({data,createdAt,nonce:require('node:crypto').randomBytes(16).toString('hex')})).digest('hex');if(!groupId)groupId=id;
  const pdf=await createPdf(data,id,createdAt,version),pdfFile=id+'.pdf',jsonFile=id+'.json';await fs.writeFile(path.join(folder,pdfFile),pdf,{flag:'wx',mode:0o600});
  const record={id,groupId,version,baseVersionId:base?.id||null,createdAt,candidate:data.candidate,country:data.country,position:data.position,inputs:data,pdfFile,jsonFile,pdfSha256:require('node:crypto').createHash('sha256').update(pdf).digest('hex'),generatedBy:admin?.email||admin?.username||'Admin',legalReview:data.country.toLowerCase()==='singapore'?'Singapore MOM references are recorded; confirm coverage and role-specific statutory terms before issue.':'Review the offer against current government employment rules in '+data.country+' before issue.',governmentSources:data.country.toLowerCase()==='singapore'?singaporeSources:[],content:{heading:'LETTER OF APPOINTMENT',version,letterhead:{brand:'goadharma',officeAddress:data.officeAddress,website:'www.earlytraction.com'},offerDate:fmtDate(data.offerDate),recipient:{name:data.candidate,address:data.address},greeting:'Dear '+data.candidate+',',introduction:'We are pleased to offer you the position of “'+data.position+'” upon the following terms and conditions.',sections:buildSections(data),signatories:{company:'goadharma',humanResources:data.hrName,candidate:data.candidate}}};
  await fs.writeFile(path.join(folder,jsonFile),JSON.stringify(record,null,2),{flag:'wx',mode:0o600});await fs.writeFile(path.join(folder,groupId+'.series.json'),JSON.stringify({groupId,nextVersion:version+1,lastId:id,updatedAt:createdAt},null,2),{mode:0o600});return record;
}
async function removeVersion(id){const record=await getRecord(id),folder=path.join(storage.root,'Offers');for(const extension of ['pdf','json']){try{await fs.unlink(path.join(folder,id+'.'+extension))}catch(e){if(e.code!=='ENOENT')throw e}}return {id:record.id,groupId:record.groupId,version:record.version}}
module.exports={fields,generate,getRecord,readOfferRecords,removeVersion};
