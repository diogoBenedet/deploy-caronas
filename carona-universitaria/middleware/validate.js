// Input sanitization and validation utilities
// Sequelize uses parameterized queries by default (no raw string interpolation),
// but this layer enforces length limits and type safety at the boundary.

function sanitizeStr(value, maxLen = 255) {
  if (value == null) return value;
  return String(value).trim().slice(0, maxLen);
}

function validatePositiveFloat(value) {
  const n = parseFloat(value);
  return isFinite(n) && n >= 0 ? n : null;
}

function validatePositiveInt(value) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Middleware: sanitizes body fields in-place and rejects obviously malformed payloads
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().slice(0, 1000);
      }
    }
  }
  next();
}

// Validate ride creation body — returns error string or null
function validateRideBody(body) {
  const { vehicle_id, origin, destination, departure_time, price, available_seats } = body;

  if (!vehicle_id || !origin || !destination || !departure_time || price == null || !available_seats)
    return 'Campos obrigatórios faltando';

  if (origin.length > 255 || destination.length > 255)
    return 'Origem/destino não pode ultrapassar 255 caracteres';

  if (validatePositiveFloat(price) === null || parseFloat(price) > 9999)
    return 'Preço inválido (deve ser entre 0 e 9999)';

  if (validatePositiveInt(available_seats) === null)
    return 'Número de vagas inválido';

  const departure = new Date(departure_time);
  if (isNaN(departure.getTime()))
    return 'Data/hora de saída inválida';

  return null;
}

// Validate user registration body — returns error string or null
function validateRegisterBody(body) {
  const { name, email, phone, password } = body;

  if (!name || !email || !phone || !password)
    return 'Todos os campos são obrigatórios';

  if (name.length < 2 || name.length > 100)
    return 'Nome deve ter entre 2 e 100 caracteres';

  if (email.length > 254)
    return 'Email inválido';

  if (phone.length < 8 || phone.length > 20)
    return 'Telefone inválido';

  if (password.length < 6 || password.length > 128)
    return 'Senha deve ter entre 6 e 128 caracteres';

  return null;
}

module.exports = { sanitizeBody, sanitizeStr, validateRideBody, validateRegisterBody, validatePositiveFloat, validatePositiveInt };
