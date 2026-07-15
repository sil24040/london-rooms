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
let bookingRoomId = null;
let notifPollInterval = null;
let reviewRoomId = null;
let reviewRoomTitle = null;
let selectedReviewRating = 0;
let existingReviewId = null;
let leafletPromise = null;
let lastFocusedElement = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Map failed to load'));
    document.head.appendChild(script);
  });

  return leafletPromise;
}

function openModal(id) {
  const modal = document.getElementById(id);
  lastFocusedElement = document.activeElement;
  modal.classList.remove('hidden');
  modal.querySelector('.modal')?.focus();
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}

function closeTopModal() {
  const modal = [...document.querySelectorAll('.modal-bg:not(.hidden)')].pop();
  if (!modal) return false;
  modal.classList.add('hidden');
  if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
  return true;
}
 
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
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API returned a web page instead of data. Start the Express server and open http://localhost:3000.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
 
function toggleMenu(){
  const links = document.getElementById('navlinks');
  const isOpen = links.classList.toggle('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', String(isOpen));
}
 
function showPage(name) {
  document.getElementById('navlinks').classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.page').forEach(p => {
    const isActive = p.id === 'page-' + name;
    p.classList.toggle('active', isActive);
    p.setAttribute('aria-hidden', String(!isActive));
  });
  document.querySelectorAll('.navlinks button').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  const nb = document.getElementById('nav-' + name);
  if (nb) {
    nb.classList.add('active');
    nb.setAttribute('aria-current', 'page');
  }
  document.getElementById('main-content')?.focus({ preventScroll: true });
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
  document.getElementById('notif-wrap').style.display = li ? 'block' : 'none';
  if (li) {
    loadNotifications();
    if (!notifPollInterval) notifPollInterval = setInterval(loadNotifications, 30000);
  } else {
    if (notifPollInterval) { clearInterval(notifPollInterval); notifPollInterval = null; }
  }
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
 
// ── DELETE ACCOUNT ──
function openDeleteAccount() {
  document.getElementById('delete-account-pw').value = '';
  document.getElementById('delete-account-error').style.display = 'none';
  document.getElementById('delete-account-pw-err').style.display = 'none';
  openModal('delete-account-modal');
}
function closeDeleteAccount() {
  closeModal('delete-account-modal');
}

async function doDeleteAccount() {
  const password = document.getElementById('delete-account-pw').value;
  document.getElementById('delete-account-error').style.display = 'none';
  document.getElementById('delete-account-pw-err').style.display = 'none';
  if (!password) { setFieldError('delete-account-pw-err', 'Password is required'); return; }

  const btn = document.getElementById('delete-account-btn');
  btn.disabled = true; btn.textContent = 'Deleting...';
  try {
    await api('DELETE', '/auth/account', { password });
    closeDeleteAccount();
    logout();
  } catch (e) {
    document.getElementById('delete-account-error').textContent = e.message;
    document.getElementById('delete-account-error').style.display = '';
  } finally {
    btn.disabled = false; btn.textContent = 'Permanently delete my account';
  }
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
  document.getElementById('view-list-btn').setAttribute('aria-pressed', String(view === 'list'));
  document.getElementById('view-map-btn').setAttribute('aria-pressed', String(view === 'map'));
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
 
async function renderBrowseMap() {
  try {
    await loadLeaflet();
  } catch (e) {
    document.getElementById('rooms-map-wrap').innerHTML = '<div class="alert alert-error" role="alert">The map could not be loaded. The room list is still available.</div>';
    return;
  }
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
  document.getElementById('reviews-section').innerHTML = '';
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
           <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="openBooking('${r._id}','${escapeHtml(r.title).replace(/'/g,"\\'")}')">Request to book</button>`}

      </div>`;
 
    if (r.lat && r.lng) {
      loadLeaflet().then(() => setTimeout(() => {
        detailMap = L.map('detail-map').setView([r.lat, r.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
        }).addTo(detailMap);
        L.marker([r.lat, r.lng]).addTo(detailMap).bindPopup(`<b>${escapeHtml(r.title)}</b><br>${escapeHtml(r.area)}`).openPopup();
        detailMap.invalidateSize();
      }, 50)).catch(() => {
        const map = document.getElementById('detail-map');
        if (map) map.outerHTML = '<div class="alert alert-error" role="alert">The map could not be loaded.</div>';
      });
    }

    loadRoomReviews(r._id, r.title);
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
    loadLandlordRooms(); loadLandlordEnquiries(); loadLandlordBookings();
  } else {
    document.getElementById('tenant-dash').style.display='';
    document.getElementById('landlord-dash').style.display='none';
    loadTenantEnquiries();
    loadMyOffers();
    loadMyRental();
    loadMyBookings();
  }
}
 
function switchLandlordTab(tab) {
  document.getElementById('tab-listings').classList.toggle('active', tab==='listings');
  document.getElementById('tab-bookings').classList.toggle('active', tab==='bookings');
  document.getElementById('tab-enquiries').classList.toggle('active', tab==='enquiries');
  document.getElementById('landlord-listings-tab').style.display = tab==='listings' ? '' : 'none';
  document.getElementById('landlord-bookings-tab').style.display = tab==='bookings' ? '' : 'none';
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
        ${e.reply ? `<div style="margin-top:8px;padding:8px;background:#f5f5f3;border-radius:8px;font-size:13px"><strong>${t('landlordReply')}</strong><br>${escapeHtml(e.reply)}</div>` : ''}
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
        ${e.reply ? `<div style="margin-top:8px;padding:8px;background:#f5f5f3;border-radius:8px;font-size:13px"><strong>${t('yourReplyLabel')}</strong><br>${escapeHtml(e.reply)}</div>` : `<button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="openReply('${e._id}','${escapeHtml(e.roomTitle).replace(/'/g,"\\'")}','${escapeHtml(e.tenantName).replace(/'/g,"\\'")}')">Reply</button><button class="btn btn-primary btn-sm" style="margin-top:8px;margin-left:6px" onclick="sendOffer('${e._id}')">🏠 Offer room</button>`}
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
  openModal('add-room-modal');
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
    openModal('add-room-modal');
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
 
