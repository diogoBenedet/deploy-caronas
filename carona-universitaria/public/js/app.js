/* ===== CARONA UNIVERSITÁRIA — SHARED APP ===== */

const API_BASE = '/api';

// ── Auth helpers ──────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  save: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ── API helper ────────────────────────────────────────────────
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

async function apiForm(path, formData) {
  const headers = {};
  if (Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'default', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };
  const defaultIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  toast.innerHTML = `<span style="display:flex;align-items:center;flex-shrink:0;">${icons[type] || defaultIcon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Date / time formatters ────────────────────────────────────
function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price) {
  if (price == null) return '—';
  if (price === 0) return 'Gratuito';
  return `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
}

// ── Avatar helper ─────────────────────────────────────────────
function makeAvatar(name, photo, size = 40, cls = '') {
  if (photo) {
    return `<img src="${photo}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" class="${cls}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:white;display:none;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;">${initials(name)}</div>`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;" class="${cls}">${initials(name)}</div>`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ── Status badge ──────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-success', 'Ativa'],
    completed: ['badge-muted', 'Finalizada'],
    cancelled: ['badge-danger', 'Cancelada'],
    confirmed: ['badge-success', 'Confirmada'],
    pending: ['badge-warning', 'Pendente']
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Ride card HTML (route-track design) ───────────────────────
function rideCardHTML(ride, clickable = true) {
  const seatsClass = ride.available_seats <= 1 ? 'seats-badge low' : 'seats-badge';
  const price = formatPrice(ride.price);
  const time = formatTime(ride.departure_time);
  const date = formatDate(ride.departure_time);
  const carSub = [ride.vehicle_model, ride.vehicle_color].filter(Boolean).join(' · ');

  const avatar = ride.driver_photo
    ? `<img src="${ride.driver_photo}" alt="${ride.driver_name}" class="ride-av" style="object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="ride-av" style="display:none;">${initials(ride.driver_name)}</div>`
    : `<div class="ride-av">${initials(ride.driver_name)}</div>`;

  const card = `
    <div class="ride-card" onclick="${clickable ? `window.location='/ride-detail.html?id=${ride.id}'` : ''}">
      <div class="ride-card-top">
        ${avatar}
        <div class="ride-driver">
          <div class="nm">${ride.driver_name || 'Motorista'}</div>
          ${carSub ? `<div class="sub">${carSub}</div>` : ''}
        </div>
        <div class="ride-price-lg">${price}</div>
      </div>
      <div class="ride-track">
        <div class="rail"><span class="d1"></span><span class="line"></span><span class="d2"></span></div>
        <div class="pts"><div class="pt">${ride.origin}</div><div class="pt" style="color:var(--secondary);">${ride.destination}</div></div>
      </div>
      ${ride.notes ? `<p class="ride-note">"${ride.notes}"</p>` : ''}
      <div class="ride-divider"></div>
      <div class="ride-chips">
        <span class="chip chip-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${time}</span>
        <span class="${seatsClass}">${ride.available_seats} vaga${ride.available_seats !== 1 ? 's' : ''}</span>
        <span class="chip-date">${date}</span>
      </div>
    </div>`;
  return card;
}

// ── Navbar setup ──────────────────────────────────────────────
function setupNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));

  userMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdownMenu?.classList.remove('open'));

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clear();
    window.location.href = '/';
  });

  const user = Auth.getUser();
  if (user) {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      window.location.replace('/dashboard.html');
      return;
    }

    // ID-based (backward compat)
    const navLoggedOut = document.getElementById('navLoggedOut');
    const navLoggedOut2 = document.getElementById('navLoggedOut2');
    const navLoggedIn = document.getElementById('navLoggedIn');
    if (navLoggedOut) navLoggedOut.style.display = 'none';
    if (navLoggedOut2) navLoggedOut2.style.display = 'none';
    if (navLoggedIn) navLoggedIn.style.display = '';

    // Class-based
    document.querySelectorAll('.nav-loggedout').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-loggedin').forEach(el => el.style.display = '');

    const navUserName = document.getElementById('navUserName');
    if (navUserName) navUserName.textContent = user.name.split(' ')[0];

    const navAvatarWrap = document.getElementById('navAvatarWrap');
    if (navAvatarWrap) navAvatarWrap.innerHTML = makeAvatar(user.name, user.profile_photo, 34);
  }
}

// ── Button loading state ──────────────────────────────────────
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.innerHTML = (originalText || btn.textContent) + ' ';
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._originalText || originalText || btn.innerHTML;
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ── Skeleton cards ────────────────────────────────────────────
function skeletonCards(count = 3) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line title"></div>
      <div class="skeleton skeleton-line wide"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <div class="skeleton skeleton-avatar"></div>
          <div class="skeleton skeleton-line short" style="margin:0;width:80px;"></div>
        </div>
        <div class="skeleton skeleton-line short" style="margin:0;width:60px;height:18px;"></div>
      </div>
    </div>`).join('');
}

// ── Guard: require login ──────────────────────────────────────
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// ── Notificações ──────────────────────────────────────────────
async function loadNotifications() {
  if (!Auth.isLoggedIn()) return;
  try {
    const data = await api('/notifications');
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (badge) badge.textContent = data.unread > 0 ? data.unread : '';
    if (list) {
      if (data.notifications.length === 0) {
        list.innerHTML = '<p class="notif-empty">Nenhuma notificação</p>';
      } else {
        list.innerHTML = data.notifications.map(n => `
          <div class="notif-item${n.read ? '' : ' unread'}" data-id="${n.id}" onclick="markNotifRead(${n.id}, ${n.ride_id})">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${formatDateTime(n.created_at)}</div>
          </div>`).join('');
      }
    }
  } catch (_) {}
}

async function markNotifRead(id, rideId) {
  try {
    await api(`/notifications/${id}/read`, { method: 'PUT' });
    if (rideId) window.location.href = `/ride-detail.html?id=${rideId}`;
    else loadNotifications();
  } catch (_) {}
}

async function markAllNotifRead() {
  try {
    await api('/notifications/read-all', { method: 'PUT' });
    loadNotifications();
  } catch (_) {}
}

// Initialize navbar on every page
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  loadNotifications();
});
