const { createHash, randomInt } = require('node:crypto');

const locations = [
  { city: 'Singapore', country: 'Singapore' }, { city: 'Kuala Lumpur', country: 'Malaysia' },
  { city: 'Tokyo', country: 'Japan' }, { city: 'Sydney', country: 'Australia' },
  { city: 'Auckland', country: 'New Zealand' }, { city: 'Zurich', country: 'Switzerland' },
  { city: 'New York', country: 'United States' }
];

const families = [
{department:'Software Engineering',field:'software product delivery',summary:'Build and improve digital products for clients and internal teams, with a focus on {focus}.',mustHave:'A portfolio, project examples, or equivalent evidence of hands-on delivery.',roles:[
['Senior Full-Stack Software Engineer','Senior','5+ years','end-to-end web application delivery','TypeScript, Node.js, React, APIs, and relational databases'],
['Frontend Engineer','Mid-Level','3+ years','responsive and accessible user interfaces','React or Vue, modern CSS, browser testing, and accessibility'],
['Backend API Engineer','Mid-Senior','4+ years','reliable services and integration APIs','Node.js, Java, or Python, REST APIs, SQL, and service testing'],
['Mobile Application Developer','Mid-Level','3+ years','mobile products for iOS and Android','React Native, Flutter, Swift, Kotlin, or equivalent mobile tools'],
['Software Quality Automation Engineer','Mid-Level','3+ years','automated testing and release confidence','Playwright, Cypress, API testing, CI pipelines, and test design']]},
{department:'Quality Assurance & Software Testing',field:'quality assurance and software testing',summary:'Improve software quality and release confidence through {focus}.',mustHave:'Strong test design, clear defect reporting, and effective collaboration with software engineers and product teams.',roles:[
['Senior QA Automation Engineer','Senior','5+ years','automation strategy and test frameworks for web and API products','Selenium WebDriver with Java or Python, Playwright with TypeScript, CI/CD, API testing, and test framework design'],
['Playwright Automation Engineer','Mid-Senior','4+ years','reliable end-to-end browser automation with Playwright','Playwright, TypeScript or JavaScript, API testing, test fixtures, and CI pipelines'],
['Selenium Test Automation Engineer','Mid-Level','3+ years','automated UI and regression testing with Selenium WebDriver','Selenium WebDriver, Java or Python, TestNG or Pytest, SQL, and API testing'],
['QA Engineer — Functional & API Testing','Mid-Level','3+ years','functional, integration, and API testing for business applications','Test planning, API testing, Postman, SQL, Java or Python scripting, and Playwright or Selenium']]},
{department:'AI & Transformation',field:'AI, data, or business transformation',summary:'Help organizations apply emerging technology responsibly, with a focus on {focus}.',mustHave:'Good judgment around data privacy, responsible AI, and practical business value.',roles:[
['AI Solutions Consultant','Mid-Senior','4+ years','AI opportunity discovery and client roadmaps','AI use cases, cloud AI services, APIs, and workshop facilitation'],
['Machine Learning Engineer','Mid-Senior','4+ years','production machine learning workflows','Python, model evaluation, feature pipelines, and ML operations'],
['LLM Application Developer','Mid-Level','3+ years','secure language model applications','LLM APIs, retrieval patterns, prompt evaluation, and application development'],
['Intelligent Automation Analyst','Mid-Level','3+ years','workflow automation and process improvement','Process mapping, RPA, APIs, low-code tools, and requirements analysis'],
['Responsible AI & Governance Specialist','Senior','5+ years','AI risk, governance, and adoption frameworks','AI governance, privacy, model risk, controls, and stakeholder facilitation']]},
{department:'Cloud & DevOps',field:'cloud infrastructure and platform operations',summary:'Make technology platforms secure, resilient, and easier to operate, focusing on {focus}.',mustHave:'A security-first mindset and calm, structured incident handling.',roles:[
['Cloud Platform Engineer','Mid-Senior','4+ years','cloud foundations and platform services','AWS, Azure, or GCP, Terraform, containers, and networking'],
['DevOps Engineer','Mid-Level','3+ years','automated build and deployment pipelines','CI/CD, Git, containers, scripting, and infrastructure-as-code'],
['Site Reliability Engineer','Senior','5+ years','service reliability and observability','SLOs, monitoring, incident response, Linux, and automation'],
['Network Infrastructure Engineer','Mid-Senior','4+ years','secure enterprise network operations','Routing, switching, VPNs, firewalls, and network monitoring'],
['Systems Administrator','Mid-Level','3+ years','reliable server and identity services','Windows or Linux administration, identity, backups, and endpoint tools']]},
{department:'Enterprise Applications',field:'enterprise systems implementation and support',summary:'Connect business processes with dependable enterprise platforms, focusing on {focus}.',mustHave:'Strong requirements discovery and clear communication with business users.',roles:[
['ERP Functional Consultant','Mid-Senior','5+ years','ERP configuration for core business processes','ERP implementation, finance or operations processes, and testing'],
['ERP Migration Lead','Senior','6+ years','ERP migration planning and cutover','Data migration, ERP delivery, reconciliation, and change control'],
['CRM Solutions Consultant','Mid-Level','4+ years','customer relationship management workflows','CRM platforms, sales processes, configuration, and integrations'],
['Business Systems Analyst','Mid-Level','3+ years','business requirements and systems analysis','Process mapping, user stories, acceptance criteria, and data analysis'],
['Application Configuration Specialist','Early-Mid','2+ years','application setup and controlled releases','Enterprise application configuration, access controls, and documentation']]},
{department:'Data & Analytics',field:'data engineering, analysis, or business intelligence',summary:'Help teams use trusted data to make better decisions, focusing on {focus}.',mustHave:'Strong analytical thinking and care for data quality and responsible access.',roles:[
['Data Engineer','Mid-Senior','4+ years','reliable data pipelines and platforms','SQL, Python, ETL, cloud data platforms, and orchestration'],
['Business Intelligence Developer','Mid-Level','3+ years','useful dashboards and semantic models','Power BI, Tableau, SQL, data modeling, and stakeholder discovery'],
['Data Analyst','Early-Mid','2+ years','business analysis and performance reporting','SQL, spreadsheets, data visualization, and clear written insights'],
['Data Scientist','Mid-Senior','4+ years','statistical analysis and predictive modeling','Python, statistics, experimentation, and model evaluation'],
['Data Governance Specialist','Mid-Senior','4+ years','data definitions, ownership, and governance','Metadata, data quality, lineage, policies, and stakeholder coordination']]},
{department:'Security & Risk',field:'cybersecurity, risk, or information assurance',summary:'Protect people, systems, and information by strengthening {focus}.',mustHave:'Discretion, curiosity, and a practical approach to reducing risk.',roles:[
['Cybersecurity Analyst','Mid-Level','3+ years','security reviews and remediation planning','Vulnerability management, cloud security, identity, and incident response'],
['Security Operations Center Analyst','Early-Mid','2+ years','security event monitoring and triage','SIEM tools, alert investigation, endpoint security, and incident procedures'],
['Cloud Security Engineer','Mid-Senior','4+ years','cloud security architecture and controls','Cloud IAM, network security, infrastructure-as-code, and threat modeling'],
['Governance Risk & Compliance Consultant','Mid-Senior','4+ years','security governance and audit readiness','Risk registers, control frameworks, audits, policies, and client advisory'],
['Privacy & Information Governance Specialist','Mid-Senior','4+ years','privacy operations and information lifecycle controls','Data protection, records management, access controls, and policy writing']]},
{department:'Service Operations',field:'IT service management or end-user support',summary:'Keep business technology useful and dependable through {focus}.',mustHave:'A service-oriented approach, clear documentation, and thoughtful prioritization.',roles:[
['Application Support Specialist','Mid-Level','2+ years','business application support and issue resolution','Ticketing systems, SQL basics, troubleshooting, and service management'],
['Service Desk Analyst','Early-Mid','1+ years','responsive employee technology support','Windows or macOS, identity tools, ticket queues, and customer service'],
['IT Service Management Analyst','Mid-Level','3+ years','service processes and continual improvement','ITIL practices, service metrics, workflows, and knowledge management'],
['Incident & Problem Manager','Mid-Senior','4+ years','major incident coordination and root cause improvement','Incident command, problem management, facilitation, and reporting'],
['Endpoint & Workplace Technology Specialist','Mid-Level','3+ years','secure device and collaboration services','Endpoint management, identity, collaboration tools, and device compliance']]},
{department:'Quant & Financial Systems',field:'quantitative technology or financial systems',summary:'Support robust analytical and financial platforms with a focus on {focus}.',mustHave:'Careful validation, attention to detail, and comfort with sensitive data.',roles:[
['Quantitative Solutions Engineer','Mid-Senior','4+ years','quantitative software and analytics workflows','Python, C++ or Java, numerical methods, tests, and data pipelines'],
['Quantitative Developer','Senior','5+ years','low-latency analytical and trading components','C++, Python, algorithms, performance profiling, and market data'],
['Trading Systems Engineer','Mid-Senior','4+ years','financial market connectivity and trading operations','Trading platforms, APIs, real-time systems, and production support'],
['Financial Risk Analyst','Mid-Level','3+ years','risk reporting and analytical controls','Financial modeling, spreadsheets, SQL, scenario analysis, and documentation'],
['Financial Technology Business Analyst','Mid-Level','3+ years','requirements for financial technology products','Financial services workflows, requirements, integrations, and testing']]},
{department:'Project Delivery',field:'technology project delivery and change',summary:'Help teams deliver useful change through {focus}.',mustHave:'Strong facilitation, planning, and stakeholder communication.',roles:[
['IT Project Manager','Mid-Senior','5+ years','technology delivery plans and governance','Project planning, budgets, dependencies, risk, and stakeholder reporting'],
['Technical Business Analyst','Mid-Level','3+ years','clear requirements between users and engineers','Process analysis, SQL basics, user stories, APIs, and acceptance testing'],
['Scrum Master','Mid-Level','3+ years','healthy agile delivery and team improvement','Scrum, facilitation, impediment removal, and continuous improvement'],
['Technology Program Coordinator','Early-Mid','2+ years','cross-project coordination and reporting','Project schedules, meeting facilitation, status tracking, and documentation'],
['Organizational Change Consultant','Mid-Senior','4+ years','adoption planning for technology change','Change impact assessment, communications, training, and readiness planning']]},
{department:'Sales & Partnerships',field:'technology sales and commercial relationships',summary:'Create strong client relationships and sustainable growth through {focus}.',mustHave:'Professional communication, ethical selling, and reliable follow-through.',roles:[
['Technical Sales Executive','Mid-Senior','3+ years','consultative technology sales','B2B sales, discovery, proposals, CRM, and relationship management'],
['Technology Account Executive','Mid-Senior','4+ years','new business development and account growth','Enterprise sales, pipeline management, negotiation, and forecasting'],
['Client Relationship Manager','Mid-Level','4+ years','trusted client engagement and account planning','Account management, service reviews, issue resolution, and communication'],
['Strategic Partnerships Manager','Mid-Senior','5+ years','partner programs and ecosystem development','Partnership strategy, commercial negotiation, joint planning, and reporting'],
['Sales Operations Analyst','Mid-Level','3+ years','sales process, data, and forecast quality','CRM reporting, spreadsheets, pipeline analysis, and process improvement']]},
{department:'Marketing & Communications',field:'digital marketing, content, or communications',summary:'Make the company easier to discover and understand through {focus}.',mustHave:'Strong writing, audience awareness, and evidence-led campaign decisions.',roles:[
['Digital Marketing Specialist','Mid-Level','3+ years','campaign execution and channel performance','SEO, email, analytics, paid channels, and marketing automation'],
['Content Strategist','Mid-Senior','4+ years','useful content planning and editorial quality','Editorial planning, interviews, SEO writing, and brand voice'],
['Search & SEO Specialist','Mid-Level','3+ years','organic discovery and technical search quality','Keyword research, technical SEO, analytics, and content optimization'],
['Marketing Communications Manager','Mid-Senior','5+ years','consistent brand and corporate communications','Editorial planning, communications strategy, stakeholder review, and metrics'],
['Demand Generation Manager','Mid-Senior','5+ years','measurable pipeline and campaign programs','B2B campaigns, marketing automation, funnel analytics, and experimentation']]},
{department:'People & Culture',field:'recruiting, human resources, or people operations',summary:'Build a welcoming and effective employee experience through {focus}.',mustHave:'Trust, empathy, discretion, and care with personal information.',roles:[
['Talent Acquisition Partner','Mid-Senior','4+ years','full-cycle recruiting for varied roles','Interview design, sourcing, candidate experience, and hiring manager partnership'],
['People Operations Coordinator','Early-Mid','2+ years','employee lifecycle administration and support','HR systems, onboarding, records, employee queries, and process coordination'],
['HR Generalist','Mid-Level','4+ years','day-to-day people support and policy application','Employee relations, HR operations, documentation, and local employment practices'],
['Learning & Development Specialist','Mid-Level','3+ years','employee learning programs and capability building','Learning design, facilitation, needs analysis, and program evaluation'],
['Payroll & Benefits Coordinator','Mid-Level','3+ years','accurate payroll and benefits administration','Payroll cycles, benefits records, reconciliation, and confidential data handling']]},
{department:'Finance & Operations',field:'accounting, financial planning, or business operations',summary:'Support sound decisions and smooth operations through {focus}.',mustHave:'Accuracy, ownership, and sound judgment when handling business information.',roles:[
['Finance & Operations Administrator','Early-Mid','2+ years','finance administration and operational coordination','Invoices, expenses, reconciliations, spreadsheets, and vendor communication'],
['Financial Accountant','Mid-Level','4+ years','accurate accounting and period close','Accounting standards, reconciliations, journals, reporting, and audit support'],
['Financial Planning & Analysis Analyst','Mid-Level','3+ years','budgets, forecasts, and management insight','Financial modeling, Excel, variance analysis, and clear presentations'],
['Accounts Payable Specialist','Early-Mid','2+ years','supplier invoice and payment operations','Invoice processing, purchase orders, reconciliations, and finance systems'],
['Business Operations Analyst','Mid-Level','3+ years','operational performance and process improvement','Process analysis, spreadsheets, dashboards, and cross-team coordination']]},
{department:'Administration',field:'administration and workplace operations',summary:'Help colleagues do their best work by coordinating {focus}.',mustHave:'Excellent organization, tact, and dependable attention to detail.',roles:[
['Executive Assistant','Mid-Level','3+ years','executive scheduling and decision support','Calendar management, meeting preparation, travel, and confidential correspondence'],
['Office Manager','Mid-Level','3+ years','welcoming, safe, and efficient office operations','Facilities coordination, suppliers, budgets, events, and workplace services'],
['Reception & Workplace Coordinator','Early-Mid','1+ years','front desk and visitor experience','Reception, visitor coordination, workplace systems, and customer service'],
['Travel & Events Coordinator','Mid-Level','2+ years','business travel and internal event delivery','Travel booking, event logistics, supplier coordination, and expense tracking'],
['Document Control Administrator','Early-Mid','2+ years','accurate records and controlled business documentation','Document registers, version control, filing systems, and quality checks']]},
{department:'Customer Success',field:'client service and technology adoption',summary:'Help clients get lasting value from technology through {focus}.',mustHave:'Empathy, clear communication, and confidence coordinating across teams.',roles:[
['Customer Success Manager','Mid-Senior','4+ years','client outcomes and long-term partnerships','Account plans, service reviews, issue coordination, and outcome tracking'],
['Client Onboarding Specialist','Mid-Level','3+ years','smooth client onboarding and service transition','Onboarding plans, requirements, documentation, and training coordination'],
['Customer Support Lead','Mid-Senior','4+ years','responsive support operations and service quality','Support workflows, escalation management, coaching, and service metrics'],
['Service Delivery Manager','Senior','5+ years','consistent service performance and client governance','Service-level reporting, operational reviews, risk management, and leadership'],
['Customer Training Specialist','Mid-Level','3+ years','clear training for business technology users','Training design, product demonstrations, facilitation, and learning evaluation']]},
{department:'Procurement & Commercial Operations',field:'procurement, contracts, or vendor management',summary:'Help teams buy well and manage commercial relationships through {focus}.',mustHave:'Integrity, analytical skills, and care with contractual information.',roles:[
['Procurement & Vendor Analyst','Mid-Level','3+ years','supplier assessment and vendor performance','Supplier due diligence, quote analysis, purchase orders, and reporting'],
['Strategic Sourcing Specialist','Mid-Senior','4+ years','structured sourcing and supplier selection','Sourcing events, negotiation, market research, and category planning'],
['Contracts Administrator','Mid-Level','3+ years','contract records, reviews, and renewal workflows','Contract lifecycle tools, document control, terms tracking, and coordination'],
['Vendor Relationship Manager','Mid-Senior','5+ years','supplier relationships and service governance','Vendor scorecards, service reviews, issue resolution, and negotiation'],
['Commercial Operations Analyst','Mid-Level','3+ years','commercial data and operational controls','Commercial reporting, pricing support, spreadsheets, and process improvement']]},
{department:'Product & Design',field:'digital product management and user experience',summary:'Make digital services easier to use and more valuable through {focus}.',mustHave:'Curiosity about users and comfort collaborating with product and engineering teams.',roles:[
['Product Designer','Mid-Level','3+ years','accessible digital product experiences','User flows, prototyping, visual design, accessibility, and design systems'],
['UX Researcher','Mid-Level','3+ years','evidence-led understanding of user needs','Interviewing, usability testing, research synthesis, and insight communication'],
['Digital Product Manager','Mid-Senior','5+ years','product strategy and outcome-focused roadmaps','Product discovery, prioritization, analytics, and stakeholder alignment'],
['UX Content Designer','Mid-Level','3+ years','clear product language and content patterns','UX writing, content design, voice and tone, and usability testing'],
['Digital Accessibility Specialist','Mid-Senior','4+ years','inclusive and accessible digital experiences','WCAG, accessibility audits, assistive technology, and remediation planning']]}
];