function closeAddRoom(){ closeModal('add-room-modal'); }
 
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
  openModal('enquiry-modal');
}
function closeEnquiry(){ closeModal('enquiry-modal'); }
 
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
  openModal('edit-enq-modal');
}
function closeEditEnquiry() {
  closeModal('edit-enq-modal');
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
    loadMyOffers();
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
    loadMyOffers();
  } catch(e) { alert(e.message); }
}
 
// ── REPLY ──
function openReply(enquiryId, roomTitle, tenantName) {
  replyEnquiryId = enquiryId;
  document.getElementById('reply-context').textContent = `Re: "${roomTitle}" — to ${tenantName}`;
  document.getElementById('reply-msg').value='';
  document.getElementById('reply-error').style.display='none';
  document.getElementById('reply-msg-err').style.display='none';
  openModal('reply-modal');
}
function closeReply(){ closeModal('reply-modal'); }
 
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
document.getElementById('booking-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeBooking(); });
document.getElementById('review-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeReviewModal(); });
document.getElementById('edit-enq-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeEditEnquiry(); });
document.getElementById('pay-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closePayRent(); });
document.getElementById('delete-account-modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeDeleteAccount(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTopModal();
});
document.addEventListener('click', e => {
  const wrap = document.getElementById('notif-wrap');
  const dropdown = document.getElementById('notif-dropdown');
  if (wrap && !wrap.contains(e.target) && !dropdown.classList.contains('hidden')) {
    dropdown.classList.add('hidden');
    document.querySelector('.notif-bell')?.setAttribute('aria-expanded', 'false');
  }
});
 
// Handle incoming page param (e.g. from landing page Pay Rent button)
const urlParams = new URLSearchParams(window.location.search);
const incomingPage = urlParams.get('page');
if (incomingPage && user) {
  showPage(incomingPage);
} else if (incomingPage && !user) {
  showPage('login');
}
 
updateNav();
applyTranslations();
// Apply saved language
if (localStorage.getItem('lang')) {
  currentLang = localStorage.getItem('lang');
  document.getElementById('lang-'+currentLang).classList.add('active');
  if(currentLang!=='en') document.getElementById('lang-en').classList.remove('active');
  document.getElementById('lang-en').setAttribute('aria-pressed', String(currentLang === 'en'));
  document.getElementById('lang-pt').setAttribute('aria-pressed', String(currentLang === 'pt'));
}
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
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-11
    const paidMonths = new Set(rentalPayments.map(p => p.month));

    // Due date = 1st of each month. Figure out days until/overdue for the current month.
    const dueDay = 1;
    const thisMonthStr = `${year}-${String(currentMonthIndex+1).padStart(2,'0')}`;
    const thisMonthPaid = paidMonths.has(thisMonthStr);
    const daysSinceDue = today.getDate() - dueDay;

    let banner = '';
    if (thisMonthPaid) {
      banner = `<div style="background:#eaf3de;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">✅</span>
        <div><strong style="color:#3B6D11">${t('months')[currentMonthIndex]} rent paid</strong><div style="font-size:12px;color:#3B6D11">You're all caught up.</div></div>
      </div>`;
    } else if (daysSinceDue > 0) {
      banner = `<div style="background:#fdecea;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">⚠️</span>
        <div><strong style="color:#c0392b">${t('months')[currentMonthIndex]} rent is overdue</strong><div style="font-size:12px;color:#c0392b">${daysSinceDue} day${daysSinceDue===1?'':'s'} past the due date (1st).</div></div>
        <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="openPayRent('${thisMonthStr}','${t('months')[currentMonthIndex]} ${year}')">Pay now</button>
      </div>`;
    } else {
      const daysUntil = -daysSinceDue;
      banner = `<div style="background:#EEF5FF;border-radius:10px;padding:12px 16px;margin-bottom:1rem;display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">📅</span>
        <div><strong style="color:#185FA5">${t('months')[currentMonthIndex]} rent due in ${daysUntil} day${daysUntil===1?'':'s'}</strong><div style="font-size:12px;color:#185FA5">Due on the 1st.</div></div>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openPayRent('${thisMonthStr}','${t('months')[currentMonthIndex]} ${year}')">Pay early</button>
      </div>`;
    }

    let grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;margin:12px 0">';
    for (let m = 0; m < 12; m++) {
      const monthStr = `${year}-${String(m+1).padStart(2,'0')}`;
      const paid = paidMonths.has(monthStr);
      const isPast = m < currentMonthIndex;
      const isCurrent = m === currentMonthIndex;
      let statusLabel, btnClass;
      if (paid) { statusLabel = t('paid'); btnClass = 'btn-primary'; }
      else if (isPast) { statusLabel = 'Overdue'; btnClass = 'btn-danger'; }
      else if (isCurrent) { statusLabel = 'Due now'; btnClass = 'btn-outline'; }
      else { statusLabel = 'Upcoming'; btnClass = 'btn-outline'; }
      grid += `<button class="btn ${btnClass} btn-sm" style="flex-direction:column;height:auto;padding:10px 6px" onclick="${paid?'':`openPayRent('${monthStr}','${t('months')[m]} ${year}')`}">
        <span>${t('months')[m]}</span>
        <span style="font-size:11px">${statusLabel}</span>
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
                <div class="meta">${t('paidLabel')} £${p.amount} · ${t('cardEnding')} ${p.cardLast4}</div>
                <div class="meta">${new Date(p.paidAt).toLocaleDateString('en-GB')}</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="deletePayment('${p._id}')">Delete</button>
            </div>
          </div>`).join('') + '</div>'
      : '';

    const totalPaid = rentalPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidCount = rentalPayments.length;
    const unpaidCount = 12 - paidCount;

    el.innerHTML = `
      <div class="card" style="border-left:4px solid #185FA5">
        <div class="row" style="margin-bottom:1rem">
          <div>
            <strong style="font-size:16px">${escapeHtml(data.room.title)}</strong>
            <div class="meta" style="margin-top:4px">📍 ${escapeHtml(data.room.area)} · <strong>£${data.room.price}/mo</strong></div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="showDetail('${data.room._id}')">View room</button>
        </div>
        ${banner}
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:1rem">
          <div style="background:#eaf3de;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#3B6D11">${paidCount}</div>
            <div style="font-size:11px;color:#3B6D11;font-weight:600;margin-top:2px">PAID</div>
          </div>
          <div style="background:#fdecea;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#c0392b">${unpaidCount}</div>
            <div style="font-size:11px;color:#c0392b;font-weight:600;margin-top:2px">UNPAID</div>
          </div>
          <div style="background:#EEF5FF;border-radius:10px;padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#185FA5">£${totalPaid}</div>
            <div style="font-size:11px;color:#185FA5;font-weight:600;margin-top:2px">TOTAL PAID</div>
          </div>
        </div>
        <p style="font-size:13px;color:#666;margin-bottom:8px">${year} ${t('rentTracker')} · rent due the 1st of each month</p>
        ${grid}
        ${history}
      </div>`;
  } catch(e) { el.innerHTML = '<div class="alert alert-error">'+e.message+'</div>'; }
}
 
let payingMonth = null;
let stripeClient = null;
let stripeElements = null;
let stripeCard = null;
let stripeConfigPromise = null;

function loadScriptOnce(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return existing.dataset.loaded ? Promise.resolve() : new Promise((resolve, reject) => {
    existing.addEventListener('load', resolve, { once: true });
    existing.addEventListener('error', reject, { once: true });
  });

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error('Could not load Stripe.js'));
    document.head.appendChild(script);
  });
}

