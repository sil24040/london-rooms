let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');
let currentRoomId = null;
let currentRooms = [];
let currentView = 'list';
let browseMap = null;
let browseMarkers = [];
let detailMap = null;
let currentPage = 1;
let totalPages = 1;
let compareIds = new Set();
let editingRoomId = null;
let replyEnquiryId = null;
let myRentalRoomId = null;
let rentalPayments = [];

async function api(method, path, body, isForm) {
  const opts = { method, headers: {} };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) {
    if (isForm) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function toggleMenu(){
  document.getElementById('navlinks').classList.toggle('open');
}

function showPage(name) {
  document.getElementById('navlinks').classList.remove('open');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.navlinks button').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + name);
  if (nb) nb.classList.add('active');
  if (name === 'browse') loadRooms();
  if (name === 'saved') loadSaved();
  if (name === 'dashboard') loadDashboard();
  if (name === 'profile') loadProfile();
}

function updateNav() {
  const li = !!user;
  document.getElementById('btn-login').style.display = li ? 'none' : '';
  document.getElementById('btn-register').style.display = li ? 'none' : '';
  document.getElementById('btn-logout').style.display = li ? '' : 'none';
  document.getElementById('nav-saved').style.display = (li && user.role === 'tenant') ? '' : 'none';
  document.getElementById('nav-dash').style.display = li ? '' : 'none';
  document.getElementById('nav-profile').style.display = li ? '' : 'none';
  document.getElementById('nav-user').textContent = li ? t('hi') + ', ' + user.name.split(' ')[0] : '';
}

function saveAuth(d) {
  token = d.token; user = d.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateNav();
}
function logout() {
  token = null; user = null;
  localStorage.removeItem('token'); localStorage.removeItem('user');
  updateNav(); showPage('browse');
}

function clearFieldErrors(ids){ ids.forEach(id => { const el = document.getElementById(id); if(el){ el.style.display='none'; el.textContent=''; } }); }
function setFieldError(id, msg){ const el = document.getElementById(id); el.textContent = msg; el.style.display=''; }

// ── AUTH ──
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');
  err.style.display = 'none';
  clearFieldErrors(['login-email-err','login-pw-err']);

  let valid = true;
  if (!email || !email.includes('@')) { setFieldError('login-email-err','Enter a valid email'); valid=false; }
  if (!password) { setFieldError('login-pw-err','Password is required'); valid=false; }
  if (!valid) return;

  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const d = await api('POST','/auth/login',{email,password});
    saveAuth(d); showPage('browse');
  } catch(e) { err.textContent = e.message; err.style.display=''; }
  finally { btn.disabled=false; btn.textContent=t('signIn'); }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.querySelector('input[name="reg-role"]:checked').value;
  const err = document.getElementById('register-error');
  err.style.display = 'none';
  clearFieldErrors(['reg-name-err','reg-email-err','reg-pw-err']);

  let valid = true;
  if (!name) { setFieldError('reg-name-err','Name is required'); valid=false; }
  if (!email || !email.includes('@')) { setFieldError('reg-email-err','Enter a valid email'); valid=false; }
  if (password.length < 8) { setFieldError('reg-pw-err','At least 8 characters'); valid=false; }
  if (!valid) return;

  const btn = document.getElementById('register-btn');
  btn.disabled = true; btn.textContent = 'Creating...';
  try {
    const d = await api('POST','/auth/register',{name,email,password,role});
    saveAuth(d); showPage('browse');
  } catch(e) { err.textContent = e.message; err.style.display=''; }
  finally { btn.disabled=false; btn.textContent='Create account'; }
}

// ── PROFILE ──
function loadProfile() {
  if (!user) { showPage('login'); return; }
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email || '';
  document.getElementById('profile-role').value = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.getElementById('profile-current-pw').value = '';
  document.getElementById('profile-new-pw').value = '';
  document.getElementById('profile-error').style.display='none';
  document.getElementById('profile-success').style.display='none';
}

async function doUpdateProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const currentPassword = document.getElementById('profile-current-pw').value;
  const newPassword = document.getElementById('profile-new-pw').value;
  const errBox = document.getElementById('profile-error');
  const okBox = document.getElementById('profile-success');
  errBox.style.display='none'; okBox.style.display='none';
  clearFieldErrors(['profile-name-err','profile-email-err','profile-pw-err']);

  let valid = true;
  if (!name) { setFieldError('profile-name-err','Name is required'); valid=false; }
  if (!email || !email.includes('@')) { setFieldError('profile-email-err','Enter a valid email'); valid=false; }
  if (newPassword && newPassword.length < 8) { setFieldError('profile-pw-err','New password must be at least 8 characters'); valid=false; }
  if (!valid) return;

  const btn = document.getElementById('profile-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const d = await api('PUT','/auth/profile',{name,email,currentPassword,newPassword});
    saveAuth(d);
    okBox.style.display='';
    document.getElementById('profile-current-pw').value='';
    document.getElementById('profile-new-pw').value='';
  } catch(e) { errBox.textContent = e.message; errBox.style.display=''; }
  finally { btn.disabled=false; btn.textContent='Save changes'; }
}

