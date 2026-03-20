require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/rides', require('./routes/rides'));

// Fallback: servir index.html para rotas do frontend
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Conectado ao MySQL com sucesso.');

  const server = app.listen(PORT, () => {
    console.log(`\n🚗 Carona Universitária rodando em http://localhost:${PORT}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nErro: A porta ${PORT} já está em uso.`);
      console.error(`Feche o outro processo e tente novamente.`);
      console.error(`No Windows, execute no terminal: taskkill /F /IM node.exe\n`);
    } else {
      console.error('Erro no servidor:', err.message);
    }
    process.exit(1);
  });
}

start().catch(err => {
  console.error('Erro ao iniciar o servidor:', err.message);
  process.exit(1);
});