async function getStripeConfig() {
  if (!stripeConfigPromise) stripeConfigPromise = api('GET', '/rental/payment-config');
  return stripeConfigPromise;
}

async function setupStripeCard() {
  const err = document.getElementById('pay-card-err');
  err.style.display = 'none';
  err.textContent = '';
  try {
    const config = await getStripeConfig();
    if (!config.stripeEnabled || !config.publishableKey) {
      throw new Error('Stripe test payments are not configured yet.');
    }
    await loadScriptOnce('https://js.stripe.com/v3/');
    stripeClient = stripeClient || Stripe(config.publishableKey);
    stripeElements = stripeClient.elements();
    if (stripeCard) stripeCard.destroy();
    stripeCard = stripeElements.create('card', {
      hidePostalCode: true,
      style: {
        base: { fontSize: '14px', color: '#1a1a1a', fontFamily: '-apple-system, sans-serif' },
        invalid: { color: '#c0392b' }
      }
    });
    stripeCard.mount('#stripe-card-element');
    stripeCard.on('change', event => {
      err.textContent = event.error ? event.error.message : '';
      err.style.display = event.error ? '' : 'none';
    });
  } catch (e) {
    err.textContent = e.message;
    err.style.display = '';
  }
}

function openPayRent(monthStr, label) {
  payingMonth = monthStr;
  document.getElementById('pay-month-label').textContent = label;
  document.getElementById('pay-error').style.display='none';
  document.getElementById('pay-card-name').value='';
  clearFieldErrors(['pay-name-err','pay-card-err']);
  document.getElementById('pay-success').style.display='none';
  document.getElementById('pay-form-wrap').style.display='';
  document.getElementById('pay-btn').style.display='';
  openModal('pay-modal');
  setupStripeCard();
}
function closePayRent(){
  closeModal('pay-modal');
  loadMyRental();
}
 
