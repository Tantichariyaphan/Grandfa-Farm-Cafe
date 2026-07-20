function dashboardPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Grandfa Cafe Dashboard</title><style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#faf7f3 0%,#f5f0e8 100%);color:#3e2723;margin:0;padding:0;min-height:100vh}
.container{max-width:1200px;margin:0 auto;padding:2rem 1rem}
h1{font-size:2rem;text-align:center;margin:0 0 2rem;padding:1rem;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
.login-card{max-width:400px;margin:3rem auto;padding:2rem;background:#fff;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.login-card h2{margin-top:0;text-align:center;color:#5b3a29}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:2rem 0}
.stat-card{background:#fff;padding:1.5rem;border-radius:.75rem;box-shadow:0 2px 12px rgba(0,0,0,0.08);transition:all .2s}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.12)}
.stat-number{font-size:2.5rem;font-weight:bold;color:#5b3a29;margin:.5rem 0}
.stat-label{font-size:.9rem;color:#8d6e63;text-transform:uppercase;letter-spacing:1px}
.stat-details{margin-top:1rem;padding-top:1rem;border-top:1px solid #eee;font-size:.85rem}
button{background:#5b3a29;color:#fff;border:0;border-radius:.5rem;padding:.75rem 1.5rem;font-size:1rem;cursor:pointer;transition:all .2s;margin:.5rem .25rem}
button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(91,58,41,0.3)}
button:disabled{background:#ccc;cursor:not-allowed;transform:none}
button.secondary{background:#8d6e63}
button.danger{background:#d32f2f}
button.success{background:#388e3c}
input{font:inherit;padding:.75rem;margin:.5rem 0;border:1px solid #d7ccc8;border-radius:.5rem;width:100%;background:#fff}
input:focus{outline:none;border-color:#5b3a29;box-shadow:0 0 0 3px rgba(91,58,41,0.1)}
.error{background:#ffebee;color:#c62828;padding:1rem;border-radius:.5rem;margin:1rem 0;border-left:4px solid #c62828}
.success{background:#e8f5e9;color:#2e7d32;padding:1rem;border-radius:.5rem;margin:1rem 0;border-left:4px solid #2e7d32}
.hidden{display:none!important}
.loading{text-align:center;padding:3rem;color:#8d6e63}
.empty{text-align:center;padding:2rem;color:#8d6e63;background:#faf7f3;border-radius:.5rem}
.top-nav{background:#fff;padding:1rem;margin-bottom:2rem;border-radius:.75rem;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
.top-nav h2{margin:0;color:#5b3a29}
.nav-buttons{display:flex;gap:.5rem;flex-wrap:wrap}
@media(max-width:600px){.grid{grid-template-columns:1fr}.stat-number{font-size:2rem}.top-nav{flex-direction:column;align-items:stretch}.nav-buttons{justify-content:center}}
</style></head><body>
<h1>Grandfa Cafe Dashboard</h1>
<div class="container">
<section id="login" class="login-card"><h2>Owner Sign In</h2><p style="text-align:center;color:#8d6e63;margin-bottom:1.5rem">Access the owner dashboard to view statistics and manage the cafe.</p><div><input id="username" placeholder="Username"></div><div><input id="password" type="password" placeholder="Password"></div><button id="signInBtn" style="width:100%">Sign In</button><p id="loginError" class="error hidden"></p></section>
<section id="app" class="hidden">
<div class="top-nav"><h2>Dashboard</h2><div class="nav-buttons"><button id="refreshBtn">🔄 Refresh</button><button class="danger" onclick="logout()">Logout</button></div></div>
<div id="stats" class="loading">Loading statistics…</div>
<p id="result"></p>
<div class="top-nav"><h2>Knowledge Center</h2><div class="nav-buttons"><input id="knowledgeSearch" placeholder="Search knowledge"><select id="knowledgeCategory"><option value="">All categories</option></select><select id="knowledgeActiveFilter"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select><button id="knowledgeRefreshBtn">🔄 Refresh</button></div></div>
<div id="knowledgeList" class="loading">Loading knowledge…</div>
<div id="knowledgeMessage"></div>
<div class="top-nav"><h2>Chatbot Keywords <span id="keywordCount" style="font-size:0.8rem;color:#8d6e63;margin-left:1rem"></span></h2><div class="nav-buttons"><input id="keywordsSearch" placeholder="Search keywords"><select id="keywordsTypeFilter"><option value="">All types</option><option value="text">text</option><option value="knowledge">knowledge</option><option value="dynamic">dynamic</option></select><select id="keywordsActiveFilter"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select><button id="keywordsRefreshBtn">🔄 Refresh</button><button id="createKeywordBtn">➕ New</button></div></div>
<div id="keywordList" class="loading">Loading keywords…</div>
<div id="keywordMessage"></div>

<div class="top-nav"><h2>Marketing</h2><div class="nav-buttons"><button id="promotionsRefreshBtn">🔄 Promotions</button><button id="couponTemplatesRefreshBtn">🔄 Coupons</button><button id="rewardsRefreshBtn">🔄 Rewards</button></div></div>

<div id="marketing">
  <div class="top-nav"><h2>Promotions</h2><div class="nav-buttons"><button id="createPromotionBtn">➕ New Promotion</button><button id="promotionsRefreshBtn2">🔄 Refresh</button></div></div>
  <div id="promotionsList" class="loading">Loading promotions…</div>
  <div id="promotionsMessage"></div>

  <div class="top-nav"><h2>Coupon Templates</h2><div class="nav-buttons"><button id="createTemplateBtn">➕ New Template</button><button id="couponTemplatesRefreshBtn2">🔄 Refresh</button></div></div>
  <div id="templatesList" class="loading">Loading coupon templates…</div>
  <div id="templatesMessage"></div>

  <div class="top-nav"><h2>Rewards (Point Exchange)</h2><div class="nav-buttons"><button id="rewardsRefreshBtn2">🔄 Refresh</button></div></div>
  <div id="rewardsList" class="loading">Loading reward options…</div>
  <div id="rewardsMessage"></div>
</div>

</section>
</div>
<script>
let token=localStorage.getItem('gcToken')||'';

async function api(path,opt={}){try{let r=await fetch(path,{...opt,headers:{...(opt.headers||{}),'Content-Type':'application/json',Authorization:'Bearer '+token}});let j=await r.json();if(!j.success)throw Error(j.message);return j.data}catch(e){if(e.message.includes('401')||e.message.includes('Session')){await logout();throw e}throw e}}

async function validateSession(){try{await api('/api/auth/staff-session');return true}catch(e){return false}}

async function logout(){localStorage.removeItem('gcToken');token='';location.reload()}

function renderStats(data){if(!data||Object.keys(data).length===0)return '<div class="empty">No statistics available</div>';
const icons={members:'👥',stamps:'⭐',coupons:'🎁',transactions:'💳'};
let html='<div class="grid">';
for(const[key,value]of Object.entries(data)){
  const icon=icons[key]||'📊';
  if(typeof value==='object'){
    html+='<article class="stat-card"><div class="stat-label">'+icon+' '+key.charAt(0).toUpperCase()+key.slice(1)+'</div>';
    if(value.total!==undefined){html+='<div class="stat-number">'+value.total+'</div>'}
    html+='<div class="stat-details">';
    for(const[k,v]of Object.entries(value)){
      if(k!=='total'){const label=k.replace(/_/g,' ').replace(new RegExp('\\\\b\\\\w','g'), function(l){return l.toUpperCase();});html+='<div><strong>'+label+':</strong> '+v+'</div>'}}
    html+='</div></article>'}}
html+='</div>';
return html}

async function loadStats(){const stats=document.getElementById('stats');stats.innerHTML='<div class="loading">Loading statistics…</div>';try{const data=await api('/api/dashboard/statistics');stats.innerHTML=renderStats(data)}catch(e){stats.innerHTML='<div class="error">⚠️ Failed to load statistics: '+e.message+'<br><button onclick="loadStats()">Try Again</button></div>'}}

const KNOWLEDGE_TEMPLATE=[
  {category:'store',label:'Store',items:[
    {key:'opening_hours',title:'Opening Hours'},
    {key:'contact',title:'Contact'},
    {key:'parking',title:'Parking'},
    {key:'wifi',title:'WiFi'},
    {key:'google_map',title:'Google Map'},
    {key:'website',title:'Website'},
    {key:'facebook',title:'Facebook'},
    {key:'instagram',title:'Instagram'},
  ]},
  {category:'member',label:'Member',items:[
    {key:'member_guide',title:'Member Guide'},
    {key:'stamp_guide',title:'Stamp Guide'},
    {key:'coupon_guide',title:'Coupon Guide'},
  ]},
  {category:'faq',label:'FAQ',items:[
    {key:'faq',title:'FAQ'},
  ]},
  {category:'announcement',label:'Announcement',items:[
    {key:'announcement',title:'Announcement'},
  ]},
];

function mergeKnowledgeWithTemplate(apiEntries){
  const byKey={};
  (apiEntries||[]).forEach(e=>{byKey[e.key]=Object.assign({}, e.value||{}, { updated_at: e.updated_at, updated_by_name: e.value && e.value.updated_by_name ? e.value.updated_by_name : null })});
  return KNOWLEDGE_TEMPLATE.map(group=>({
    category:group.category,
    label:group.label,
    items:group.items.map((item,i)=>{
      const stored=byKey[item.key]||{};
      return{
        key:item.key,
        title:stored.title!==undefined?stored.title:item.title,
        content:stored.content!==undefined?stored.content:'',
        order:stored.order!==undefined?stored.order:(i+1),
        updated_at: stored.updated_at || null,
        updated_by_name: stored.updated_by_name || null,
      }})
  }))}

function renderKnowledge(groups){if(!groups||groups.length===0)return '<div class="empty">No knowledge entries yet</div>';
const esc=(s)=>String(s===undefined||s===null?'':s).replace(new RegExp('"','g'),'&quot;');
let html='';
groups.forEach(group=>{
  html+='<h3 style="color:#5b3a29;margin:1.5rem 0 .5rem">'+group.label+'</h3>';
  html+='<div class="grid">';
  group.items.forEach(item=>{
    html+='<article class="stat-card">'
      +'<div class="stat-label">🔑 '+item.key+'</div>'
      +'<div style="font-size:0.9rem;color:#8d6e63;margin-bottom:0.5rem">'+(item.updated_by_name?('Updated by: '+esc(item.updated_by_name)):'')+(item.updated_at?(' • '+new Date(item.updated_at).toLocaleString()):'')+'</div>'
      +'<input id="kw-title-'+item.key+'" value="'+esc(item.title)+'" placeholder="Title">'
      +'<input id="kw-content-'+item.key+'" value="'+esc(item.content)+'" placeholder="Content">'
      +'<input id="kw-order-'+item.key+'" type="number" value="'+esc(item.order)+'" placeholder="Order">'
      +'<button class="kw-save-btn" data-key="'+item.key+'" data-category="'+group.category+'">Save</button>'
      +'</article>'});
  html+='</div>'});
return html}

function setupKnowledgeSaveHandlers(){document.querySelectorAll('.kw-save-btn').forEach(function(btn){btn.addEventListener('click',function(){saveKnowledge(this.dataset.key,this.dataset.category)})})}

async function loadKnowledge(){const el=document.getElementById('knowledgeList');el.innerHTML='<div class="loading">Loading knowledge…</div>';try{const data=await api('/api/knowledge');const groups=mergeKnowledgeWithTemplate(Array.isArray(data)?data:[]);el.innerHTML=renderKnowledge(groups);setupKnowledgeSaveHandlers()}catch(e){el.innerHTML='<div class="error">⚠️ Failed to load knowledge: '+e.message+'<br><button onclick="loadKnowledge()">Try Again</button></div>'}}

async function saveKnowledge(key,category){const msg=document.getElementById('knowledgeMessage');msg.innerHTML='';
const titleEl=document.getElementById('kw-title-'+key);
const contentEl=document.getElementById('kw-content-'+key);
const orderEl=document.getElementById('kw-order-'+key);
const payload={title:titleEl.value.trim(),category:category,content:contentEl.value.trim()};
if(orderEl.value!==''){payload.order=Number(orderEl.value)}
try{await api('/api/knowledge/'+encodeURIComponent(key),{method:'PUT',body:JSON.stringify(payload)});msg.innerHTML='<div class="success">✓ Saved "'+key+'"</div>';await loadKnowledge()}catch(e){msg.innerHTML='<div class="error">⚠️ '+e.message+'</div>'}}

async function open(){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');await loadStats();await loadKnowledge()}

document.getElementById('signInBtn').onclick=async()=>{const btn=document.getElementById('signInBtn');const err=document.getElementById('loginError');try{btn.disabled=true;btn.textContent='Signing in…';err.classList.add('hidden');const data=await api('/api/auth/staff-login',{method:'POST',body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});token=data.token;localStorage.setItem('gcToken',token);if(await validateSession()){await open()}else{throw Error('Session validation failed')}}catch(e){err.textContent=e.message;err.classList.remove('hidden');btn.disabled=false;btn.textContent='Sign In'}};

document.getElementById('refreshBtn').onclick=loadStats;
document.getElementById('knowledgeRefreshBtn').onclick=loadKnowledge;

// Keywords handlers
document.getElementById('keywordsRefreshBtn').onclick=loadKeywords;
document.getElementById('createKeywordBtn').onclick=showCreateKeywordForm;

// Marketing handlers
document.getElementById('promotionsRefreshBtn').onclick = loadPromotions;
document.getElementById('promotionsRefreshBtn2').onclick = loadPromotions;
document.getElementById('createPromotionBtn').onclick = showCreatePromotionForm;

document.getElementById('couponTemplatesRefreshBtn').onclick = loadTemplates;
document.getElementById('couponTemplatesRefreshBtn2').onclick = loadTemplates;
document.getElementById('createTemplateBtn').onclick = showCreateTemplateForm;

document.getElementById('rewardsRefreshBtn').onclick = loadRewards;
document.getElementById('rewardsRefreshBtn2').onclick = loadRewards;

let _knowledgeItems = [];

async function loadKeywords(){
  const el=document.getElementById('keywordList');
  el.innerHTML='<div class="loading">Loading keywords…</div>';
  try{
    // fetch knowledge items for dropdowns
    const kitems = await api('/api/knowledge');
    _knowledgeItems = Array.isArray(kitems) ? kitems : [];

    const search = encodeURIComponent(document.getElementById('keywordsSearch').value || '');
    const response_type = encodeURIComponent(document.getElementById('keywordsTypeFilter').value || '');
    const is_active = encodeURIComponent(document.getElementById('keywordsActiveFilter').value || '');
    const q = [];
    if(search) q.push('search='+search);
    if(response_type) q.push('response_type='+response_type);
    if(is_active) q.push('is_active='+is_active);
    const queryStr = q.length ? ('?'+q.join('&')) : '';

    const data = await api('/api/dashboard/keywords'+queryStr);
    const rows = data.rows || [];
    document.getElementById('keywordCount').textContent = '('+ (data.count||rows.length) +')';
    el.innerHTML = renderKeywords(rows);
    setupKeywordHandlers();
  }catch(e){el.innerHTML='<div class="error">⚠️ Failed to load keywords: '+e.message+'<br><button onclick="loadKeywords()">Try Again</button></div>'}
}

// ----- Marketing UI functions -----
async function loadPromotions(){
  const el = document.getElementById('promotionsList');
  el.innerHTML = '<div class="loading">Loading promotions…</div>';
  try{
    const data = await api('/api/dashboard/marketing/promotions');
    el.innerHTML = renderPromotions(data || []);
    setupPromotionsHandlers();
  }catch(e){el.innerHTML = '<div class="error">⚠️ Failed to load promotions: '+e.message+'<br><button onclick="loadPromotions()">Try Again</button></div>'}
}

function renderPromotions(list){
  if(!list||list.length===0) return '<div class="empty">No promotions yet</div>';
  const esc = s => String(s===undefined||s===null?'':s).replace(/"/g,'&quot;');
  let html = '<div class="grid">';
  list.forEach(p => {
    html += '<article class="stat-card">'
      +'<div class="stat-label">📣 '+esc(p.title)+'</div>'
      +(p.image?'<div style="margin:.5rem 0"><img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" style="max-width:100%;height:120px;object-fit:cover;border-radius:.5rem"></div>':'')
      +'<div style="font-size:0.9rem;color:#8d6e63">'+esc(p.description||'')+'</div>'
      +'<div style="margin-top:.5rem;font-size:0.85rem;color:#8d6e63">Valid: '+(new Date(p.valid_from).toLocaleString())+' → '+(new Date(p.valid_to).toLocaleString())+'</div>'
      +'<div style="margin-top:.5rem">'
      +'<button class="promo-toggle" data-id="'+p.id+'">'+(p.is_active? 'Disable' : 'Enable')+'</button>'
      +'<button class="promo-delete danger" data-id="'+p.id+'">Delete</button>'
      +'</div></article>'
  });
  html += '</div>';
  return html;
}

function setupPromotionsHandlers(){
  document.querySelectorAll('.promo-toggle').forEach(btn=>btn.addEventListener('click',async function(){
    const id = this.dataset.id;
    const enable = this.textContent === 'Enable';
    try{await api('/api/dashboard/marketing/promotions/'+id+'/active',{method:'PATCH',body:JSON.stringify({is_active: enable})});document.getElementById('promotionsMessage').innerHTML='<div class="success">Updated</div>';await loadPromotions()}catch(e){document.getElementById('promotionsMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));
  document.querySelectorAll('.promo-delete').forEach(btn=>btn.addEventListener('click',async function(){
    if(!confirm('Disable this promotion?')) return;
    const id = this.dataset.id;
    try{await api('/api/dashboard/marketing/promotions/'+id,{method:'DELETE'});document.getElementById('promotionsMessage').innerHTML='<div class="success">Disabled</div>';await loadPromotions()}catch(e){document.getElementById('promotionsMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));
}

function showCreatePromotionForm(){
  const el = document.getElementById('promotionsList');
  el.innerHTML = '<div class="stat-card">'
    +'<input id="new-p-title" placeholder="Title">'
    +'<input id="new-p-image" placeholder="Image URL">'
    +'<input id="new-p-start" placeholder="Start (ISO 8601)">'
    +'<input id="new-p-end" placeholder="End (ISO 8601)">'
    +'<textarea id="new-p-desc" placeholder="Description"></textarea>'
    +'<div><button id="createPromotionSave">Create</button><button id="createPromotionCancel" class="secondary">Cancel</button></div>'
    +'</div>';
  document.getElementById('createPromotionCancel').onclick = loadPromotions;
  document.getElementById('createPromotionSave').onclick = async ()=>{
    const payload = { title: document.getElementById('new-p-title').value, image: document.getElementById('new-p-image').value, start_at: document.getElementById('new-p-start').value, end_at: document.getElementById('new-p-end').value, description: document.getElementById('new-p-desc').value };
    try{await api('/api/dashboard/marketing/promotions',{method:'POST',body:JSON.stringify(payload)});document.getElementById('promotionsMessage').innerHTML='<div class="success">Created</div>';await loadPromotions()}catch(e){document.getElementById('promotionsMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }
}

async function loadTemplates(){
  const el = document.getElementById('templatesList');
  el.innerHTML = '<div class="loading">Loading coupon templates…</div>';
  try{
    const data = await api('/api/dashboard/marketing/coupon-templates');
    el.innerHTML = renderTemplates(data || []);
    setupTemplateHandlers();
  }catch(e){el.innerHTML = '<div class="error">⚠️ Failed to load templates: '+e.message+'<br><button onclick="loadTemplates()">Try Again</button></div>'}
}

function renderTemplates(list){
  if(!list||list.length===0) return '<div class="empty">No templates yet</div>';
  const esc = s => String(s===undefined||s===null?'':s).replace(/"/g,'&quot;');
  let html = '<div class="grid">';
  list.forEach(t=>{
    html += '<article class="stat-card">'
      +'<div class="stat-label">🎟 '+esc(t.title)+'</div>'
      +(t.image?'<div style="margin:.5rem 0"><img src="'+esc(t.image)+'" alt="'+esc(t.title)+'" style="max-width:100%;height:120px;object-fit:cover;border-radius:.5rem"></div>':'')
      +'<div style="font-size:0.9rem;color:#8d6e63">'+esc(t.description||'')+'</div>'
      +'<div style="margin-top:.5rem;font-size:0.85rem;color:#8d6e63">Type: '+esc(t.coupon_type||'')+(t.point_cost?(' • Cost: '+t.point_cost+' pts'):'')+'</div>'
      +'<div style="margin-top:.5rem">'
      +'<button class="tpl-edit" data-id="'+t.id+'">Edit</button>'
      +'<button class="tpl-delete danger" data-id="'+t.id+'">Delete</button>'
      +'</div></article>'
  });
  html += '</div>';
  return html;
}

function setupTemplateHandlers(){
  document.querySelectorAll('.tpl-edit').forEach(btn=>btn.addEventListener('click',async function(){
    const id = this.dataset.id; showEditTemplateForm(id);
  }));
  document.querySelectorAll('.tpl-delete').forEach(btn=>btn.addEventListener('click',async function(){
    if(!confirm('Delete this template?')) return;
    const id = this.dataset.id; try{await api('/api/dashboard/marketing/coupon-templates/'+id,{method:'DELETE'});document.getElementById('templatesMessage').innerHTML='<div class="success">Deleted</div>';await loadTemplates()}catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));
}

function showCreateTemplateForm(){
  const el = document.getElementById('templatesList');
  el.innerHTML = '<div class="stat-card">'
    +'<input id="tpl-title" placeholder="Title">'
    +'<input id="tpl-image" placeholder="Image URL">'
    +'<input id="tpl-type" placeholder="Coupon Type">'
    +'<input id="tpl-pointcost" type="number" placeholder="Point Cost">'
    +'<textarea id="tpl-desc" placeholder="Description"></textarea>'
    +'<div><button id="createTemplateSave">Create</button><button id="createTemplateCancel" class="secondary">Cancel</button></div>'
    +'</div>';
  document.getElementById('createTemplateCancel').onclick = loadTemplates;
  document.getElementById('createTemplateSave').onclick = async ()=>{
    const payload = { title: document.getElementById('tpl-title').value, image: document.getElementById('tpl-image').value, coupon_type: document.getElementById('tpl-type').value, point_cost: Number(document.getElementById('tpl-pointcost').value)||null, description: document.getElementById('tpl-desc').value };
    try{await api('/api/dashboard/marketing/coupon-templates',{method:'POST',body:JSON.stringify(payload)});document.getElementById('templatesMessage').innerHTML='<div class="success">Created</div>';await loadTemplates()}catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }
}

async function showEditTemplateForm(id){
  try{
    const tpl = await api('/api/dashboard/marketing/coupon-templates?id='+id);
    const el = document.getElementById('templatesList');
    el.innerHTML = '<div class="stat-card">'
      +'<input id="tpl-title" value="'+(tpl.title||'')+'" placeholder="Title">'
      +'<input id="tpl-image" value="'+(tpl.image||'')+'" placeholder="Image URL">'
      +'<input id="tpl-type" value="'+(tpl.coupon_type||'')+'" placeholder="Coupon Type">'
      +'<input id="tpl-pointcost" type="number" value="'+(tpl.point_cost||'')+'" placeholder="Point Cost">'
      +'<textarea id="tpl-desc" placeholder="Description">'+(tpl.description||'')+'</textarea>'
      +'<div><button id="updateTemplateSave">Save</button><button id="updateTemplateCancel" class="secondary">Cancel</button></div>'
      +'</div>';
    document.getElementById('updateTemplateCancel').onclick = loadTemplates;
    document.getElementById('updateTemplateSave').onclick = async ()=>{
      const payload = { title: document.getElementById('tpl-title').value, image: document.getElementById('tpl-image').value, coupon_type: document.getElementById('tpl-type').value, point_cost: Number(document.getElementById('tpl-pointcost').value)||null, description: document.getElementById('tpl-desc').value };
      try{await api('/api/dashboard/marketing/coupon-templates/'+id,{method:'PUT',body:JSON.stringify(payload)});document.getElementById('templatesMessage').innerHTML='<div class="success">Saved</div>';await loadTemplates()}catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
    }
  }catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
}

async function loadRewards(){
  const el = document.getElementById('rewardsList');
  el.innerHTML = '<div class="loading">Loading reward options…</div>';
  try{
    const data = await api('/api/dashboard/marketing/rewards');
    const list = Array.isArray(data) ? data : [];
    if(list.length===0){el.innerHTML='<div class="empty">No point-exchange rewards configured</div>';return}
    const esc = s => String(s===undefined||s===null?'':s).replace(/"/g,'&quot;');
    let html = '<div class="grid">';
    list.forEach(r=>{
      html += '<article class="stat-card">'
        +'<div class="stat-label">🎯 '+esc(r.title)+'</div>'
        +'<div style="font-size:0.9rem;color:#8d6e63">Cost: '+(r.point_cost||0)+' points</div>'
        +'<div style="margin-top:.5rem">'
        +'<button class="reward-toggle" data-id="'+r.id+'">'+(r.is_active? 'Disable' : 'Enable')+'</button>'
        +'</div></article>'
    });
    html += '</div>';
    el.innerHTML = html;
    document.querySelectorAll('.reward-toggle').forEach(btn=>btn.addEventListener('click',async function(){const id=this.dataset.id;try{await api('/api/dashboard/marketing/rewards/'+id+'/toggle',{method:'PATCH'});document.getElementById('rewardsMessage').innerHTML='<div class="success">Toggled</div>';await loadRewards()}catch(e){document.getElementById('rewardsMessage').innerHTML='<div class="error">'+e.message+'</div>'}}));
  }catch(e){el.innerHTML = '<div class="error">⚠️ Failed to load rewards: '+e.message+'<br><button onclick="loadRewards()">Try Again</button></div>'}
}

async function showEditTemplateForm(id){
  try{
    const rows = await api('/api/dashboard/marketing/coupon-templates');
    const tpl = (rows || []).find(r => String(r.id) === String(id));
    if(!tpl) { document.getElementById('templatesMessage').innerHTML = '<div class="error">Template not found</div>'; return; }
    const el = document.getElementById('templatesList');
    el.innerHTML = '<div class="stat-card">'
      +'<input id="tpl-title" value="'+(tpl.title||'')+'" placeholder="Title">'
      +'<input id="tpl-image" value="'+(tpl.image||'')+'" placeholder="Image URL">'
      +'<input id="tpl-type" value="'+(tpl.coupon_type||'')+'" placeholder="Coupon Type">'
      +'<input id="tpl-pointcost" type="number" value="'+(tpl.point_cost||'')+'" placeholder="Point Cost">'
      +'<textarea id="tpl-desc" placeholder="Description">'+(tpl.description||'')+'</textarea>'
      +'<div><button id="updateTemplateSave">Save</button><button id="updateTemplateCancel" class="secondary">Cancel</button></div>'
      +'</div>';
    document.getElementById('updateTemplateCancel').onclick = loadTemplates;
    document.getElementById('updateTemplateSave').onclick = async ()=>{
      const payload = { title: document.getElementById('tpl-title').value, image: document.getElementById('tpl-image').value, coupon_type: document.getElementById('tpl-type').value, point_cost: Number(document.getElementById('tpl-pointcost').value)||null, description: document.getElementById('tpl-desc').value };
      try{await api('/api/dashboard/marketing/coupon-templates/'+id,{method:'PUT',body:JSON.stringify(payload)});document.getElementById('templatesMessage').innerHTML='<div class="success">Saved</div>';await loadTemplates()}catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
    }
  }catch(e){document.getElementById('templatesMessage').innerHTML='<div class="error">'+e.message+'</div>'}
}

function renderKeywords(list){if(!list||list.length===0)return '<div class="empty">No keywords yet</div>';const esc=(s)=>String(s===undefined||s===null?'':s).replace(new RegExp('"','g'),'&quot;');let html='<div class="grid">';list.forEach(item=>{html+='<article class="stat-card">'
+'<div class="stat-label">🔑 '+esc(item.keyword)+'</div>'
+'<input class="kw-field" data-id="'+item.id+'" data-field="keyword" value="'+esc(item.keyword)+'" placeholder="Keyword">'
+'<select class="kw-field" data-id="'+item.id+'" data-field="response_type">'
+['text','knowledge','dynamic'].map(t=>'<option value="'+t+'"'+(item.response_type===t?' selected':'')+'>'+t+'</option>').join('')+' '</select>'
+(item.response_type==='knowledge' ? (function(){ const opts = (_knowledgeItems||[]).map(k=>'<option value="'+esc(k.key)+'"'+(item.response_target===k.key?' selected':'')+'>'+esc((k.value&&k.value.title)||k.key)+'</option>').join(''); return '<select class="kw-field" data-id="'+item.id+'" data-field="response_target">'+opts+'</select>'; })() : '<input class="kw-field" data-id="'+item.id+'" data-field="response_target" value="'+esc(item.response_target||'')+'" placeholder="Response Target">')
+'<textarea class="kw-field" data-id="'+item.id+'" data-field="response_text" placeholder="Response Text">'+esc(item.response_text||'')+'</textarea>'
+'<input class="kw-field" data-id="'+item.id+'" data-field="priority" type="number" value="'+esc(item.priority||'0')+'" placeholder="Priority">'
+'<div style="margin-top:.5rem">'
+'<button class="kw-save" data-id="'+item.id+'">Save</button>'
+'<button class="kw-toggle" data-id="'+item.id+'">'+(item.is_active? 'Disable' : 'Enable')+'</button>'
+'<button class="kw-delete danger" data-id="'+item.id+'">Delete</button>'
+'</div></article>'});html+='</div>';return html}

function setupKeywordHandlers(){
  document.querySelectorAll('.kw-save').forEach(btn=>btn.addEventListener('click',async function(){
    const id=this.dataset.id;
    const fields=document.querySelectorAll('.kw-field[data-id="'+id+'"]');
    const payload={};
    fields.forEach(f=>{const k=f.dataset.field;payload[k]=f.value});
    try{await api('/api/dashboard/keywords/'+id,{method:'PUT',body:JSON.stringify(payload)});document.getElementById('keywordMessage').innerHTML='<div class="success">Saved</div>';await loadKeywords()}catch(e){document.getElementById('keywordMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));

  document.querySelectorAll('.kw-toggle').forEach(btn=>btn.addEventListener('click',async function(){
    const id=this.dataset.id;
    try{
      const el=document.getElementById('keywordMessage');
      // determine desired state by current button text
      const enable = this.textContent === 'Enable';
      await api('/api/dashboard/keywords/'+id,{method:'PUT',body:JSON.stringify({is_active: enable})});
      el.innerHTML='<div class="success">Toggled</div>';await loadKeywords()
    }catch(e){document.getElementById('keywordMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));

  document.querySelectorAll('.kw-delete').forEach(btn=>btn.addEventListener('click',async function(){
    if(!confirm('Delete this keyword?'))return;
    const id=this.dataset.id;
    try{await api('/api/dashboard/keywords/'+id,{method:'DELETE'});document.getElementById('keywordMessage').innerHTML='<div class="success">Deleted</div>';await loadKeywords()}catch(e){document.getElementById('keywordMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }));

  // dynamic response_target control when response_type changes
  document.querySelectorAll('.kw-field[data-field="response_type"]').forEach(sel=>{
    sel.addEventListener('change', function(){
      const id=this.dataset.id;
      const rt = document.querySelector('.kw-field[data-id="'+id+'"][data-field="response_target"]');
      if(!rt) return;
      const currentValue = rt.value || '';
      if(this.value === 'knowledge'){
        // replace with select
        const opts = (_knowledgeItems||[]).map(k => '<option value="'+k.key+'"'+(k.key===currentValue?' selected':'')+'>'+(k.value&&k.value.title?k.value.title:k.key)+'</option>').join('');
        const selHtml = '<select class="kw-field" data-id="'+id+'" data-field="response_target">'+opts+'</select>';
        rt.outerHTML = selHtml;
      } else {
        // replace with input
        const inputHtml = '<input class="kw-field" data-id="'+id+'" data-field="response_target" value="'+(currentValue||'')+'" placeholder="Response Target">';
        rt.outerHTML = inputHtml;
      }
    });
  });
}


async function showCreateKeywordForm(){
  const el=document.getElementById('keywordList');
  const options = ['text','knowledge','dynamic'].map(t=>'<option value="'+t+'">'+t+'</option>').join('');
  const knowledgeOptions = (_knowledgeItems||[]).map(k=>'<option value="'+k.key+'">'+(k.value&&k.value.title?k.value.title:k.key)+'</option>').join('');
  el.innerHTML='<div class="stat-card">'
    +'<input id="new-keyword" placeholder="Keyword">'
    +'<select id="new-response-type">'+options+'</select>'
    +'<span id="new-response-target-wrapper">'+('<input id="new-response-target" placeholder="Response Target">')+'</span>'
    +'<textarea id="new-response-text" placeholder="Response Text"></textarea>'
    +'<input id="new-priority" type="number" placeholder="Priority">'
    +'<div><button id="createKeywordSave">Create</button><button id="createKeywordCancel" class="secondary">Cancel</button></div>'
    +'</div>';

  const wrapper = document.getElementById('new-response-target-wrapper');
  const rtSelectHtml = '<select id="new-response-target">'+knowledgeOptions+'</select>';
  const rtInputHtml = '<input id="new-response-target" placeholder="Response Target">';

  function updateNewResponseTarget(){
    const type = document.getElementById('new-response-type').value;
    if(type === 'knowledge'){
      wrapper.innerHTML = rtSelectHtml;
    }else{
      wrapper.innerHTML = rtInputHtml;
    }
  }

  document.getElementById('createKeywordCancel').onclick=loadKeywords;
  document.getElementById('new-response-type').addEventListener('change', updateNewResponseTarget);
  // initialize
  updateNewResponseTarget();

  document.getElementById('createKeywordSave').onclick=async()=>{
    const payload={
      keyword:document.getElementById('new-keyword').value,
      response_type:document.getElementById('new-response-type').value,
      response_target:document.getElementById('new-response-target').value,
      response_text:document.getElementById('new-response-text').value,
      priority:document.getElementById('new-priority').value||0
    };
    try{await api('/api/dashboard/keywords',{method:'POST',body:JSON.stringify(payload)});document.getElementById('keywordMessage').innerHTML='<div class="success">Created</div>';await loadKeywords()}catch(e){document.getElementById('keywordMessage').innerHTML='<div class="error">'+e.message+'</div>'}
  }
}

if(token){validateSession().then(valid=>{if(valid){open()}else{logout()}})};
</script></body></html>`;
}
module.exports = { dashboardPage };