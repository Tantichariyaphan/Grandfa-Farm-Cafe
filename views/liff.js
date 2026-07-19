function page({ title, liffId, staff = false }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>${title}</title><script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script><style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#faf7f3 0%,#f5f0e8 100%);color:#3e2723;margin:0;padding:0;min-height:100vh}
.container{max-width:480px;margin:0 auto;padding:1rem}
h1{font-size:1.5rem;text-align:center;margin:0 0 1rem;padding:1rem 0;border-bottom:2px solid #5b3a29;background:#fff}
button{background:#5b3a29;color:#fff;border:0;border-radius:.5rem;padding:.75rem 1rem;font-size:1rem;cursor:pointer;width:100%;margin:.5rem 0;transition:all .2s}
button:disabled{background:#ccc;cursor:not-allowed}
button.secondary{background:#8d6e63}
button.danger{background:#d32f2f}
button.success{background:#388e3c}
button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(91,58,41,0.3)}
input,select,textarea{font:inherit;padding:.75rem;margin:.5rem 0;border:1px solid #d7ccc8;border-radius:.5rem;width:100%;background:#fff}
input:focus,select:focus,textarea:focus{outline:none;border-color:#5b3a29;box-shadow:0 0 0 3px rgba(91,58,41,0.1)}
.loading{text-align:center;padding:2rem;color:#8d6e63}
.error{background:#ffebee;color:#c62828;padding:1rem;border-radius:.5rem;margin:1rem 0;border-left:4px solid #c62828}
.success{background:#e8f5e9;color:#2e7d32;padding:1rem;border-radius:.5rem;margin:1rem 0;border-left:4px solid #2e7d32}
.hidden{display:none!important}
nav{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;background:#fff;padding:1rem;border-radius:.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
nav button{flex:1;min-width:calc(50% - .25rem);padding:.5rem;font-size:.9rem}
.card{background:#fff;border-radius:.75rem;box-shadow:0 2px 12px rgba(0,0,0,0.1);margin:1rem 0;overflow:hidden}
.card-header{background:linear-gradient(135deg,#5b3a29 0%,#8d6e63 100%);color:#fff;padding:1.5rem;text-align:center}
.card-header img{width:80px;height:80px;border-radius:50%;border:3px solid #fff;margin-bottom:.5rem}
.card-body{padding:1.5rem}
.stamp-progress{margin:1rem 0}
.stamp-dots{ display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin:20px 0; } .stamp-dot{ width:52px; height:52px; border-radius:50%; border:2px solid #d8b38c; background:white; display:flex; align-items:center; justify-content:center; font-size:24px; transition:.25s; } .stamp-dot.filled{ background:#6d4c41; border-color:#6d4c41; color:white; box-shadow:0 6px 14px rgba(109,76,65,.3); }
.stamp-fill{background:linear-gradient(90deg,#ff6f00 0%,#ff8f00 100%);height:100%;transition:width .5s ease;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:.8rem}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin:1rem 0}
.stat{background:#faf7f3;padding:1rem;border-radius:.5rem;text-align:center}
.stat-value{font-size:2rem;font-weight:bold;color:#5b3a29}
.stat-label{font-size:.8rem;color:#8d6e63;margin-top:.25rem}
.qr-container{text-align:center;padding:1rem;background:#fff;border-radius:.5rem;margin:1rem 0}
.qr-container img{max-width:100%;height:auto}
.coupon-card{background:#fff;border-radius:.75rem;overflow:hidden;margin:.5rem 0;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all .2s}
.coupon-card.unused{cursor:pointer}
.coupon-card.unused:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.15)}
.coupon-header{background:linear-gradient(135deg,#ff6f00 0%,#ff8f00 100%);color:#fff;padding:1rem}
.coupon-header.used,.coupon-header.expired,.coupon-header.cancelled{background:#bdbdbd}
.coupon-body{padding:1rem}
.coupon-title{font-weight:bold;margin-bottom:.5rem}
.coupon-meta{font-size:.85rem;color:#6d4c41}
.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:1000}
.modal-content{background:#fff;border-radius:.75rem;max-width:400px;width:100%;max-height:90vh;overflow-y:auto}
.modal-header{background:linear-gradient(135deg,#5b3a29 0%,#8d6e63 100%);color:#fff;padding:1rem;position:relative}
.modal-body{padding:1.5rem}
.banner{position:fixed;top:0;left:0;right:0;background:#ff6f00;color:#fff;padding:1rem;text-align:center;z-index:999;animation:slideDown .3s ease}
@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
.form-group{margin-bottom:1rem}
.form-group label{display:block;margin-bottom:.25rem;font-weight:500}
.login-form{max-width:320px;margin:2rem auto;padding:2rem;background:#fff;border-radius:.75rem;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.empty-state{text-align:center;padding:3rem 1rem;color:#8d6e63}
.empty-state svg{width:80px;height:80px;margin-bottom:1rem;opacity:.5}
.countdown{font-size:1.5rem;font-weight:bold;color:#d32f2f;margin:1rem 0;text-align:center}
.countdown.expired{color:#bdbdbd}
.status-badge{display:inline-block;padding:.25rem .75rem;border-radius:.25rem;font-size:.8rem;font-weight:bold;margin-bottom:.5rem}
.status-badge.used{background:#e8f5e9;color:#2e7d32}
.status-badge.expired{background:#ffebee;color:#c62828}
.status-badge.unused{background:#fff3e0;color:#ef6c00}
.quantity-picker{background:#faf7f3;padding:1.5rem;border-radius:.5rem;margin:1rem 0;text-align:center}
.quantity-display{font-size:3rem;font-weight:bold;color:#5b3a29;margin:1rem 0}
.quantity-buttons{display:flex;gap:.5rem;justify-content:center;margin-top:1rem}
.quantity-buttons button{width:60px;height:60px;border-radius:50%;font-size:2rem;line-height:1;display:flex;align-items:center;justify-content:center}
.quick-amounts{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem;justify-content:center}
.quick-amounts button{width:auto;min-width:60px;padding:.5rem 1rem}
.manual-input-link{text-align:center;margin-top:1rem}
.manual-input-link a{color:#8d6e63;font-size:.85rem;cursor:pointer;text-decoration:underline}
#qr-shim{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center}
#qr-shim .scanner-container{background:#fff;border-radius:1rem;padding:1rem;width:100%;max-width:400px;margin:1rem}
#qr-shim .scanner-title{font-size:1.2rem;font-weight:bold;text-align:center;margin-bottom:1rem;color:#3e2723}
#qr-shim #qr-reader{width:100%;min-height:250px}
#qr-shim .scanner-error{color:#c62828;text-align:center;margin-top:1rem}
</style></head><body>
<h1>${title}</h1>
<div class="container">
<section id="login" class="login-form">${staff ? '<h2>Staff Sign In</h2><div class="form-group"><label>Username</label><input id="username" placeholder="Enter username"></div><div class="form-group"><label>Password</label><input id="password" type="password" placeholder="Enter password"></div><button id="signInBtn">Sign In</button><p id="loginError" class="error hidden"></p>' : '<p id="status">Connecting to LINE…</p>'}</section>
<main id="app" class="hidden">
${staff ? '<section id="staffSection"><nav><button onclick="showStampFlow()">Add Stamp</button><button onclick="showRedeemFlow()">Redeem Coupon</button><button onclick="logout()">Logout</button></nav><div id="stampFlow" class="hidden"><h2>Add Stamp</h2><div class="quantity-picker"><label style="font-weight:500;margin-bottom:.5rem;display:block">Select number of stamps</label><div class="quantity-display" id="quantityDisplay">1</div><div class="quantity-buttons"><button onclick="decrementQuantity()" style="background:#8d6e63">−</button><button onclick="incrementQuantity()" style="background:#388e3c">+</button></div><div class="quick-amounts"><button onclick="setQuantity(1)">1</button><button onclick="setQuantity(2)">2</button><button onclick="setQuantity(5)">5</button><button onclick="setQuantity(10)">10</button></div></div><button id="scanMemberBtn" class="success" onclick="startMemberScanner()">📷 Scan Member QR</button><div id="memberPreview" class="hidden card"><div class="card-header"><img id="memberAvatar" src="" alt="Avatar"><div id="memberName"></div></div><div class="card-body"><div id="memberInfo"></div><button id="confirmStampBtn" class="success" onclick="confirmStamp()">✓ Confirm & Add Stamp</button></div></div><div class="manual-input-link"><a onclick="showManualStampInput()">Or paste QR token manually</a></div><div id="manualStampInput" class="hidden"><textarea id="memberToken" placeholder="Paste member QR token"></textarea><button onclick="processManualMemberToken()">Process Token</button></div></div><div id="redeemFlow" class="hidden"><h2>Redeem Coupon</h2><button id="scanCouponBtn" class="success" onclick="startCouponScanner()">📷 Scan Coupon QR</button><div id="couponPreview" class="hidden card"><div class="card-header" id="couponHeader"><h3 id="couponTitle"></h3></div><div class="card-body"><p id="couponDescription"></p><p id="couponExpiry"></p><p id="couponCode"></p><button id="confirmRedeemBtn" class="success" onclick="confirmRedeem()">✓ Confirm & Redeem</button></div></div><div class="manual-input-link"><a onclick="showManualCouponInput()">Or paste QR token manually</a></div><div id="manualCouponInput" class="hidden"><textarea id="couponToken" placeholder="Paste coupon QR token"></textarea><button onclick="processManualCouponToken()">Process Token</button></div></div><div id="resultBanner"></div></section>' : '<nav><button data-view="card">Member Card</button><button data-view="profile">Profile</button><button data-view="coupons">Coupons</button><button data-view="stamps">Stamp History</button><button data-view="rewards">Reward History</button><button onclick="logout()">Logout</button></nav><section id="content"></section><div id="modal" class="hidden"><div class="modal-content"><div class="modal-header"><button onclick="closeModal()" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.2);width:2rem;height:2rem;border-radius:50%;border:0;color:#fff;cursor:pointer;font-size:1.5rem;line-height:1">×</button><h3 id="modalTitle"></h3></div><div class="modal-body" id="modalBody"></div></div></div>'}
</main>
</div>
<div id="qr-shim" class="hidden"><div class="scanner-container"><div class="scanner-title" id="scannerTitle">Scanning QR Code...</div><div id="qr-reader"></div><div class="scanner-error hidden" id="scannerError"></div><button onclick="stopScanner()" style="margin-top:1rem" class="secondary">Cancel</button></div></div>
<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
<script>
const isStaff=${staff};
let token=localStorage.getItem(isStaff?'gcStaffToken':'gcMemberToken')||'';
let idempotencyKey=null;
let currentCoupon=null;
let qrTimer=null;
let currentSessionId=null;
let selectedQuantity=1;
let html5QrCode=null;
let scannedMemberInfo=null;

function showLoading(msg='Loading…'){return '<div class="loading">'+msg+'</div>'}
function showError(msg){return '<div class="error">⚠️ '+msg+'</div>'}
function showSuccess(msg){return '<div class="success">✓ '+msg+'</div>'}

async function api(path,opt={}){try{let r=await fetch(path,{...opt,headers:{...(opt.headers||{}),'Content-Type':'application/json',Authorization:'Bearer '+token}});let j=await r.json();if(!j.success)throw Error(j.message);return j.data}catch(e){if(e.message.includes('401')||e.message.includes('Session')){await logout();throw e}throw e}}

async function validateSession(){try{let path=isStaff?'/api/auth/staff-session':'/api/auth/session';await api(path);return true}catch(e){return false}}

async function logout(){
  localStorage.removeItem(isStaff?'gcStaffToken':'gcMemberToken');
  token='';
  if(!isStaff && typeof liff!=='undefined' && liff.isLoggedIn()){
    liff.logout();
  }
  location.reload()
}

async function open(){document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');if(!isStaff){setupNavigationButtons();view('card')}}

function formatCurrency(num){return new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(num||0)}
function formatDate(date){return new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
function formatDateTime(date){return new Date(date).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}

function incrementQuantity(){if(selectedQuantity<50){selectedQuantity++;updateQuantityDisplay()}}
function decrementQuantity(){if(selectedQuantity>1){selectedQuantity--;updateQuantityDisplay()}}
function setQuantity(qty){selectedQuantity=qty;updateQuantityDisplay()}
function updateQuantityDisplay(){document.getElementById('quantityDisplay').textContent=selectedQuantity}

function showManualStampInput(){document.getElementById('manualStampInput').classList.remove('hidden')}
function showManualCouponInput(){document.getElementById('manualCouponInput').classList.remove('hidden')}

function showScannerShim(title='Scanning QR Code...'){document.getElementById('scannerTitle').textContent=title;document.getElementById('scannerError').classList.add('hidden');document.getElementById('qr-shim').classList.remove('hidden')}
function hideScannerShim(){document.getElementById('qr-shim').classList.add('hidden')}

async function startMemberScanner(){try{showScannerShim('📷 Scan Member QR Code');await initScanner(onMemberQrScanned)}catch(e){hideScannerShim();showResultBanner('Camera error: '+e.message,'error');showManualStampInput()}}
async function startCouponScanner(){try{showScannerShim('📷 Scan Coupon QR Code');await initScanner(onCouponQrScanned)}catch(e){hideScannerShim();showResultBanner('Camera error: '+e.message,'error');showManualCouponInput()}}

async function initScanner(onSuccess){if(!html5QrCode){html5QrCode=new Html5Qrcode('qr-reader')}const config={fps:10,qrbox:{width:250,height:250},aspectRatio:1.0};let cameraId=null;try{const devices=await Html5Qrcode.getCameras();if(!devices||devices.length===0){throw Error('No camera found')}const backCamera=devices.find(d=>d.label.toLowerCase().includes('back')||d.label.toLowerCase().includes('rear'));cameraId=backCamera?backCamera.id:devices[devices.length-1].id}catch(e){cameraId=undefined}await html5QrCode.start(cameraId,config,onSuccess,onScanFailure)}
function stopScanner(){if(html5QrCode&&html5QrCode.isScanning){html5QrCode.stop().catch(err=>console.error('Stop error:',err))}hideScannerShim()}
function onScanFailure(error){}

function onMemberQrScanned(decodedText){stopScanner();processMemberToken(decodedText)}
function onCouponQrScanned(decodedText){stopScanner();processCouponToken(decodedText)}

async function processManualMemberToken(){const tokenInput=document.getElementById('memberToken');const qrToken=tokenInput.value.trim();if(!qrToken){showResultBanner('Please enter a QR token','error');return}await processMemberToken(qrToken)}
async function processManualCouponToken(){const tokenInput=document.getElementById('couponToken');const qrToken=tokenInput.value.trim();if(!qrToken){showResultBanner('Please enter a QR token','error');return}await processCouponToken(qrToken)}

async function processMemberToken(qrToken){try{const scan=await api('/api/stamp/scan',{method:'POST',body:JSON.stringify({qrToken})});scannedMemberInfo=scan;document.getElementById('memberAvatar').src=scan.picture_url||'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%238d6e63" width="100" height="100"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">'+(scan.display_name||'M').charAt(0)+'</text></svg>';document.getElementById('memberName').textContent=scan.display_name||'Member';document.getElementById('memberInfo').innerHTML='<p><strong>Member UID:</strong> '+scan.member_uid+'</p><p><strong>Current Stamps:</strong> '+scan.current_stamps+'</p><p><strong>Total Earned:</strong> '+scan.total_stamps_earned+'</p><p><strong>Adding:</strong> '+selectedQuantity+' stamp(s)</p>';document.getElementById('memberPreview').classList.remove('hidden');idempotencyKey=crypto.randomUUID()}catch(e){showResultBanner(e.message,'error')}}
async function processCouponToken(qrToken){try{currentCoupon=await api('/api/coupon/resolve',{method:'POST',body:JSON.stringify({qrToken})});const statusClass=['unused','used','expired','cancelled'].includes(currentCoupon.status)?currentCoupon.status:'unused';document.getElementById('couponHeader').className='card-header '+statusClass;document.getElementById('couponTitle').textContent=currentCoupon.title;document.getElementById('couponDescription').textContent=currentCoupon.description||'';document.getElementById('couponExpiry').textContent='Expires: '+formatDate(currentCoupon.expires_at);document.getElementById('couponCode').textContent='Code: '+currentCoupon.code;if(currentCoupon.status==='unused'){document.getElementById('confirmRedeemBtn').classList.remove('hidden')}else{document.getElementById('confirmRedeemBtn').classList.add('hidden');showResultBanner('This coupon cannot be redeemed (status: '+currentCoupon.status+')','error')}document.getElementById('couponPreview').classList.remove('hidden')}catch(e){showResultBanner(e.message,'error')}}

async function confirmStamp(){const btn=document.getElementById('confirmStampBtn');try{if(!scannedMemberInfo){showResultBanner('No member scanned. Please scan a member QR code first.','error');return}btn.disabled=true;btn.textContent='Adding Stamp…';const result=await api('/api/stamp/add',{method:'POST',body:JSON.stringify({memberUid:scannedMemberInfo.member_uid,drinkQuantity:selectedQuantity,idempotencyKey:idempotencyKey})});showResultBanner('✓ Added '+result.stamps_earned+' stamp(s). Member now has '+result.new_stamp_count+' stamps.','success');if(result.newCoupons&&result.newCoupons.length>0){const couponNames=result.newCoupons.map(c=>c.title).join(', ');setTimeout(()=>showResultBanner('🎉 Member earned a reward coupon: '+couponNames,'success'),1500)}document.getElementById('memberToken').value='';document.getElementById('memberPreview').classList.add('hidden');selectedQuantity=1;updateQuantityDisplay();btn.disabled=false;btn.textContent='✓ Confirm & Add Stamp';idempotencyKey=null;scannedMemberInfo=null}catch(e){btn.disabled=false;btn.textContent='✓ Confirm & Add Stamp';showResultBanner(e.message,'error')}}
async function confirmRedeem(){const btn=document.getElementById('confirmRedeemBtn');try{btn.disabled=true;btn.textContent='Redeeming…';const result=await api('/api/coupon/redeem',{method:'POST',body:JSON.stringify({code:currentCoupon.code,sessionId:currentCoupon.sessionId||null})});showResultBanner('✓ Coupon redeemed successfully!','success');document.getElementById('couponToken').value='';document.getElementById('couponPreview').classList.add('hidden');document.getElementById('confirmRedeemBtn').classList.add('hidden');btn.disabled=false;btn.textContent='✓ Confirm & Redeem';currentCoupon=null}catch(e){btn.disabled=false;btn.textContent='✓ Confirm & Redeem';showResultBanner(e.message,'error')}}

function showResultBanner(msg,type){const banner=document.getElementById('resultBanner');banner.innerHTML='<div class="banner" style="background:'+((type==='success')?'#2e7d32':'#c62828')+'">'+msg+'</div>';setTimeout(()=>{banner.innerHTML=''},5000)}

function renderMemberCard(data) { const currentCycle = data.currentStamps % 10; const remaining = currentCycle === 0 ? 10 : 10 - currentCycle; return '<div class="card">' + '<div class="card-header">' + (data.pictureUrl ? '<img src="' + data.pictureUrl + '" alt="' + data.displayName + '">' : '') + '<h2>' + data.displayName + '</h2>' + '</div>' + '<div class="card-body">' + '<div class="stamp-progress" style="margin-bottom:1.5rem">' + '<div style="text-align:center;margin-bottom:1rem">' + '<span style="font-size:2rem;font-weight:bold;color:#5b3a29">' + data.currentStamps + '</span>' + '<span style="font-size:1.2rem;color:#8d6e63"> / 10 stamps</span>' + '</div>' + '<div class="stamp-dots">' + Array.from({ length: 10 }, (_, i) => '<div class="stamp-dot ' + (i < currentCycle ? 'filled' : '') + '">' + (i < currentCycle ? "☕" : "") + '</div>' ).join('') + '</div>' + '<p style="text-align:center;font-size:0.9rem;color:#8d6e63;margin-top:1rem">' + remaining + ' more stamp(s) until your next reward' + '</p>' + '</div>' + '<div class="stats">' + '<div class="stat">' + '<div class="stat-value">' + data.points + '</div>' + '<div class="stat-label">Points</div>' + '</div>' + '<div class="stat">' + '<div class="stat-value">' + data.availableRewards + '</div>' + '<div class="stat-label">Rewards Available</div>' + '</div>' + '</div>' + '<p style="font-size:.85rem;color:#8d6e63;margin:1rem 0">' + 'Member since: ' + formatDate(data.memberSince) + '<br>Member UID: ' + data.memberUid + '</p>' + '<div class="qr-container">' + '<h3>Your Member QR</h3>' + '<img src="' + data.qrCode + '" alt="Member QR Code">' + '</div>' + '</div>' + '</div>'; }
function renderProfile(data){const birthdayValue=data.birthday?new Date(data.birthday).toISOString().split('T')[0]:'';return '<div class="card"><div class="card-header"><h2>Profile</h2></div><div class="card-body"><form id="profileForm"><div class="form-group"><label>Display Name</label><input value="'+data.display_name+'" disabled></div><div class="form-group"><label>Phone</label><input id="phone" type="tel" value="'+(data.phone||'')+'" placeholder="Enter phone number"></div><div class="form-group"><label>Birthday</label><input id="birthday" type="date" value="'+birthdayValue+'"></div><button type="submit" id="saveProfileBtn">Save Changes</button></form><p id="profileMessage"></p></div></div>'}
function renderCoupons(data){if(!data||data.length===0)return '<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65A2.996 2.996 0 0 0 7 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4V8h16v11z"/></svg><h3>No Coupons Yet</h3><p>Collect 10 stamps to get your first reward coupon!</p></div>';return data.map(function(c){return '<div class="coupon-card '+c.status+'"'+(c.status==='unused'?' data-code="'+c.code+'"':'')+'><div class="coupon-header '+c.status+'"><h3>'+c.title+'</h3><small>'+(c.type||'').toUpperCase()+'</small></div><div class="coupon-body"><div class="coupon-title">'+(c.description||'')+'</div><div class="coupon-meta">Status: '+(c.status||'').toUpperCase()+'<br>Expires: '+formatDate(c.expires_at)+'<br>Code: '+c.code+'</div></div></div>'}).join('')}
function renderStampHistory(data){if(!data||!data.items||data.items.length===0)return '<div class="empty-state"><h3>No Stamp History</h3><p>Start collecting stamps today!</p></div>';return '<div class="card"><div class="card-body">'+data.items.map(s=>'<div style="border-bottom:1px solid #eee;padding:.75rem 0"><strong>+'+s.stamps_earned+' stamps</strong><br><small>'+formatDateTime(s.created_at)+'</small></div>').join('')+'</div></div>'}
function renderRewardHistory(data){if(!data||!data.items||data.items.length===0)return '<div class="empty-state"><h3>No Reward History</h3><p>Redeem your first reward coupon!</p></div>';return '<div class="card"><div class="card-body">'+data.items.map(r=>'<div style="border-bottom:1px solid #eee;padding:.75rem 0"><strong>'+r.title+'</strong><br><small>'+r.stamps_used+' stamps • '+formatDateTime(r.created_at)+'</small></div>').join('')+'</div></div>'}

async function view(name){const content=document.getElementById('content');content.innerHTML=showLoading();try{const paths={card:'/api/member/card',profile:'/api/member/profile',coupons:'/api/member/coupons',stamps:'/api/member/stamps/history',rewards:'/api/member/rewards/history'};const data=await api(paths[name]);const renderers={card:renderMemberCard,profile:renderProfile,coupons:renderCoupons,stamps:renderStampHistory,rewards:renderRewardHistory};content.innerHTML=renderers[name](data);if(name==='profile')setupProfileForm();if(name==='coupons')setupCouponClickHandlers()}catch(e){content.innerHTML=showError(e.message)}}

async function showCouponQR(code){try{clearQrTimer();const data=await api('/api/member/coupons/'+code+'/qr-session',{method:'POST'});currentSessionId=data.sessionId;document.getElementById('modalTitle').textContent=data.coupon.title;renderQrSession(data);document.getElementById('modal').classList.remove('hidden')}catch(e){alert('Failed to generate QR: '+e.message)}}
function renderQrSession(data){const expiresAt=new Date(data.expiresAt);const now=new Date();const remaining=Math.max(0,Math.floor((expiresAt-now)/1000));const minutes=Math.floor(remaining/60);const seconds=remaining%60;const timeStr=minutes.toString().padStart(2,'0')+':'+seconds.toString().padStart(2,'0');document.getElementById('modalBody').innerHTML='<div class="qr-container"><img src="'+data.qrCode+'" alt="Coupon QR"></div><div class="countdown" id="qrCountdown">'+timeStr+'</div><p style="text-align:center;font-size:.85rem;color:#8d6e63;margin-top:.5rem">QR expires in '+data.expiresIn/60+' minutes</p><div style="text-align:center;margin-top:1rem"><p><strong>'+data.coupon.title+'</strong></p><p>'+(data.coupon.description||'')+'</p><p><small>Expires: '+formatDate(data.coupon.expires_at)+'</small></p></div>';if(remaining>0){qrTimer=setInterval(()=>updateCountdown(expiresAt),1000)}}
function updateCountdown(expiresAt){const now=new Date();const remaining=Math.max(0,Math.floor((expiresAt-now)/1000));if(remaining===0){clearQrTimer();document.getElementById('qrCountdown').textContent='00:00';document.getElementById('qrCountdown').classList.add('expired');const modalBody=document.getElementById('modalBody');modalBody.innerHTML+='<div class="error" style="margin-top:1rem">QR has expired. <button onclick="regenerateQr()" class="secondary" style="width:auto;margin:0">Generate New QR</button></div>'}else{const minutes=Math.floor(remaining/60);const seconds=remaining%60;const timeStr=minutes.toString().padStart(2,'0')+':'+seconds.toString().padStart(2,'0');document.getElementById('qrCountdown').textContent=timeStr}}
function clearQrTimer(){if(qrTimer){clearInterval(qrTimer);qrTimer=null}}
async function regenerateQr(){if(!currentCoupon)return;clearQrTimer();document.getElementById('modalBody').innerHTML=showLoading('Generating new QR...');await showCouponQR(currentCoupon.code)}
function closeModal(){clearQrTimer();currentSessionId=null;document.getElementById('modal').classList.add('hidden')}

async function setupProfileForm(){const form=document.getElementById('profileForm');const btn=document.getElementById('saveProfileBtn');const msg=document.getElementById('profileMessage');form.onsubmit=async e=>{e.preventDefault();btn.disabled=true;btn.textContent='Saving…';try{const phone=document.getElementById('phone').value.trim();const birthday=document.getElementById('birthday').value;await api('/api/member/profile',{method:'PUT',body:JSON.stringify({phone,birthday})});msg.className='success';msg.textContent='✓ Profile updated successfully!'}catch(e){msg.className='error';msg.textContent='⚠️ '+e.message}finally{btn.disabled=false;btn.textContent='Save Changes'}}}
function setupNavigationButtons(){document.querySelectorAll('[data-view]').forEach(function(btn){btn.addEventListener('click',function(){view(this.dataset.view)})})}
function setupCouponClickHandlers(){document.querySelectorAll('.coupon-card.unused').forEach(function(card){card.addEventListener('click',function(){var code=this.getAttribute('data-code');if(code){currentCoupon={code:code};showCouponQR(code)}})})}

async function showStampFlow(){document.getElementById('stampFlow').classList.remove('hidden');document.getElementById('redeemFlow').classList.add('hidden')}
async function showRedeemFlow(){document.getElementById('redeemFlow').classList.remove('hidden');document.getElementById('stampFlow').classList.add('hidden')}

if(isStaff){document.getElementById('signInBtn').onclick=async()=>{const btn=document.getElementById('signInBtn');const err=document.getElementById('loginError');try{btn.disabled=true;btn.textContent='Signing in…';err.classList.add('hidden');const data=await api('/api/auth/staff-login',{method:'POST',headers:{},body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});token=data.token;localStorage.setItem('gcStaffToken',token);if(await validateSession()){open()}else{throw Error('Session validation failed')}}catch(e){err.textContent=e.message;err.classList.remove('hidden');btn.disabled=false;btn.textContent='Sign In'}};if(token)validateSession().then(valid=>valid?open():logout())}else{(async()=>{try{await liff.init({liffId:'${liffId}'});if(!liff.isLoggedIn()){liff.login();return}const data=await api('/api/auth/line-login',{method:'POST',headers:{},body:JSON.stringify({idToken:liff.getIDToken()})});token=data.token;localStorage.setItem('gcMemberToken',token);if(await validateSession()){open()}else{throw Error('Session validation failed')}}catch(e){const isLineSessionError=e.message.includes('Invalid or expired LINE login session')||e.message.includes('401');if(isLineSessionError){localStorage.removeItem('gcMemberToken');if(liff.isLoggedIn()){liff.logout()}liff.login()}else{document.getElementById('status').textContent=e.message}}})()}
</script></body></html>`;
}
module.exports = { memberLiffPage: (liffId) => page({ title: 'Grandfa Cafe Membership', liffId }), staffLiffPage: (liffId) => page({ title: 'Grandfa Cafe Staff', liffId, staff: true }) };