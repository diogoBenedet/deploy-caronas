# Carona Universitária — API REST

Sistema de caronas universitárias com autenticação JWT, gerenciamento de caronas, reservas, veículos e notificações.

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [MySQL](https://dev.mysql.com/downloads/) 8.0 ou superior **¹**

> **¹ Sem MySQL?** Veja a seção [Modo Mock](#modo-mock-sem-banco-de-dados) abaixo.

---

## Configuração (com MySQL)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASS=sua_senha_mysql
DB_NAME=carona_universitaria
PORT=3000
```

### 3. Criar o banco de dados

Acesse o MySQL e execute:

```sql
CREATE DATABASE carona_universitaria;
```

Ou via terminal:

```bash
mysql -u root -p -e "CREATE DATABASE carona_universitaria;"
```

### 4. Iniciar o servidor

```bash
npm start
```

O servidor irá criar as tabelas automaticamente na primeira execução.

Acesse: **http://localhost:3000**

---

## Modo Mock (sem banco de dados)

Utilize o servidor mock para testar a API sem precisar de MySQL. Os dados são armazenados em memória e resetados ao reiniciar.

```bash
npm run start:mock
```

Acesse: **http://localhost:3001**

**Usuários de teste** (senha: `senha123`):

| Nome              | E-mail                                  | Papel    |
|-------------------|-----------------------------------------|----------|
| Ana Santos        | ana.santos@universidade.edu.br          | Motorista|
| Carlos Lima       | carlos.lima@universidade.edu.br         | Passageiro|
| Beatriz Oliveira  | beatriz.oliveira@universidade.edu.br    | Motorista|
| Rafael Mendes     | rafael.mendes@universidade.edu.br       | Passageiro|
| Juliana Costa     | juliana.costa@universidade.edu.br       | Motorista|

---

## Scripts disponíveis

| Comando              | Descrição                                      |
|----------------------|------------------------------------------------|
| `npm start`          | Inicia o servidor com MySQL (produção)         |
| `npm run dev`        | Inicia com hot-reload via nodemon (MySQL)      |
| `npm run start:mock` | Inicia o servidor mock (sem banco)             |
| `npm run dev:mock`   | Inicia o mock com hot-reload                   |

---

## Endpoints da API

A URL base depende do modo utilizado:

- **MySQL:** `http://localhost:3000/api`
- **Mock:** `http://localhost:3001/api`

### Autenticação

| Método | Rota                  | Descrição               | Auth |
|--------|-----------------------|-------------------------|------|
| POST   | `/api/auth/register`  | Cadastrar novo usuário  | Não  |
| POST   | `/api/auth/login`     | Login (retorna JWT)     | Não  |
| GET    | `/api/auth/me`        | Dados do usuário logado | Sim  |

### Usuários

| Método | Rota                         | Descrição                        | Auth |
|--------|------------------------------|----------------------------------|------|
| GET    | `/api/users/:id`             | Buscar usuário por ID            | Sim  |
| PUT    | `/api/users/:id`             | Atualizar perfil                 | Sim  |
| POST   | `/api/users/:id/avatar`      | Upload de foto de perfil         | Sim  |

### Veículos

| Método | Rota                    | Descrição               | Auth |
|--------|-------------------------|-------------------------|------|
| GET    | `/api/vehicles`         | Listar veículos do usuário | Sim |
| POST   | `/api/vehicles`         | Cadastrar veículo       | Sim  |
| PUT    | `/api/vehicles/:id`     | Atualizar veículo       | Sim  |
| DELETE | `/api/vehicles/:id`     | Remover veículo         | Sim  |

### Caronas

| Método | Rota                              | Descrição                        | Auth |
|--------|-----------------------------------|----------------------------------|------|
| GET    | `/api/rides`                      | Listar caronas disponíveis       | Não  |
| POST   | `/api/rides`                      | Criar carona                     | Sim  |
| GET    | `/api/rides/:id`                  | Detalhes de uma carona           | Não  |
| PUT    | `/api/rides/:id`                  | Atualizar carona                 | Sim  |
| DELETE | `/api/rides/:id`                  | Cancelar carona                  | Sim  |
| GET    | `/api/rides/my`                   | Caronas do motorista logado      | Sim  |
| POST   | `/api/rides/:id/reserve`          | Reservar uma carona              | Sim  |
| PUT    | `/api/rides/:id/reservations/:rid/confirm` | Confirmar presença do passageiro | Sim |

### Notificações

| Método | Rota                          | Descrição                      | Auth |
|--------|-------------------------------|--------------------------------|------|
| GET    | `/api/notifications`          | Listar notificações            | Sim  |
| PUT    | `/api/notifications/:id/read` | Marcar notificação como lida   | Sim  |

---

## Autenticação

A API utiliza **JWT (JSON Web Token)**. Após o login, inclua o token no header de todas as requisições protegidas:

```
Authorization: Bearer <seu_token>
```

---

## Coleção Postman / Insomnia

O arquivo `carona-universitaria.postman_collection.json` contém todos os endpoints configurados e pode ser importado no **Postman** ou **Insomnia**.

**Como importar no Postman:**
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `carona-universitaria.postman_collection.json`
4. Execute o endpoint `Auth > Login` — o token JWT será salvo automaticamente na coleção

**Como importar no Insomnia:**
1. Abra o Insomnia
2. Clique em **File > Import**
3. Selecione o arquivo `carona-universitaria.postman_collection.json`
