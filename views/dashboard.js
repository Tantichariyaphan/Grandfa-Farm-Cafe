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
      if(k!=='total'){const label=k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());html+='<div><strong>'+label+':</strong> '+v+'</div>'}}
    html+='</div></article>'}}
html+='</div>';
return html}

async function loadStats(){const stats=document.getElementById('stats');stats.innerHTML='<div class="loading">Loading statistics…</div>';try{const data=await api('/api/dashboard/statistics');stats.innerHTML=renderStats(data)}catch(e){stats.innerHTML='<div class="error">⚠️ Failed to load statistics: '+e.message+'<br><button onclick="loadStats()">Try Again</button></div>'}}

async function open(){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');await loadStats()}

document.getElementById('signInBtn').onclick=async()=>{const btn=document.getElementById('signInBtn');const err=document.getElementById('loginError');try{btn.disabled=true;btn.textContent='Signing in…';err.classList.add('hidden');const data=await api('/api/auth/staff-login',{method:'POST',body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});token=data.token;localStorage.setItem('gcToken',token);if(await validateSession()){await open()}else{throw Error('Session validation failed')}}catch(e){err.textContent=e.message;err.classList.remove('hidden');btn.disabled=false;btn.textContent='Sign In'}};

document.getElementById('refreshBtn').onclick=loadStats;

if(token){validateSession().then(valid=>{if(valid){open()}else{logout()}})};
</script></body></html>`;
}
module.exports = { dashboardPage };