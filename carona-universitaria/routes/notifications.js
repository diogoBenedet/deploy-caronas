const express = require('express');
const { Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Lista notificações do usuário logado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unread = notifications.filter(n => !n.read).length;
    res.json({ notifications, unread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marca uma notificação como lida
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
    await notification.update({ read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marca todas como lidas
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.update({ read: true }, { where: { user_id: req.userId, read: false } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