// ── BROWSE / ROOMS ──
function onFilterChange() { currentPage = 1; loadRooms(); }

async function loadRooms() {
  const params = new URLSearchParams();
  const search = document.getElementById('search-input').value.trim();
  const price = document.getElementById('f-price').value;
  const type = document.getElementById('f-type').value;
  const bills = document.getElementById('f-bills').checked;
  const avail = document.getElementById('f-avail').checked;
  const sort = document.getElementById('f-sort').value;
  if (search) params.set('search', search);
  if (price) params.set('maxPrice', price);
  if (type) params.set('type', type);
  if (bills) params.set('billsIncluded','true');
  if (avail) params.set('availableNow','true');
  if (sort) params.set('sort', sort);
  params.set('page', currentPage);
  params.set('limit', 6);

  document.getElementById('rooms-loading').style.display='';
  document.getElementById('rooms-grid').style.display='none';
  document.getElementById('rooms-map-wrap').style.display='none';
  document.getElementById('rooms-empty').style.display='none';
  document.getElementById('pagination').style.display='none';

  try {
    const res = await api('GET','/rooms?'+params);
    currentRooms = res.items;
    totalPages = res.totalPages;
    document.getElementById('result-count').textContent = res.total + (res.total === 1 ? ' '+t('room') : ' '+t('rooms'));
    document.getElementById('rooms-loading').style.display='none';
    if (!res.items.length) { document.getElementById('rooms-empty').style.display=''; return; }
    renderView();
    renderPagination();
  } catch(e) {
    document.getElementById('rooms-loading').style.display='none';
    document.getElementById('rooms-grid').innerHTML = '<div class="alert alert-error">'+e.message+'</div>';
    document.getElementById('rooms-grid').style.display='';
  }
}

function renderPagination() {
  const el = document.getElementById('pagination');
  if (totalPages <= 1 || currentView !== 'list') { el.style.display='none'; return; }
  el.style.display='flex';
  el.innerHTML = `
    <button class="btn btn-outline btn-sm" ${currentPage<=1?'disabled':''} onclick="goPage(${currentPage-1})">← Prev</button>
    <span>Page ${currentPage} of ${totalPages}</span>
    <button class="btn btn-outline btn-sm" ${currentPage>=totalPages?'disabled':''} onclick="goPage(${currentPage+1})">Next →</button>
  `;
}
function goPage(p) {
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  loadRooms();
  window.scrollTo({top:0, behavior:'smooth'});
}

function setView(view) {
  currentView = view;
  document.getElementById('view-list-btn').classList.toggle('active', view==='list');
  document.getElementById('view-map-btn').classList.toggle('active', view==='map');
  renderView();
  renderPagination();
}

function renderView() {
  if (!currentRooms.length) return;
  if (currentView === 'list') {
    document.getElementById('rooms-map-wrap').style.display='none';
    document.getElementById('rooms-grid').style.display='';
    document.getElementById('rooms-grid').innerHTML = currentRooms.map(renderCard).join('');
  } else {
    document.getElementById('rooms-grid').style.display='none';
    document.getElementById('rooms-map-wrap').style.display='';
    document.getElementById('pagination').style.display='none';
    renderBrowseMap();
  }
}

function renderBrowseMap() {
  if (!browseMap) {
    browseMap = L.map('browse-map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
    }).addTo(browseMap);
  }
  browseMarkers.forEach(m => browseMap.removeLayer(m));
  browseMarkers = [];

  const pts = currentRooms.filter(r => r.lat && r.lng);
  pts.forEach(r => {
    const marker = L.marker([r.lat, r.lng]).addTo(browseMap);
    marker.bindPopup(`<b>£${r.price}/mo</b><br>${escapeHtml(r.title)}<br>${escapeHtml(r.area)}<br><button class="popup-view-btn" onclick="showDetail('${r._id}')">View room</button>`);
    browseMarkers.push(marker);
  });

  if (pts.length) {
    const bounds = L.latLngBounds(pts.map(r => [r.lat, r.lng]));
    browseMap.fitBounds(bounds, { padding: [30,30] });
  } else {
    browseMap.setView([51.509, -0.118], 11);
  }
  setTimeout(() => browseMap.invalidateSize(), 100);
}

