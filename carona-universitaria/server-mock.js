/**
 * server-mock.js — Servidor de desenvolvimento com dados em memória
 *
 * Execução:  node server-mock.js
 * Base URL:  http://localhost:3001/api
 *
 * Rotas disponíveis:
 *   /api/auth          — autenticação (register, login, me)
 *   /api/users         — usuários
 *   /api/vehicles      — veículos
 *   /api/rides         — caronas
 *   /api/reservations  — reservas
 *
 * ATENÇÃO: os dados são reiniciados a cada vez que o servidor é reiniciado.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// ─── Middlewares globais ──────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Rotas da API Mock ────────────────────────────────────────
app.use('/api/auth', require('./mock/routes/auth'));
app.use('/api/users', require('./mock/routes/users'));
app.use('/api/vehicles', require('./mock/routes/vehicles'));
app.use('/api/rides', require('./mock/routes/rides'));
app.use('/api/reservations', require('./mock/routes/reservations'));

// ─── Rota raiz ────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'Carona Universitária — API Mock',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      rides: '/api/rides',
      reservations: '/api/reservations',
    },
    note: 'Dados em memória — reiniciados a cada restart do servidor',
  });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Inicialização ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚗  Carona Universitária — Mock Server`);
  console.log(`📡  API disponível em: http://localhost:${PORT}/api`);
  console.log(`\nUsuários de teste (todos com senha: senha123):`);
  console.log(`  ana.santos@universidade.edu.br`);
  console.log(`  carlos.lima@universidade.edu.br`);
  console.log(`  beatriz.oliveira@universidade.edu.br`);
  console.log(`  rafael.mendes@universidade.edu.br`);
  console.log(`  juliana.costa@universidade.edu.br\n`);
});