async function doPayRent() {
  const cardName = document.getElementById('pay-card-name').value.trim();
  document.getElementById('pay-error').style.display='none';
  clearFieldErrors(['pay-name-err','pay-card-err']);
 
  let valid = true;
  if (!cardName) { setFieldError('pay-name-err','Cardholder name is required'); valid=false; }
  if (!stripeClient || !stripeCard) { setFieldError('pay-card-err','Secure card form is not ready yet'); valid=false; }
  if (!valid) return;
 
  const btn = document.getElementById('pay-btn');
  btn.disabled = true; btn.textContent = 'Processing...';
  try {
    const intent = await api('POST','/rental/pay/intent',{month:payingMonth});
    const result = await stripeClient.confirmCardPayment(intent.clientSecret, {
      payment_method: {
        card: stripeCard,
        billing_details: { name: cardName }
      }
    });
    if (result.error) throw new Error(result.error.message);
    await api('POST','/rental/pay/confirm',{month:payingMonth, paymentIntentId: result.paymentIntent.id});
    document.getElementById('pay-success').style.display='';
    document.getElementById('pay-form-wrap').style.display='none';
    document.getElementById('pay-btn').style.display='none';
  } catch(e) {
    document.getElementById('pay-error').textContent = e.message;
    document.getElementById('pay-error').style.display='';
  } finally { btn.disabled=false; btn.textContent='Pay now'; }
}
 
async function deletePayment(id) {
  if (!confirm(t('deletePaymentConfirm'))) return;
  try {
    await api('DELETE','/rental/pay/'+id);
    loadMyRental();
  } catch(e) { alert(e.message); }
}