function clearFilters(){
  document.getElementById('search-input').value='';
  document.getElementById('f-price').value='';
  document.getElementById('f-type').value='';
  document.getElementById('f-bills').checked=false;
  document.getElementById('f-avail').checked=false;
  document.getElementById('f-sort').value='newest';
  currentPage = 1;
  loadRooms();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderCard(r) {
  const img = r.image
    ? `<img class="card-img" src="${r.image}" alt="${escapeHtml(r.title)}">`
    : `<div class="card-img-ph">🏠</div>`;
  const checked = compareIds.has(r._id) ? 'checked' : '';
  return `<div class="card">
    <label class="compare-check"><input type="checkbox" ${checked} onchange="toggleCompare('${r._id}', this.checked)"> Compare</label>
    ${img}
    <h3>${escapeHtml(r.title)}</h3>
    <div class="price">£${r.price}<span style="font-size:12px;color:#666;font-weight:400"> /mo</span></div>
    <div class="area">${escapeHtml(r.address)}, ${escapeHtml(r.area)}</div>
    <div class="meta">${escapeHtml(r.type)} · ${r.billsIncluded ? t('billsInclLabel') : t('billsNotIncl')} ${r.availableNow ? '· <span class="badge badge-avail">Available now</span>' : ''}</div>
    <div class="desc">${escapeHtml(r.description)}</div>
    <div class="row">
      <span style="font-size:12px;color:#999">${escapeHtml(r.landlordName)}</span>
      <button class="btn btn-primary btn-sm" onclick="showDetail('${r._id}')">View</button>
    </div>
  </div>`;
}

// ── COMPARE ──
function toggleCompare(id, checked) {
  if (checked) {
    if (compareIds.size >= 4) {
      alert('You can compare up to 4 rooms at a time.');
      renderView();
      return;
    }
    compareIds.add(id);
  } else {
    compareIds.delete(id);
  }
  document.getElementById('compare-count').textContent = compareIds.size + ' selected';
  document.getElementById('compare-bar').classList.toggle('show', compareIds.size >= 2);
}
function clearCompare() {
  compareIds.clear();
  document.getElementById('compare-bar').classList.remove('show');
  renderView();
}
async function showCompare() {
  showPage('compare');
  const el = document.getElementById('compare-content');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const rooms = await api('POST','/rooms/compare',{ids:[...compareIds]});
    const rows = [
      ['Photo', r => r.image ? `<img src="${r.image}" style="width:100px;height:70px;object-fit:cover;border-radius:6px">` : '—'],
      ['Title', r => escapeHtml(r.title)],
      ['Price', r => '£'+r.price+'/mo'],
      ['Type', r => escapeHtml(r.type)],
      ['Area', r => escapeHtml(r.area)],
      ['Address', r => escapeHtml(r.address)],
      ['Bills included', r => r.billsIncluded ? 'Yes' : 'No'],
      ['Available now', r => r.availableNow ? 'Yes' : 'No'],
      ['Landlord', r => escapeHtml(r.landlordName)],
      ['', r => `<button class="btn btn-primary btn-sm" onclick="showDetail('${r._id}')">View room</button>`],
    ];
    let html = '<table class="compare-table"><tbody>';
    rows.forEach(([label, fn]) => {
      html += `<tr><th>${label}</th>` + rooms.map(r => `<td>${fn(r)}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

// ── DETAIL ──
async function showDetail(id) {
  currentRoomId = id;
  showPage('detail');
  document.getElementById('detail-content').innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  detailMap = null;
  if (user && user.role === 'tenant') {
    try {
      const rental = await api('GET','/rental/mine');
      myRentalRoomId = rental.room ? rental.room._id : null;
    } catch { myRentalRoomId = null; }
  }
  try {
    const r = await api('GET','/rooms/'+id);
    const img = r.image ? `<img src="${r.image}" alt="${escapeHtml(r.title)}" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin-bottom:1rem">` : '';
    document.getElementById('detail-content').innerHTML = `
      ${img}
      <div class="price" style="font-size:24px">£${r.price}<span style="font-size:14px;color:#666;font-weight:400"> /month</span></div>
      <h2 style="margin:6px 0">${escapeHtml(r.title)}</h2>
      <p style="color:#666;margin-bottom:1rem">${escapeHtml(r.address)}, ${escapeHtml(r.area)}</p>
      <p style="margin-bottom:1rem">${escapeHtml(r.description)}</p>
      <p class="meta" style="margin-bottom:1rem">${escapeHtml(r.type)} · ${r.billsIncluded?t('billsIncluded'):t('billsNotIncluded')} · ${r.availableNow?t('availNow'):t('comingSoon')}</p>
      ${r.lat && r.lng ? '<div id="detail-map" style="margin-bottom:1rem"></div>' : ''}
      <div class="card" style="max-width:400px">
        <h3>Contact ${escapeHtml(r.landlordName)}</h3>
        ${!user ? `<p style="margin:8px 0;color:#666">Sign in to send an enquiry</p><button class="btn btn-primary" style="width:100%" onclick="showPage('login')">Sign in</button>`
        : user.role==='landlord' ? `<p style="margin:8px 0;color:#666">You're viewing this as a landlord.</p>`
        : `<button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="openEnquiry('${r._id}','${escapeHtml(r.title).replace(/'/g,"\\'")}')">Send enquiry</button>
           <button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="setMyRental('${r._id}')">${myRentalRoomId===r._id ? t('thisIsMyRoom') : t('markAsMyRoom')}</button>`}
      </div>`;

    if (r.lat && r.lng) {
      setTimeout(() => {
        detailMap = L.map('detail-map').setView([r.lat, r.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
        }).addTo(detailMap);
        L.marker([r.lat, r.lng]).addTo(detailMap).bindPopup(`<b>${escapeHtml(r.title)}</b><br>${escapeHtml(r.area)}`).openPopup();
        detailMap.invalidateSize();
      }, 50);
    }
  } catch(e) { document.getElementById('detail-content').innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}


async function setMyRental(roomId) {
  try {
    const newId = myRentalRoomId === roomId ? null : roomId;
    await api('POST','/rental/set',{roomId:newId});
    myRentalRoomId = newId;
    showDetail(roomId);
  } catch(e) { alert(e.message); }
}

// ── SAVED ──
async function loadSaved() {
  const el = document.getElementById('saved-list');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const rooms = await api('GET','/rooms/saved');
    el.innerHTML = !rooms.length
      ? '<div class="empty"><span class="icon">💙</span><p style="font-weight:600">No saved rooms yet</p><p style="font-size:13px;margin-top:4px">Browse rooms and tap View to find your favourites</p></div>'
      : '<div class="grid">'+rooms.map(renderCard).join('')+'</div>';
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

// ── DASHBOARD ──
async function loadDashboard() {
  if (!user) { showPage('login'); return; }
  document.getElementById('dash-title').textContent = t('welcomeBack') + ', ' + user.name;
  document.getElementById('dash-sub').textContent = user.role === 'landlord' ? t('landlordDashboard') : t('tenantDashboard');
  if (user.role === 'landlord') {
    document.getElementById('tenant-dash').style.display='none';
    document.getElementById('landlord-dash').style.display='';
    loadLandlordRooms(); loadLandlordEnquiries();
  } else {
    document.getElementById('tenant-dash').style.display='';
    document.getElementById('landlord-dash').style.display='none';
    loadTenantEnquiries();
    loadMyRental();
  }
}

function switchLandlordTab(tab) {
  document.getElementById('tab-listings').classList.toggle('active', tab==='listings');
  document.getElementById('tab-enquiries').classList.toggle('active', tab==='enquiries');
  document.getElementById('landlord-listings-tab').style.display = tab==='listings' ? '' : 'none';
  document.getElementById('landlord-enquiries-tab').style.display = tab==='enquiries' ? '' : 'none';
}

async function loadTenantEnquiries() {
  const el = document.getElementById('tenant-enquiries');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const list = await api('GET','/enquiries/mine');
    el.innerHTML = !list.length ? '<div class="empty"><span class="icon">✉️</span><p>'+t('noEnquiries')+'</p></div>' : list.map(e=>`
      <div class="card" style="margin-bottom:8px">
        <strong>${escapeHtml(e.roomTitle)}</strong>
        <div class="meta">${escapeHtml(e.roomArea)} · £${e.roomPrice}/mo · To: ${escapeHtml(e.landlordName)}</div>
        <div style="font-size:13px;margin:6px 0" id="enq-msg-${e._id}">"${escapeHtml(e.message)}"</div>
        <div class="meta">${new Date(e.createdAt).toLocaleDateString('en-GB')} · <span class="badge ${e.status==='replied'?'badge-replied':'badge-avail'}">${e.status}</span></div>
        ${e.reply ? `<div style="margin-top:8px;padding:8px;background:#f5f5f3;border-radius:8px;font-size:13px"><strong>'+t('landlordReply')+'</strong><br>${escapeHtml(e.reply)}</div>` : ''}
        ${e.status !== 'replied' ? `
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn btn-outline btn-sm" onclick="openEditEnquiry('${e._id}','${escapeHtml(e.message).replace(/'/g,"\\'")}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEnquiry('${e._id}')">Delete</button>
        </div>` : ''}
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

async function loadLandlordRooms() {
  const el = document.getElementById('landlord-rooms');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const res = await api('GET','/rooms?sort=newest&limit=100');
    const mine = res.items.filter(r => r.landlordId === user._id);
    el.innerHTML = !mine.length
      ? '<div class="empty"><span class="icon">🏠</span><p style="font-weight:600">No rooms listed yet</p><p style="font-size:13px;margin:4px 0 12px">Add your first room to start receiving enquiries</p><button class="btn btn-primary btn-sm" onclick="openAddRoom()">+ Add room</button></div>'
      : mine.map(r=>`
      <div class="card" style="margin-bottom:8px">
        <div class="row">
          <div style="display:flex;gap:10px;align-items:center">
            ${r.image ? `<img src="${r.image}" style="width:60px;height:50px;object-fit:cover;border-radius:6px">` : ''}
            <div><strong>${escapeHtml(r.title)}</strong><div class="meta">${escapeHtml(r.area)} · £${r.price}/mo · ${r.availableNow ? 'Available now' : 'Coming soon'}</div></div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="openEditRoom('${r._id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRoom('${r._id}')">Delete</button>
          </div>
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

async function loadLandlordEnquiries() {
  const el = document.getElementById('landlord-enquiries');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const list = await api('GET','/enquiries/received');
    el.innerHTML = !list.length ? '<div class="empty"><span class="icon">📭</span><p>'+t('noEnquiriesReceived')+'</p></div>' : list.map(e=>`
      <div class="card" style="margin-bottom:8px">
        <strong>${escapeHtml(e.roomTitle)}</strong>
        <div class="meta">From: ${escapeHtml(e.tenantName)}</div>
        <div style="font-size:13px;margin:6px 0">"${escapeHtml(e.message)}"</div>
        <div class="meta">${new Date(e.createdAt).toLocaleDateString('en-GB')} · <span class="badge ${e.status==='replied'?'badge-replied':'badge-avail'}">${e.status}</span></div>
        ${e.reply ? `<div style="margin-top:8px;padding:8px;background:#f5f5f3;border-radius:8px;font-size:13px"><strong>'+t('yourReplyLabel')+'</strong><br>${escapeHtml(e.reply)}</div>` : `<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="openReply('${e._id}','${escapeHtml(e.roomTitle).replace(/'/g,"\\'")}','${escapeHtml(e.tenantName).replace(/'/g,"\\'")}')">Reply</button>`}
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

async function deleteRoom(id) {
  if (!confirm(t('delete'))) return;
  try { await api('DELETE','/rooms/'+id); loadLandlordRooms(); } catch(e){ alert(e.message); }
}

// ── ADD / EDIT ROOM ──
function previewImage(e) {
  const file = e.target.files[0];
  const img = document.getElementById('rm-img-preview');
  if (!file) { img.style.display='none'; return; }
  const reader = new FileReader();
  reader.onload = ev => { img.src = ev.target.result; img.style.display=''; };
  reader.readAsDataURL(file);
}

function openAddRoom(){
  editingRoomId = null;
  document.getElementById('room-modal-title').textContent = 'List a room';
  document.getElementById('add-room-btn').textContent = 'List room';
  document.getElementById('add-room-modal').classList.remove('hidden');
  document.getElementById('add-room-error').style.display='none';
  document.getElementById('rm-img-preview').style.display='none';
  document.getElementById('rm-remove-img-label').style.display='none';
  document.getElementById('rm-remove-image').checked=false;
  ['rm-title','rm-desc','rm-price','rm-area','rm-address'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('rm-type').value='Double';
  document.getElementById('rm-bills').checked=false;
  document.getElementById('rm-avail').checked=true;
  document.getElementById('rm-image').value='';
  clearFieldErrors(['rm-title-err','rm-desc-err','rm-price-err','rm-area-err','rm-address-err']);
}

async function openEditRoom(id) {
  try {
    const r = await api('GET','/rooms/'+id);
    editingRoomId = id;
    document.getElementById('room-modal-title').textContent = 'Edit room';
    document.getElementById('add-room-btn').textContent = 'Save changes';
    document.getElementById('add-room-modal').classList.remove('hidden');
    document.getElementById('add-room-error').style.display='none';
    clearFieldErrors(['rm-title-err','rm-desc-err','rm-price-err','rm-area-err','rm-address-err']);
    document.getElementById('rm-title').value = r.title;
    document.getElementById('rm-desc').value = r.description;
    document.getElementById('rm-price').value = r.price;
    document.getElementById('rm-type').value = r.type;
    document.getElementById('rm-area').value = r.area;
    document.getElementById('rm-address').value = r.address;
    document.getElementById('rm-bills').checked = r.billsIncluded;
    document.getElementById('rm-avail').checked = r.availableNow;
    document.getElementById('rm-image').value='';
    document.getElementById('rm-remove-image').checked=false;
    const img = document.getElementById('rm-img-preview');
    if (r.image) {
      img.src = r.image; img.style.display='';
      document.getElementById('rm-remove-img-label').style.display='';
    } else {
      img.style.display='none';
      document.getElementById('rm-remove-img-label').style.display='none';
    }
  } catch(e) { alert(e.message); }
}

function closeAddRoom(){ document.getElementById('add-room-modal').classList.add('hidden'); }

async function doSaveRoom() {
  const title=document.getElementById('rm-title').value.trim();
  const description=document.getElementById('rm-desc').value.trim();
  const price=document.getElementById('rm-price').value;
  const type=document.getElementById('rm-type').value;
  const area=document.getElementById('rm-area').value.trim();
  const address=document.getElementById('rm-address').value.trim();
  const billsIncluded=document.getElementById('rm-bills').checked;
  const availableNow=document.getElementById('rm-avail').checked;
  const imageFile=document.getElementById('rm-image').files[0];
  const removeImage=document.getElementById('rm-remove-image').checked;
  const err=document.getElementById('add-room-error');
  err.style.display='none';
  clearFieldErrors(['rm-title-err','rm-desc-err','rm-price-err','rm-area-err','rm-address-err']);

  let valid = true;
  if (!title) { setFieldError('rm-title-err','Title is required'); valid=false; }
  if (!description || description.length < 10) { setFieldError('rm-desc-err','Description must be at least 10 characters'); valid=false; }
  if (!price || Number(price) <= 0) { setFieldError('rm-price-err','Enter a valid price'); valid=false; }
  if (!area) { setFieldError('rm-area-err','Area is required'); valid=false; }
  if (!address) { setFieldError('rm-address-err','Address is required'); valid=false; }
  if (!valid) return;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('type', type);
  formData.append('area', area);
  formData.append('address', address);
  formData.append('billsIncluded', billsIncluded);
  formData.append('availableNow', availableNow);
  if (imageFile) formData.append('image', imageFile);
  if (removeImage) formData.append('removeImage', 'true');

  const btn=document.getElementById('add-room-btn');
  btn.disabled=true; btn.textContent = editingRoomId ? 'Saving...' : 'Adding...';
  try {
    if (editingRoomId) {
      await api('PUT','/rooms/'+editingRoomId, formData, true);
    } else {
      await api('POST','/rooms', formData, true);
    }
    closeAddRoom();
    loadLandlordRooms();
  } catch(e){ err.textContent=e.message; err.style.display=''; }
  finally { btn.disabled=false; btn.textContent = editingRoomId ? 'Save changes' : 'List room'; }
}

// ── ENQUIRY ──
function openEnquiry(roomId, title) {
  currentRoomId = roomId;
  document.getElementById('enquiry-room-title').textContent = title;
  document.getElementById('enquiry-msg').value='';
  document.getElementById('enquiry-success').style.display='none';
  document.getElementById('enquiry-error').style.display='none';
  document.getElementById('enquiry-msg-err').style.display='none';
  document.getElementById('enquiry-form-wrap').style.display='';
  document.getElementById('enquiry-btn').style.display='';
  document.getElementById('enquiry-modal').classList.remove('hidden');
}
function closeEnquiry(){ document.getElementById('enquiry-modal').classList.add('hidden'); }

async function doEnquiry() {
  const msg = document.getElementById('enquiry-msg').value.trim();
  document.getElementById('enquiry-msg-err').style.display='none';
  document.getElementById('enquiry-error').style.display='none';
  if (msg.length < 5) { setFieldError('enquiry-msg-err','Message must be at least 5 characters'); return; }
  const btn = document.getElementById('enquiry-btn');
  btn.disabled=true; btn.textContent='Sending...';
  try {
    await api('POST','/enquiries/'+currentRoomId,{message:msg});
    document.getElementById('enquiry-success').style.display='';
    document.getElementById('enquiry-form-wrap').style.display='none';
    document.getElementById('enquiry-btn').style.display='none';
  } catch(e){ document.getElementById('enquiry-error').textContent=e.message; document.getElementById('enquiry-error').style.display=''; }
  finally { btn.disabled=false; btn.textContent='Send'; }
}


// ── ENQUIRY EDIT / DELETE ──
let editingEnquiryId = null;

function openEditEnquiry(id, currentMsg) {
  editingEnquiryId = id;
  document.getElementById('edit-enq-msg').value = currentMsg;
  document.getElementById('edit-enq-error').style.display='none';
  document.getElementById('edit-enq-msg-err').style.display='none';
  document.getElementById('edit-enq-modal').classList.remove('hidden');
}
function closeEditEnquiry() {
  document.getElementById('edit-enq-modal').classList.add('hidden');
}

async function doEditEnquiry() {
  const message = document.getElementById('edit-enq-msg').value.trim();
  document.getElementById('edit-enq-error').style.display='none';
  document.getElementById('edit-enq-msg-err').style.display='none';
  if (message.length < 5) { setFieldError('edit-enq-msg-err','Message must be at least 5 characters'); return; }

  const btn = document.getElementById('edit-enq-btn');
  btn.disabled=true; btn.textContent='Saving...';
  try {
    await api('PUT','/enquiries/'+editingEnquiryId,{message});
    closeEditEnquiry();
    loadTenantEnquiries();
  } catch(e) {
    document.getElementById('edit-enq-error').textContent = e.message;
    document.getElementById('edit-enq-error').style.display='';
  } finally { btn.disabled=false; btn.textContent='Save changes'; }
}

async function deleteEnquiry(id) {
  if (!confirm(t('deleteEnquiry'))) return;
  try {
    await api('DELETE','/enquiries/'+id);
    loadTenantEnquiries();
  } catch(e) { alert(e.message); }
}

// ── REPLY ──
function openReply(enquiryId, roomTitle, tenantName) {
  replyEnquiryId = enquiryId;
  document.getElementById('reply-context').textContent = `Re: "${roomTitle}" — to ${tenantName}`;
  document.getElementById('reply-msg').value='';
  document.getElementById('reply-error').style.display='none';
  document.getElementById('reply-msg-err').style.display='none';
  document.getElementById('reply-modal').classList.remove('hidden');
}
function closeReply(){ document.getElementById('reply-modal').classList.add('hidden'); }

async function doReply() {
  const msg = document.getElementById('reply-msg').value.trim();
  document.getElementById('reply-msg-err').style.display='none';
  document.getElementById('reply-error').style.display='none';
  if (msg.length < 2) { setFieldError('reply-msg-err','Reply is too short'); return; }
  const btn = document.getElementById('reply-btn');
  btn.disabled=true; btn.textContent='Sending...';
  try {
    await api('POST','/enquiries/'+replyEnquiryId+'/reply',{reply:msg});
    closeReply();
    loadLandlordEnquiries();
  } catch(e){ document.getElementById('reply-error').textContent=e.message; document.getElementById('reply-error').style.display=''; }
  finally { btn.disabled=false; btn.textContent='Send reply'; }
}

document.getElementById('add-room-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeAddRoom(); });
document.getElementById('enquiry-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeEnquiry(); });
document.getElementById('reply-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeReply(); });

updateNav();
applyTranslations();
// Apply saved language
if (localStorage.getItem('lang')) { currentLang = localStorage.getItem('lang'); document.getElementById('lang-'+currentLang).classList.add('active'); if(currentLang!=='en') document.getElementById('lang-en').classList.remove('active'); }
loadRooms();

// ── MY RENTAL / PAYMENTS ──
// MONTHS is now from i18n: t('months')

async function loadMyRental() {
  const el = document.getElementById('my-rental-section');
  if (!el) return;
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const data = await api('GET','/rental/mine');
    if (!data.room) {
      el.innerHTML = '<div class="empty"><span class="icon">🔑</span><p style="font-weight:600">No rental set yet</p><p style="font-size:13px;margin-top:4px">Visit a room you\'re renting and tap "Mark as my room"</p></div>';
      return;
    }
    myRentalRoomId = data.room._id;
    rentalPayments = data.payments;
    const year = new Date().getFullYear();
    const paidMonths = new Set(rentalPayments.map(p => p.month));

    let grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin:12px 0">';
    for (let m = 0; m < 12; m++) {
      const monthStr = `${year}-${String(m+1).padStart(2,'0')}`;
      const paid = paidMonths.has(monthStr);
      grid += `<button class="btn ${paid?'btn-primary':'btn-outline'} btn-sm" style="flex-direction:column;height:auto;padding:10px 6px" onclick="${paid?'':`openPayRent('${monthStr}','${t('months')[m]} ${year}')`}">
        <span>${t('months')[m]}</span>
        <span style="font-size:11px">${paid ? t('paid') : t('unpaid')}</span>
      </button>`;
    }
    grid += '</div>';

    const history = rentalPayments.length
      ? '<div style="margin-top:1rem"><strong style="font-size:14px">Payment history</strong>' +
        rentalPayments.slice().reverse().map(p => `
          <div class="card" style="margin-top:8px;padding:10px">
            <div class="row">
              <div>
                <strong>${t('months')[parseInt(p.month.split('-')[1])-1]} ${p.month.split('-')[0]}</strong>
                <div class="meta">'+t('paidLabel')+' £${p.amount} · '+t('cardEnding')+' ${p.cardLast4}</div>
                <div class="meta">${new Date(p.paidAt).toLocaleDateString('en-GB')}</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="deletePayment('${p._id}')">Delete</button>
            </div>
          </div>`).join('') + '</div>'
      : '';

    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div>
            <strong>${escapeHtml(data.room.title)}</strong>
            <div class="meta">${escapeHtml(data.room.area)} · £${data.room.price}/mo</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="showDetail('${data.room._id}')">View room</button>
        </div>
        <p style="font-size:13px;color:#666;margin-top:10px">${year} '+t('rentTracker')+'</p>
        ${grid}
        ${history}
      </div>`;
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}

let payingMonth = null;
function openPayRent(monthStr, label) {
  payingMonth = monthStr;
  document.getElementById('pay-month-label').textContent = label;
  document.getElementById('pay-error').style.display='none';
  ['pay-card-name','pay-card-number','pay-expiry','pay-cvc'].forEach(id => document.getElementById(id).value='');
  clearFieldErrors(['pay-name-err','pay-number-err','pay-expiry-err','pay-cvc-err']);
  document.getElementById('pay-success').style.display='none';
  document.getElementById('pay-form-wrap').style.display='';
  document.getElementById('pay-btn').style.display='';
  document.getElementById('pay-modal').classList.remove('hidden');
}
function closePayRent(){
  document.getElementById('pay-modal').classList.add('hidden');
  loadMyRental();
}

async function doPayRent() {
  const cardName = document.getElementById('pay-card-name').value.trim();
  const cardNumber = document.getElementById('pay-card-number').value.replace(/\s/g,'');
  const expiry = document.getElementById('pay-expiry').value.trim();
  const cvc = document.getElementById('pay-cvc').value.trim();
  document.getElementById('pay-error').style.display='none';
  clearFieldErrors(['pay-name-err','pay-number-err','pay-expiry-err','pay-cvc-err']);

  let valid = true;
  if (!cardName) { setFieldError('pay-name-err','Cardholder name is required'); valid=false; }
  if (!/^\d{12,19}$/.test(cardNumber)) { setFieldError('pay-number-err','Enter a valid card number (12-19 digits)'); valid=false; }
  if (!/^\d{2}\/\d{2}$/.test(expiry)) { setFieldError('pay-expiry-err','Format MM/YY'); valid=false; }
  if (!/^\d{3,4}$/.test(cvc)) { setFieldError('pay-cvc-err','3-4 digits'); valid=false; }
  if (!valid) return;

  const btn = document.getElementById('pay-btn');
  btn.disabled = true; btn.textContent = 'Processing...';
  try {
    await api('POST','/rental/pay',{month:payingMonth, cardName, cardNumber, expiry, cvc});
    document.getElementById('pay-success').style.display='';
    document.getElementById('pay-form-wrap').style.display='none';
    document.getElementById('pay-btn').style.display='none';
  } catch(e) {
    document.getElementById('pay-error').textContent = e.message;
    document.getElementById('pay-error').style.display='';
  } finally { btn.disabled=false; btn.textContent='Pay now'; }
}

function formatCardNumber(input) {
  let v = input.value.replace(/\D/g,'').slice(0,19);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(input) {
  let v = input.value.replace(/\D/g,'').slice(0,4);
  if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  input.value = v;
}

async function deletePayment(id) {
  if (!confirm(t('deletePaymentConfirm'))) return;
  try {
    await api('DELETE','/rental/pay/'+id);
    loadMyRental();
  } catch(e) { alert(e.message); }
}