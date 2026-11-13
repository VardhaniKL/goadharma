const jobCards=[...document.querySelectorAll('.job-card')];
if(jobCards.length){
  const query=document.getElementById('jobQuery');
  const department=document.getElementById('jobDepartment');
  const location=document.getElementById('jobLocation');
  const count=document.getElementById('jobResultCount');
  const empty=document.getElementById('jobEmpty');
  const pagination=document.getElementById('jobPagination');
  const pageSize=12;
  let filteredCards=jobCards;
  let currentPage=1;
  const normalize=value=>value.trim().toLowerCase();

  const renderPage=()=>{
    const pageCount=Math.max(1,Math.ceil(filteredCards.length/pageSize));
    currentPage=Math.min(currentPage,pageCount);
    const first=(currentPage-1)*pageSize;
    const last=Math.min(first+pageSize,filteredCards.length);
    const currentSet=new Set(filteredCards.slice(first,last));
    jobCards.forEach(card=>{card.hidden=!currentSet.has(card);});
    count.textContent=filteredCards.length+' '+(filteredCards.length===1?'role':'roles')+' found'
      +(filteredCards.length?(' - showing '+(first+1)+'-'+last):'');
    empty.hidden=filteredCards.length!==0;
    pagination.replaceChildren();
    pagination.hidden=pageCount<=1;
    if(pageCount<=1)return;
    const addButton=(label,target,disabled,current=false)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='job-page-button';
      button.textContent=label;
      button.disabled=disabled;
      if(current)button.setAttribute('aria-current','page');
      button.addEventListener('click',()=>{currentPage=target;renderPage();document.getElementById('jobGrid').scrollIntoView({block:'start',behavior:'smooth'});});
      pagination.append(button);
    };
    addButton('Previous',currentPage-1,currentPage===1);
    for(let page=1;page<=pageCount;page+=1)addButton(String(page),page,false,page===currentPage);
    addButton('Next',currentPage+1,currentPage===pageCount);
  };

  const filterJobs=()=>{
    const term=normalize(query.value);
    const selectedDepartment=department.value;
    const selectedLocation=location.value;
    filteredCards=jobCards.filter(card=>
      (!term||normalize(card.dataset.search).includes(term))
      &&(!selectedDepartment||card.dataset.department===selectedDepartment)
      &&(!selectedLocation||card.dataset.location===selectedLocation)
    );
    currentPage=1;
    renderPage();
  };

  query.addEventListener('input',filterJobs);
  department.addEventListener('change',filterJobs);
  location.addEventListener('change',filterJobs);
  document.getElementById('clearJobFilters').addEventListener('click',()=>{
    query.value='';
    department.value='';
    location.value='';
    filterJobs();
    query.focus();
  });
  filterJobs();
}
