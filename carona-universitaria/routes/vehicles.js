const express = require('express');
const { Vehicle } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Cadastrar veículo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { plate, model, color, seats } = req.body;
    if (!plate || !model || !color || !seats)
      return res.status(400).json({ error: 'Todos os campos do veículo são obrigatórios' });

    if (seats < 1 || seats > 10)
      return res.status(400).json({ error: 'Número de vagas inválido (1-10)' });

    const vehicle = await Vehicle.create({
      user_id: req.userId,
      plate: plate.toUpperCase(),
      model,
      color,
      seats: parseInt(seats),
    });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Meus veículos
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
    });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar veículo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

    const { plate, model, color, seats } = req.body;
    await vehicle.update({
      plate: plate ? plate.toUpperCase() : vehicle.plate,
      model: model || vehicle.model,
      color: color || vehicle.color,
      seats: seats || vehicle.seats,
    });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar veículo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });

    await vehicle.destroy();
    res.json({ message: 'Veículo removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
