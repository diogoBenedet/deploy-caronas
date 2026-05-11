const express = require('express');
const { Op } = require('sequelize');
const { sequelize, Ride, User, Vehicle, Reservation, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sanitizeBody, sanitizeStr, validateRideBody, validatePositiveFloat, validatePositiveInt } = require('../middleware/validate');

const router = express.Router();

router.use(sanitizeBody);

// Listar caronas (com filtros)
router.get('/', async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    const where = {
      status: 'active',
      available_seats: { [Op.gt]: 0 },
      departure_time: { [Op.gt]: new Date() },
    };

    if (origin) where.origin = { [Op.like]: `%${origin}%` };
    if (destination) where.destination = { [Op.like]: `%${destination}%` };
    if (date) {
      where[Op.and] = sequelize.where(
        sequelize.fn('DATE', sequelize.col('departure_time')),
        date
      );
    }

    const rides = await Ride.findAll({
      where,
      include: [
        { model: User, as: 'driver', attributes: ['name', 'phone', 'profile_photo'] },
        { model: Vehicle, attributes: ['model', 'color', 'plate'] },
      ],
      order: [['departure_time', 'ASC']],
    });

    const result = rides.map(r => {
      const data = r.toJSON();
      return {
        ...data,
        driver_name: data.driver.name,
        driver_phone: data.driver.phone,
        driver_photo: data.driver.profile_photo,
        vehicle_model: data.Vehicle.model,
        vehicle_color: data.Vehicle.color,
        vehicle_plate: data.Vehicle.plate,
        driver: undefined,
        Vehicle: undefined,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Minhas caronas (como motorista) — deve vir antes de /:id
router.get('/my/driver', authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.findAll({
      where: { driver_id: req.userId },
      include: [{ model: Vehicle, attributes: ['model', 'color', 'plate'] }],
      attributes: {
        include: [[
          sequelize.literal(`(SELECT COUNT(*) FROM reservations WHERE ride_id = \`Ride\`.\`id\` AND status = 'confirmed')`),
          'confirmed_passengers',
        ]],
      },
      order: [['departure_time', 'DESC']],
    });

    const result = rides.map(r => {
      const data = r.toJSON();
      return {
        ...data,
        vehicle_model: data.Vehicle.model,
        vehicle_color: data.Vehicle.color,
        vehicle_plate: data.Vehicle.plate,
        Vehicle: undefined,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Minhas reservas (como passageiro) — deve vir antes de /:id
router.get('/my/passenger', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.findAll({
      where: { passenger_id: req.userId },
      include: [
        {
          model: Ride,
          include: [
            { model: User, as: 'driver', attributes: ['name', 'phone', 'profile_photo'] },
            { model: Vehicle, attributes: ['model', 'color', 'plate'] },
          ],
        },
      ],
      order: [[Ride, 'departure_time', 'DESC']],
    });

    const result = reservations.map(res => {
      const r = res.Ride.toJSON();
      return {
        ...r,
        driver_name: r.driver.name,
        driver_phone: r.driver.phone,
        driver_photo: r.driver.profile_photo,
        vehicle_model: r.Vehicle.model,
        vehicle_color: r.Vehicle.color,
        vehicle_plate: r.Vehicle.plate,
        driver: undefined,
        Vehicle: undefined,
        reservation_id: res.id,
        reservation_status: res.status,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detalhe de uma carona
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id, {
      include: [
        { model: User, as: 'driver', attributes: ['name', 'phone', 'profile_photo'] },
        { model: Vehicle, attributes: ['model', 'color', 'plate', 'seats'] },
      ],
    });
    if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });

    const passengers = await Reservation.findAll({
      where: { ride_id: req.params.id, status: 'confirmed' },
      include: [{ model: User, as: 'passenger', attributes: ['id', 'name', 'profile_photo'] }],
    });

    const data = ride.toJSON();
    res.json({
      ...data,
      driver_name: data.driver.name,
      driver_phone: data.driver.phone,
      driver_photo: data.driver.profile_photo,
      vehicle_model: data.Vehicle.model,
      vehicle_color: data.Vehicle.color,
      vehicle_plate: data.Vehicle.plate,
      vehicle_seats: data.Vehicle.seats,
      driver: undefined,
      Vehicle: undefined,
      passengers: passengers.map(p => p.passenger),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar carona
router.post('/', authMiddleware, async (req, res) => {
  try {
    const validationError = validateRideBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const { vehicle_id, origin, destination, departure_time, price, available_seats, notes } = req.body;

    const vehicle = await Vehicle.findOne({ where: { id: vehicle_id, user_id: req.userId } });
    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

    if (new Date(departure_time) <= new Date())
      return res.status(400).json({ error: 'Horário de saída deve ser no futuro' });

    const seats = parseInt(available_seats, 10);
    if (seats < 1 || seats > vehicle.seats)
      return res.status(400).json({ error: `Vagas disponíveis deve ser entre 1 e ${vehicle.seats}` });

    const safeNotes = notes ? sanitizeStr(notes, 500) : '';

    const ride = await Ride.create({
      driver_id: req.userId,
      vehicle_id: parseInt(vehicle_id, 10),
      origin: sanitizeStr(origin),
      destination: sanitizeStr(destination),
      departure_time,
      price: parseFloat(price),
      available_seats: seats,
      total_seats: seats,
      notes: safeNotes,
    });

    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar carona (motorista)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({ where: { id: req.params.id, driver_id: req.userId } });
    if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });

    await ride.update({ status: 'cancelled' });

    // Notifica todos os passageiros confirmados
    const reservations = await Reservation.findAll({ where: { ride_id: ride.id, status: 'confirmed' } });
    await Promise.all(reservations.map(r =>
      Notification.create({
        user_id: r.passenger_id,
        type: 'ride_cancelled',
        title: 'Carona cancelada',
        message: `A carona de ${ride.origin} para ${ride.destination} foi cancelada pelo motorista.`,
        ride_id: ride.id,
      })
    ));

    res.json({ message: 'Carona cancelada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reservar vaga
router.post('/:id/reserve', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findByPk(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Carona não encontrada' });
    if (ride.status !== 'active') return res.status(400).json({ error: 'Carona não está ativa' });
    if (ride.available_seats <= 0) return res.status(400).json({ error: 'Sem vagas disponíveis' });
    if (ride.driver_id === req.userId) return res.status(400).json({ error: 'Você é o motorista desta carona' });

    const existing = await Reservation.findOne({ where: { ride_id: req.params.id, passenger_id: req.userId } });
    if (existing) return res.status(409).json({ error: 'Você já reservou esta carona' });

    await Reservation.create({ ride_id: req.params.id, passenger_id: req.userId });
    await ride.decrement('available_seats');

    // Notifica o motorista
    const passenger = await User.findByPk(req.userId, { attributes: ['name'] });
    await Notification.create({
      user_id: ride.driver_id,
      type: 'reservation_confirmed',
      title: 'Nova reserva!',
      message: `${passenger.name} reservou uma vaga na sua carona de ${ride.origin} para ${ride.destination}.`,
      ride_id: ride.id,
    });

    res.status(201).json({ message: 'Vaga reservada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar reserva (passageiro)
router.delete('/:id/reserve', authMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: { ride_id: req.params.id, passenger_id: req.userId },
    });
    if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

    const ride = await Ride.findByPk(req.params.id);
    await reservation.destroy();
    await Ride.increment('available_seats', { where: { id: req.params.id } });

    // Notifica o motorista
    if (ride) {
      const passenger = await User.findByPk(req.userId, { attributes: ['name'] });
      await Notification.create({
        user_id: ride.driver_id,
        type: 'reservation_cancelled',
        title: 'Reserva cancelada',
        message: `${passenger.name} cancelou a reserva na sua carona de ${ride.origin} para ${ride.destination}.`,
        ride_id: ride.id,
      });
    }

    res.json({ message: 'Reserva cancelada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
