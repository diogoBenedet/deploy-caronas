let cancelRideId = null;
let finalizeRideId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  setupTabs();
  setupCancelModal();
  setupFinalizeModal();
  await Promise.all([loadDriverRides(), loadPassengerRides()]);
});

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      document.getElementById('tabDriver').style.display = tab.dataset.tab === 'driver' ? '' : 'none';
      document.getElementById('tabPassenger').style.display = tab.dataset.tab === 'passenger' ? '' : 'none';
    });
  });
}

function setupFinalizeModal() {
  const modal = document.getElementById('finalizeModal');
  document.getElementById('closeFinalizeModal').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('finalizeModalNo').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('finalizeModalYes').addEventListener('click', async () => {
    if (!finalizeRideId) return;
    modal.classList.add('hidden');
    try {
      await api(`/rides/${finalizeRideId}/complete`, { method: 'PUT' });
      showToast('Carona finalizada com sucesso!', 'success');
      await loadDriverRides();
    } catch (e) {
      showToast(e.message || 'Erro ao finalizar carona.', 'error');
    }
    finalizeRideId = null;
  });
}

function setupCancelModal() {
  const modal = document.getElementById('cancelModal');
  document.getElementById('closeCancelModal').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('cancelModalNo').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('cancelModalYes').addEventListener('click', async () => {
    if (!cancelRideId) return;
    modal.classList.add('hidden');
    try {
      await api(`/rides/${cancelRideId}`, { method: 'DELETE' });
      showToast('Carona cancelada.', 'success');
      await loadDriverRides();
    } catch (e) {
      showToast(e.message || 'Erro ao cancelar carona.', 'error');
    }
    cancelRideId = null;
  });
}

async function loadDriverRides() {
  const list = document.getElementById('driverRidesList');
  try {
    const rides = await api('/rides/my/driver');
    if (rides.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
          <h3>Nenhuma carona oferecida</h3>
          <p>Você ainda não ofereceu nenhuma carona. Que tal começar agora?</p>
          <a href="/offer-ride.html" class="btn btn-primary">Oferecer carona</a>
        </div>`;
      return;
    }
    list.innerHTML = rides.map(r => {
      const departed = new Date(r.departure_time) <= new Date();
      const isActive = r.status === 'active';
      const canFinalize = isActive && departed;
      const canCancel = isActive && !departed;
      return `
        <div class="card" style="cursor:default;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
            <div>
              <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.25rem;cursor:pointer;" onclick="window.location='/ride-detail.html?id=${r.id}'">
                ${r.origin} → ${r.destination}
              </div>
              <div style="color:var(--text-muted);font-size:0.875rem;margin-bottom:0.5rem;">${formatDateTime(r.departure_time)}</div>
              <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
                ${statusBadge(r.status)}
                <span style="font-size:0.875rem;color:var(--text-muted);">
                  <strong>${r.confirmed_passengers || 0}</strong> passageiro${r.confirmed_passengers !== 1 ? 's' : ''} / ${r.total_seats} vagas
                </span>
                <span style="font-size:0.875rem;font-weight:600;color:var(--secondary);">${formatPrice(r.price)}</span>
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;flex-shrink:0;">
              <a href="/ride-detail.html?id=${r.id}" class="btn btn-outline btn-sm">Ver detalhes</a>
              ${canFinalize ? `<button class="btn btn-primary btn-sm" onclick="openFinalizeModal(${r.id})">Finalizar</button>` : ''}
              ${canCancel ? `<button class="btn btn-danger btn-sm" onclick="openCancelModal(${r.id})">Cancelar</button>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<p class="text-muted">Erro ao carregar suas caronas.</p>`;
  }
}

async function loadPassengerRides() {
  const list = document.getElementById('passengerRidesList');
  try {
    const rides = await api('/rides/my/passenger');
    if (rides.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <h3>Nenhuma reserva</h3>
          <p>Você ainda não reservou nenhuma carona. Explore as caronas disponíveis.</p>
          <a href="/find-rides.html" class="btn btn-primary">Buscar caronas</a>
        </div>`;
      return;
    }
    list.innerHTML = rides.map(r => {
      const isActive = r.reservation_status === 'confirmed' && r.status === 'active' && new Date(r.departure_time) > new Date();
      const canCancel = isActive;
      const waLink = `https://wa.me/55${r.driver_phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${r.driver_name}! Reservei uma vaga na carona (${r.origin} → ${r.destination}) no Carona Uni.`)}`;

      return `
        <div class="card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
            <div>
              <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.25rem;">
                ${r.origin} → ${r.destination}
              </div>
              <div style="color:var(--text-muted);font-size:0.875rem;margin-bottom:0.5rem;">${formatDateTime(r.departure_time)}</div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.75rem;">
                ${statusBadge(r.status)}
                ${r.presence_confirmed
                  ? '<span class="badge badge-success" style="display:inline-flex;align-items:center;gap:0.3rem;">Presença confirmada <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg></span>'
                  : (isActive ? '<span class="badge badge-warning">Aguardando confirmação do motorista</span>' : '')}
                <span class="badge badge-muted">${r.vehicle_model} · ${r.vehicle_plate}</span>
                <span style="font-weight:600;color:var(--secondary);">${formatPrice(r.price)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:var(--text-muted);">
                ${makeAvatar(r.driver_name, r.driver_photo, 24)}
                Motorista: <strong>${r.driver_name}</strong> &bull; <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="vertical-align:middle;"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> ${r.driver_phone}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem;flex-shrink:0;">
              <a href="/ride-detail.html?id=${r.id}" class="btn btn-outline btn-sm">Ver detalhes</a>
              <a href="${waLink}" target="_blank" rel="noopener" class="btn whatsapp-btn btn-sm">WhatsApp</a>
              ${canCancel ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="cancelReservation(${r.id})">Cancelar reserva</button>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<p class="text-muted">Erro ao carregar suas reservas.</p>`;
  }
}

function openCancelModal(id) {
  cancelRideId = id;
  document.getElementById('cancelModal').classList.remove('hidden');
}

function openFinalizeModal(id) {
  finalizeRideId = id;
  document.getElementById('finalizeModal').classList.remove('hidden');
}

async function cancelReservation(rideId) {
  if (!confirm('Tem certeza que deseja cancelar sua reserva?')) return;
  try {
    await api(`/rides/${rideId}/reserve`, { method: 'DELETE' });
    showToast('Reserva cancelada.', 'success');
    await loadPassengerRides();
  } catch (e) {
    showToast(e.message || 'Erro ao cancelar reserva.', 'error');
  }
}