// ── BOOKINGS ──
function openBooking(roomId, title) {
  bookingRoomId = roomId;
  document.getElementById('booking-room-title').textContent = title;
  document.getElementById('booking-msg').value = '';
  document.getElementById('booking-success').style.display = 'none';
  document.getElementById('booking-error').style.display = 'none';
  document.getElementById('booking-form-wrap').style.display = '';
  document.getElementById('booking-btn').style.display = '';
  openModal('booking-modal');
}
function closeBooking() {
  closeModal('booking-modal');
}

async function doBooking() {
  const message = document.getElementById('booking-msg').value.trim();
  document.getElementById('booking-error').style.display = 'none';
  const btn = document.getElementById('booking-btn');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    await api('POST', '/bookings/' + bookingRoomId, { message });
    document.getElementById('booking-success').style.display = '';
    document.getElementById('booking-form-wrap').style.display = 'none';
    document.getElementById('booking-btn').style.display = 'none';
  } catch (e) {
    document.getElementById('booking-error').textContent = e.message;
    document.getElementById('booking-error').style.display = '';
  } finally {
    btn.disabled = false; btn.textContent = 'Send request';
  }
}

function bookingStatusBadge(status) {
  const cls = status === 'approved' ? 'badge-approved' : status === 'rejected' ? 'badge-rejected' : 'badge-pending';
  return `<span class="badge ${cls}">${status}</span>`;
}

async function loadMyBookings() {
  const el = document.getElementById('my-bookings-section');
  if (!el) return;
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const list = await api('GET', '/bookings/mine');
    el.innerHTML = !list.length
      ? '<div class="empty"><span class="icon">📋</span><p style="font-weight:600">No booking requests yet</p><p style="font-size:13px;margin-top:4px">Visit a room and tap "Request to book"</p></div>'
      : list.map(b => `
        <div class="card" style="margin-bottom:8px">
          <div class="row">
            <div>
              <strong>${escapeHtml(b.roomTitle)}</strong>
              <div class="meta">${escapeHtml(b.roomArea)} · £${b.roomPrice}/mo · To: ${escapeHtml(b.landlordName)}</div>
              ${b.message ? `<div style="font-size:13px;margin:6px 0">"${escapeHtml(b.message)}"</div>` : ''}
              <div class="meta">${new Date(b.createdAt).toLocaleDateString('en-GB')} · ${bookingStatusBadge(b.status)}</div>
            </div>
            ${b.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="cancelBookingRequest('${b._id}')">Cancel</button>` : ''}
          </div>
        </div>`).join('');
  } catch (e) { el.innerHTML = '<div class="alert alert-error">' + e.message + '</div>'; }
}

async function loadLandlordBookings() {
  const el = document.getElementById('landlord-bookings');
  if (!el) return;
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const list = await api('GET', '/bookings/received');
    el.innerHTML = !list.length
      ? '<div class="empty"><span class="icon">📋</span><p>No booking requests received yet</p></div>'
      : list.map(b => `
        <div class="card" style="margin-bottom:8px">
          <strong>${escapeHtml(b.roomTitle)}</strong>
          <div class="meta">From: ${escapeHtml(b.tenantName)}</div>
          ${b.message ? `<div style="font-size:13px;margin:6px 0">"${escapeHtml(b.message)}"</div>` : ''}
          <div class="meta">${new Date(b.createdAt).toLocaleDateString('en-GB')} · ${bookingStatusBadge(b.status)}</div>
          ${b.status === 'pending' ? `
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="approveBookingRequest('${b._id}')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectBookingRequest('${b._id}')">Reject</button>
          </div>` : ''}
        </div>`).join('');
  } catch (e) { el.innerHTML = '<div class="alert alert-error">' + e.message + '</div>'; }
}

async function approveBookingRequest(id) {
  if (!confirm('Approve this booking? This will mark the room as unavailable and set it as the tenant\'s rental.')) return;
  try {
    await api('PUT', '/bookings/' + id + '/approve');
    loadLandlordBookings();
    loadLandlordRooms();
  } catch (e) { alert(e.message); }
}

async function rejectBookingRequest(id) {
  if (!confirm('Reject this booking request?')) return;
  try {
    await api('PUT', '/bookings/' + id + '/reject');
    loadLandlordBookings();
  } catch (e) { alert(e.message); }
}

async function cancelBookingRequest(id) {
  if (!confirm('Cancel this booking request?')) return;
  try {
    await api('DELETE', '/bookings/' + id);
    loadMyBookings();
  } catch (e) { alert(e.message); }
}

// ── NOTIFICATIONS ──
function timeAgo(ts) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return new Date(ts).toLocaleDateString('en-GB');
}

function updateNotifBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = ''; }
  else { badge.style.display = 'none'; }
  document.querySelector('.notif-bell')?.setAttribute('aria-label', count > 0 ? `Notifications, ${count} unread` : 'Notifications');
}

function renderNotifDropdown(items) {
  const el = document.getElementById('notif-list');
  el.innerHTML = !items.length
    ? '<div class="notif-empty">No notifications yet</div>'
    : items.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="clickNotification('${n._id}','${n.linkPage || ''}')">
        <div>${escapeHtml(n.message)}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>`).join('');
}

