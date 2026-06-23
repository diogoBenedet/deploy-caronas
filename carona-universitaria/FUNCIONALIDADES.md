# Documentação do Sistema — Carona Universitária

**Versão:** 1.0  
**Data:** Junho de 2026  
**Tipo:** Trabalho Acadêmico — Desenvolvimento Web  

---

## 1. Introdução

O **Carona Universitária** é um sistema web desenvolvido com o objetivo de facilitar o compartilhamento de caronas entre estudantes universitários. A plataforma conecta motoristas e passageiros dentro do ambiente acadêmico, promovendo economia nos custos de transporte, redução do tráfego urbano e incentivo à mobilidade sustentável.

O sistema permite que qualquer estudante cadastrado possa tanto oferecer quanto solicitar caronas, gerenciar suas viagens e se comunicar com outros usuários por meio de notificações integradas.

---

## 2. Objetivos

### 2.1 Objetivo Geral

Desenvolver uma aplicação web funcional que gerencie o ciclo completo de caronas universitárias, desde o cadastro de usuários até a finalização de viagens.

### 2.2 Objetivos Específicos

- Permitir o cadastro e autenticação segura de usuários
- Disponibilizar um sistema de publicação e busca de caronas
- Gerenciar reservas de vagas entre motoristas e passageiros
- Notificar usuários sobre eventos relevantes às suas caronas
- Oferecer uma interface responsiva e acessível em diferentes dispositivos

---

## 3. Escopo do Sistema

O sistema contempla as seguintes áreas funcionais:

| Módulo | Descrição |
|---|---|
| Autenticação | Cadastro, login e controle de sessão |
| Dashboard | Painel com estatísticas e resumo do usuário |
| Caronas | Publicação, busca, detalhes e reservas |
| Veículos | Cadastro e gerenciamento de veículos |
| Perfil | Edição de dados pessoais e foto |
| Notificações | Alertas de eventos entre usuários |

---

## 4. Tecnologias Utilizadas

### 4.1 Backend

| Tecnologia | Função |
|---|---|
| Node.js | Ambiente de execução JavaScript no servidor |
| Express.js | Framework para criação de rotas e API REST |
| Sequelize ORM | Mapeamento objeto-relacional com o banco de dados |
| MySQL | Sistema de gerenciamento de banco de dados relacional |
| JSON Web Token (JWT) | Autenticação stateless e controle de sessão |
| bcryptjs | Hashing seguro de senhas |
| Multer | Upload e armazenamento de imagens no servidor |

### 4.2 Frontend

| Tecnologia | Função |
|---|---|
| HTML5 | Estruturação das páginas |
| CSS3 | Estilização e responsividade |
| JavaScript (Vanilla) | Interatividade e consumo da API |

### 4.3 Ambiente de Desenvolvimento

| Ferramenta | Função |
|---|---|
| Nodemon | Reinicialização automática do servidor em desenvolvimento |
| dotenv | Gerenciamento de variáveis de ambiente |
| Git / GitHub | Versionamento e hospedagem do código-fonte |

---

## 5. Arquitetura do Sistema

O sistema segue o padrão **MVC (Model-View-Controller)** com separação entre frontend e backend através de uma **API REST**.

```
carona-universitaria/
│
├── server.js                  # Ponto de entrada — configuração do Express e banco
│
├── routes/                    # Controladores das rotas da API
│   ├── auth.js                # Autenticação (registro e login)
│   ├── rides.js               # Gerenciamento de caronas
│   ├── bookings.js            # Reservas de passageiros
│   ├── vehicles.js            # Veículos do usuário
│   ├── notifications.js       # Notificações do sistema
│   └── users.js               # Dados do perfil
│
├── models/                    # Modelos Sequelize (entidades do banco)
│   ├── User.js
│   ├── Ride.js
│   ├── Booking.js
│   ├── Vehicle.js
│   └── Notification.js
│
├── middleware/
│   ├── auth.js                # Verificação de token JWT
│   └── validate.js            # Sanitização e validação de entradas
│
└── public/                    # Frontend (arquivos estáticos servidos pelo Express)
    ├── index.html
    ├── dashboard.html
    ├── find-rides.html
    ├── ride-detail.html
    ├── offer-ride.html
    ├── my-rides.html
    ├── profile.html
    ├── login.html
    ├── register.html
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js             # Utilitários globais (API, autenticação, navbar, toasts)
        ├── dashboard.js
        ├── find-rides.js
        ├── ride-detail.js
        ├── offer-ride.js
        ├── my-rides.js
        ├── profile.js
        ├── login.js
        └── register.js
```