function shuffle(items){const result=[...items];for(let i=result.length-1;i>0;i-=1){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
const locationPool=shuffle(Array.from({length:13},()=>locations).flat()).slice(0,families.reduce((sum,family)=>sum+family.roles.length,0));
const workModes=['On-site','On-site','Hybrid','Hybrid','Hybrid','Remote'];
const assignedIds=new Set();
const roles=families.flatMap(family=>family.roles.map(([title,level,experience,focus,skills])=>({title,department:family.department,level,experience,summary:family.summary.replace('{focus}',focus),responsibilities:[`Own ${focus} from intake and planning through delivery and handover.`,`Use ${skills} to improve quality, service, or business outcomes.`,`Coordinate with colleagues and stakeholders, keeping decisions, risks, and progress clear.`],requirements:[`Relevant experience: ${experience} in ${family.field}, or equivalent practical work.`,`Working knowledge of ${skills}.`,family.mustHave]})));
const shuffledLocations=shuffle(locationPool);
module.exports=roles.map((role,index)=>{const id='ET-26-'+createHash('sha256').update(role.department+'|'+role.title).digest('hex').slice(0,6).toUpperCase();const location=shuffledLocations[index];const noteRoll=randomInt(100);let workNote='';if(noteRoll<25)workNote='Work visa sponsorship is not available; applicants must already be authorized to work in '+location.country+'.';else if(noteRoll<36)workNote='Occasional travel to client or company sites may be required.';else if(noteRoll<44)workNote='Relocation support is not included for this position.';return{...role,id,location:location.city+', '+location.country,workMode:workModes[randomInt(workModes.length)],workNote};});