async function loadNotifications() {
  if (!user) return;
  try {
    const res = await api('GET', '/notifications');
    renderNotifDropdown(res.items);
    updateNotifBadge(res.unreadCount);
  } catch (e) { /* fail silently — don't interrupt the UI for a background poll */ }
}

function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  dropdown.classList.toggle('hidden');
  document.querySelector('.notif-bell')?.setAttribute('aria-expanded', String(!dropdown.classList.contains('hidden')));
  if (!dropdown.classList.contains('hidden')) loadNotifications();
}

async function clickNotification(id, linkPage) {
  try { await api('PUT', '/notifications/' + id + '/read'); } catch (e) { /* ignore */ }
  loadNotifications();
  document.getElementById('notif-dropdown').classList.add('hidden');
  document.querySelector('.notif-bell')?.setAttribute('aria-expanded', 'false');
  if (linkPage) showPage(linkPage);
}

async function markAllNotificationsRead() {
  try {
    await api('PUT', '/notifications/read-all');
    loadNotifications();
  } catch (e) { alert(e.message); }
}

// ── REVIEWS ──
function renderStars(rating) {
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += i <= rating ? '★' : '<span class="empty-star">★</span>';
  }
  html += '</span>';
  return html;
}

async function loadRoomReviews(roomId, roomTitle) {
  const el = document.getElementById('reviews-section');
  el.innerHTML = '<div class="loading-wrap"><span class="spinner"></span></div>';
  try {
    const res = await api('GET', '/reviews/room/' + roomId);
    const isTenant = user && user.role === 'tenant';
    let reviewEligibility = null;
    if (isTenant) {
      try {
        reviewEligibility = await api('GET', '/reviews/eligibility/' + roomId);
      } catch (e) {
        reviewEligibility = { eligible: false, reason: e.message };
      }
    }

    const summary = res.count
      ? `<div class="review-summary"><span class="avg">${res.average}</span>${renderStars(Math.round(res.average))}<span style="color:#666;font-size:13px">(${res.count} review${res.count===1?'':'s'})</span></div>`
      : `<p style="color:#666;font-size:13px;margin-bottom:1rem">No reviews yet</p>`;

    const list = res.items.map(rv => `
      <div class="review-item">
        <div class="row">
          <strong>${escapeHtml(rv.tenantName)}</strong>
          <span style="font-size:12px;color:#999">${new Date(rv.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
        ${renderStars(rv.rating)}
        ${rv.comment ? `<p style="font-size:13px;margin-top:6px">${escapeHtml(rv.comment)}</p>` : ''}
      </div>`).join('');

    el.innerHTML = `
      <div class="card">
        ${summary}
        ${reviewEligibility?.eligible ? `<button class="btn btn-outline btn-sm" style="margin-bottom:1rem" onclick="openReviewModal('${roomId}','${escapeHtml(roomTitle).replace(/'/g,"\\'")}')">Write a review</button>` : ''}
        ${isTenant && reviewEligibility && !reviewEligibility.eligible ? `<p style="color:#666;font-size:13px;margin-bottom:1rem">${escapeHtml(reviewEligibility.reason)}</p>` : ''}
        ${list || ''}
      </div>`;
  } catch (e) {
    el.innerHTML = '<div class="alert alert-error">' + e.message + '</div>';
  }
}

async function openReviewModal(roomId, roomTitle) {
  try {
    const eligibility = await api('GET', '/reviews/eligibility/' + roomId);
    if (!eligibility.eligible) {
      alert(eligibility.reason);
      return;
    }
  } catch (e) {
    alert(e.message);
    return;
  }

  reviewRoomId = roomId;
  reviewRoomTitle = roomTitle;
  document.getElementById('review-room-title').textContent = roomTitle;
  document.getElementById('review-error').style.display = 'none';
  document.getElementById('review-comment').value = '';
  selectedReviewRating = 0;
  existingReviewId = null;
  document.getElementById('review-modal-title').textContent = 'Write a review';
  document.getElementById('review-delete-btn').style.display = 'none';
  updateStarPicker(0);

  try {
    const mine = await api('GET', '/reviews/mine/' + roomId);
    if (mine) {
      existingReviewId = mine._id;
      selectedReviewRating = mine.rating;
      document.getElementById('review-comment').value = mine.comment || '';
      document.getElementById('review-modal-title').textContent = 'Edit your review';
      document.getElementById('review-delete-btn').style.display = '';
      updateStarPicker(mine.rating);
    }
  } catch (e) { /* no existing review, ignore */ }

  openModal('review-modal');
}
function closeReviewModal() {
  closeModal('review-modal');
}

function updateStarPicker(rating) {
  document.querySelectorAll('#review-star-picker button').forEach(el => {
    el.classList.toggle('filled', Number(el.dataset.star) <= rating);
    el.setAttribute('aria-checked', String(Number(el.dataset.star) === rating));
  });
}

function selectReviewStar(n) {
  selectedReviewRating = n;
  updateStarPicker(n);
}

async function doSubmitReview() {
  document.getElementById('review-error').style.display = 'none';
  if (!selectedReviewRating) {
    document.getElementById('review-error').textContent = 'Please select a star rating';
    document.getElementById('review-error').style.display = '';
    return;
  }
  const comment = document.getElementById('review-comment').value.trim();
  const btn = document.getElementById('review-btn');
  btn.disabled = true; btn.textContent = 'Submitting...';
  try {
    await api('POST', '/reviews/' + reviewRoomId, { rating: selectedReviewRating, comment });
    closeReviewModal();
    loadRoomReviews(reviewRoomId, reviewRoomTitle);
  } catch (e) {
    document.getElementById('review-error').textContent = e.message;
    document.getElementById('review-error').style.display = '';
  } finally {
    btn.disabled = false; btn.textContent = 'Submit review';
  }
}

async function doDeleteReview() {
  if (!existingReviewId) return;
  if (!confirm('Delete your review?')) return;
  try {
    await api('DELETE', '/reviews/' + existingReviewId);
    closeReviewModal();
    loadRoomReviews(reviewRoomId, reviewRoomTitle);
  } catch (e) { alert(e.message); }
}

// ── OFFERS ──
async function sendOffer(enquiryId) {
  if (!confirm('Send a room offer to this tenant?')) return;
  try {
    await api('POST', '/offers', { enquiryId });
    alert('✓ Offer sent! The tenant will see it on their dashboard.');
    loadLandlordEnquiries();
  } catch(e) { alert(e.message); }
}

async function loadMyOffers() {
  const el = document.getElementById('my-offers-section');
  if (!el) return;
  try {
    const offers = await api('GET', '/offers/mine');
    const pending = offers.filter(o => o.status === 'pending');
    if (!pending.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <h2 style="font-size:16px;margin-bottom:8px">🏠 Room offers</h2>
      ${pending.map(o => `
        <div class="card" style="margin-bottom:8px;border-left:4px solid #185FA5">
          <strong>${escapeHtml(o.roomTitle)}</strong>
          <div class="meta">From: ${escapeHtml(o.landlordName)}</div>
          <p style="font-size:13px;color:#666;margin:6px 0">The landlord has offered you this room. Would you like to accept?</p>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn btn-primary btn-sm" onclick="respondToOffer('${o._id}','accepted')">✓ Accept</button>
            <button class="btn btn-danger btn-sm" onclick="respondToOffer('${o._id}','declined')">✗ Decline</button>
          </div>
        </div>`).join('')}`;
  } catch(e) { console.error(e); }
}

async function respondToOffer(offerId, status) {
  const msg = status === 'accepted' ? 'Accept this room offer?' : 'Decline this offer?';
  if (!confirm(msg)) return;
  try {
    await api('PUT', '/offers/' + offerId, { status });
    if (status === 'accepted') {
      alert('✓ You have accepted the room! It has been marked as your rental.');
    } else {
      alert('Offer declined.');
    }
    loadDashboard();
  } catch(e) { alert(e.message); }
}