---

## 6. Modelo de Dados

### 6.1 Entidades Principais

**User** — Usuário do sistema  
`id, name, email, phone, password_hash, profile_photo, created_at`

**Ride** — Carona publicada  
`id, driver_id, vehicle_id, origin, destination, departure_time, price, seats, notes, status, created_at`

**Booking** — Reserva de passageiro  
`id, ride_id, passenger_id, status, created_at`

**Vehicle** — Veículo do motorista  
`id, user_id, model, color, plate, seats`

**Notification** — Notificação do sistema  
`id, user_id, message, type, read, created_at`

### 6.2 Relacionamentos

- Um **usuário** pode ter vários **veículos**
- Um **usuário** pode oferecer várias **caronas** (como motorista)
- Uma **carona** pertence a um **veículo** e a um **motorista**
- Uma **carona** pode ter várias **reservas** (passageiros)
- Um **usuário** pode ter várias **notificações**

---

## 7. Descrição dos Módulos

### 7.1 Módulo de Autenticação

Gerencia o acesso ao sistema com segurança.

**Funcionalidades:**
- Cadastro com nome, e-mail, telefone e senha
- Login com geração de token JWT (validade de 7 dias)
- Logout com invalidação da sessão no cliente
- Redirecionamento automático: usuário autenticado é enviado ao Dashboard ao acessar a página inicial
- Proteção de rotas: páginas autenticadas verificam o token antes de carregar

**Segurança:**
- Senhas armazenadas com hash bcrypt (fator de custo 10)
- Token JWT assinado com chave secreta definida em variável de ambiente
- Sanitização de todos os campos de entrada para prevenção de injeção

---

### 7.2 Módulo Dashboard

Painel principal do usuário após o login.

**Funcionalidades:**
- **Estatísticas em tempo real:**
  - Total de caronas oferecidas pelo usuário
  - Total de caronas utilizadas como passageiro
  - Número de veículos cadastrados
  - Quantidade de caronas disponíveis na plataforma no momento
- **Próximas caronas:** lista das viagens futuras (como motorista ou passageiro), ordenadas por data de partida
- **Ações rápidas:** atalhos para as principais funcionalidades do sistema

---

### 7.3 Módulo de Busca de Caronas

Permite localizar caronas disponíveis na plataforma.

**Funcionalidades:**
- Busca por texto em **origem** e **destino**
- **Paginação server-side** para carregamento eficiente de grandes volumes de dados
- **Filtros avançados** (seção expansível):
  - Data de partida
  - Preço máximo por pessoa
  - Número mínimo de vagas disponíveis
- Resultados exibidos em cards com: rota, data/hora, motorista, preço, vagas e status
- Somente caronas com status **ativo** e partida **futura** são exibidas

---

### 7.4 Módulo de Detalhes da Carona

Exibe todas as informações de uma carona selecionada.

**Funcionalidades:**
- Rota completa (origem → destino)
- Data, horário e preço
- Dados do motorista: nome e telefone para contato
- Dados do veículo: modelo, cor e placa
- Observações adicionais cadastradas pelo motorista
- **Reserva de vaga** com modal de confirmação
- Indicação visual quando o usuário já possui reserva ativa na carona

---

### 7.5 Módulo de Publicação de Caronas

Permite ao motorista cadastrar uma nova carona.

**Funcionalidades:**
- Seleção do veículo cadastrado no perfil
- Definição de origem, destino, data e horário de partida
- Preço por pessoa com **máscara monetária em Real (R$)**, limitado a R$ 9.999,99
- Número de vagas disponíveis
- Campo de observações opcionais
- Validação que impede a publicação sem veículo cadastrado, com alerta e link direto para cadastro

---

### 7.6 Módulo de Gerenciamento de Caronas (Minhas Caronas)

Central de controle das caronas do usuário, dividida em duas abas:

#### Aba — Como Motorista

- Listagem de todas as caronas publicadas com status atualizado
- **Finalizar carona:** disponível somente após o horário de partida; marca a viagem como concluída e notifica os passageiros confirmados
- **Cancelar carona:** disponível antes da partida; notifica todos os passageiros e libera suas vagas
- Visualização dos passageiros confirmados com nome e telefone de contato

#### Aba — Como Passageiro

- Listagem de todas as reservas realizadas com status
- **Cancelar reserva:** remove a participação do usuário e devolve a vaga à carona

---

### 7.7 Módulo de Perfil

Área de gerenciamento da conta do usuário.

