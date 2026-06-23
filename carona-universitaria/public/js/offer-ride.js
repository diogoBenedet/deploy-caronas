document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rideDate').min = today;
  document.getElementById('rideDate').value = today;

  setupPriceMask();
  await loadVehicles();

  document.getElementById('offerRideForm').addEventListener('submit', handleSubmit);
});

function setupPriceMask() {
  const input = document.getElementById('ridePrice');
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 6); // max 999999 centavos = R$ 9.999,99
    if (!digits) { input.value = ''; return; }
    const cents = parseInt(digits, 10);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;
    input.value = `R$ ${reais.toLocaleString('pt-BR')},${String(centavos).padStart(2, '0')}`;
  });
}

function parsePriceValue() {
  const raw = document.getElementById('ridePrice').value;
  if (!raw) return null;
  return parseFloat(raw.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
}

async function loadVehicles() {
  const select = document.getElementById('vehicleSelect');
  const alertDiv = document.getElementById('noVehicleAlert');
  try {
    const vehicles = await api('/vehicles/my');
    if (vehicles.length === 0) {
      select.innerHTML = '<option value="">Nenhum veículo cadastrado</option>';
      select.disabled = true;
      if (alertDiv) { alertDiv.style.display = 'flex'; }
      document.getElementById('submitRideBtn').disabled = true;
      return;
    }
    if (alertDiv) { alertDiv.style.display = 'none'; }
    select.innerHTML = vehicles.map(v =>
      `<option value="${v.id}" data-seats="${v.seats}">${v.plate} — ${v.model} ${v.color}</option>`
    ).join('');
    updateMaxSeats();
    select.addEventListener('change', updateMaxSeats);
  } catch (e) {
    select.innerHTML = '<option value="">Erro ao carregar veículos</option>';
    select.disabled = true;
  }
}

function updateMaxSeats() {
  const select = document.getElementById('vehicleSelect');
  const seatsInput = document.getElementById('rideSeats');
  const selected = select.options[select.selectedIndex];
  if (selected && selected.dataset.seats) {
    const max = parseInt(selected.dataset.seats);
    seatsInput.max = max;
    seatsInput.placeholder = `1 a ${max}`;
    if (parseInt(seatsInput.value) > max) seatsInput.value = max;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('submitRideBtn');
  const vehicleId = document.getElementById('vehicleSelect').value;
  const origin = document.getElementById('rideOrigin').value.trim();
  const destination = document.getElementById('rideDestination').value.trim();
  const date = document.getElementById('rideDate').value;
  const time = document.getElementById('rideTime').value;
  const price = parsePriceValue();
  const seats = document.getElementById('rideSeats').value;
  const notes = document.getElementById('rideNotes').value.trim();

  if (!vehicleId || !origin || !destination || !date || !time || price === null || !seats) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  const departure_time = `${date}T${time}:00`;

  if (new Date(departure_time) <= new Date()) {
    showToast('O horário de saída deve ser no futuro.', 'error');
    return;
  }

  setButtonLoading(btn, true, 'Publicando…');

  try {
    await api('/rides', {
      method: 'POST',
      body: JSON.stringify({ vehicle_id: vehicleId, origin, destination, departure_time, price, available_seats: seats, notes })
    });
    showToast('Carona publicada com sucesso!', 'success');
    setTimeout(() => window.location.href = '/my-rides.html', 1000);
  } catch (err) {
    showToast(err.message || 'Erro ao publicar carona.', 'error');
    setButtonLoading(btn, false);
  }
}
