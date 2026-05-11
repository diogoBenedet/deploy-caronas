const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sanitizeBody, sanitizeStr } = require('../middleware/validate');

const router = express.Router();

router.use(sanitizeBody);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.userId}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens JPG, PNG ou WEBP são permitidas'));
  }
});

// Atualizar perfil
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const name = sanitizeStr(req.body.name, 100);
    const phone = sanitizeStr(req.body.phone, 20);
    if (!name || !phone)
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    if (name.length < 2)
      return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });

    await User.update({ name, phone }, { where: { id: req.userId } });
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'phone', 'profile_photo'],
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload de foto
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.update({ profile_photo: photoUrl }, { where: { id: req.userId } });
    res.json({ profile_photo: photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Perfil público de um usuário (para passageiros verem o motorista)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'phone', 'profile_photo'],
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