#### Dados Pessoais
- Edição de nome e telefone
- E-mail exibido somente para consulta (imutável após cadastro)
- Upload de **foto de perfil** com pré-visualização imediata; foto exibida na barra de navegação

#### Meus Veículos
- Cadastro de veículo com placa, modelo, cor e número de vagas
- Edição e exclusão de veículos
- Suporte a múltiplos veículos por usuário

---

### 7.8 Módulo de Notificações

Sistema de alertas integrado à barra de navegação.

**Eventos que geram notificação:**
- Nova reserva realizada em uma carona do motorista
- Cancelamento de reserva por um passageiro
- Cancelamento de carona pelo motorista
- Finalização de carona pelo motorista

**Interface:**
- Ícone de sino na navbar com **badge numérico** indicando notificações não lidas
- Painel deslizante com lista de notificações ordenadas por data
- Ação de marcar todas as notificações como lidas

---

## 8. Interface e Experiência do Usuário

### 8.1 Responsividade

O sistema é adaptado para diferentes tamanhos de tela:
- Em dispositivos móveis, a navbar colapsa em um **menu hamburguer**
- Layouts em grade ajustam-se de múltiplas colunas para coluna única
- Botões e campos respeitam tamanho mínimo de área de toque (44px)

### 8.2 Feedback Visual

- **Skeleton loaders** exibidos durante o carregamento de dados, evitando telas em branco
- **Estados de loading** nos botões durante requisições para prevenir cliques duplos
- **Toasts** (notificações flutuantes) de sucesso, erro e aviso após cada ação
- **Modais de confirmação** para ações irreversíveis (cancelar e finalizar caronas)

### 8.3 Navegação Condicional

A barra de navegação adapta seus itens conforme o estado de autenticação:

| Estado | Itens exibidos |
|---|---|
| Não autenticado | Início · Buscar Caronas · Entrar · Cadastrar |
| Autenticado | Dashboard · Buscar Caronas · Oferecer Carona · Minhas Caronas · Notificações · Perfil |

---

## 9. API REST — Principais Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Cadastro de novo usuário |
| POST | /api/auth/login | Login e geração de token |
| GET | /api/auth/me | Dados do usuário autenticado |
| GET | /api/rides | Listar caronas disponíveis (com filtros e paginação) |
| POST | /api/rides | Publicar nova carona |
| GET | /api/rides/:id | Detalhes de uma carona |
| PUT | /api/rides/:id/complete | Finalizar carona |
| DELETE | /api/rides/:id | Cancelar carona |
| GET | /api/rides/my/driver | Caronas do usuário como motorista |
| GET | /api/rides/my/passenger | Caronas do usuário como passageiro |
| POST | /api/bookings | Reservar vaga em carona |
| DELETE | /api/bookings/:id | Cancelar reserva |
| GET | /api/vehicles/my | Listar veículos do usuário |
| POST | /api/vehicles | Cadastrar veículo |
| PUT | /api/vehicles/:id | Editar veículo |
| DELETE | /api/vehicles/:id | Remover veículo |
| GET | /api/notifications | Listar notificações do usuário |
| PUT | /api/notifications/read-all | Marcar todas como lidas |

---

## 10. Fluxo de Uso do Sistema

```
[Acesso]
    │
    ├── Não cadastrado ──► Tela de Cadastro ──► Login ──► Dashboard
    │
    └── Cadastrado ──────► Tela de Login ────► Dashboard
                                                    │
                        ┌───────────────────────────┼───────────────────────────┐
                        │                           │                           │
                 [Oferecer Carona]           [Buscar Carona]             [Meu Perfil]
                        │                           │                           │
               Preenche formulário          Pesquisa e filtra         Edita dados pessoais
                        │                           │                   Gerencia veículos
               Carona publicada             Seleciona carona
                        │                           │
               Passageiros reservam         Reserva confirmada
                        │                           │
               Motorista visualiza          Passageiro aguarda
               passageiros                 notificações
                        │
               [Após a viagem]
                        │
               Motorista finaliza ──► Passageiros notificados ──► Status: Finalizada
```

---

## 11. Segurança do Sistema

| Medida | Implementação |
|---|---|
| Hash de senhas | bcrypt com salt automático |
| Autenticação | JWT verificado em todas as rotas protegidas |
| Autorização | Usuário só modifica seus próprios dados |
| Sanitização | Remoção de caracteres maliciosos nas entradas |
| Validação dupla | Validações aplicadas no frontend e no backend |
| Upload seguro | Tipos de arquivo restringidos pelo Multer |
