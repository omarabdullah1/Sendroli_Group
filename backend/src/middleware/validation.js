const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['Admin', 'Financial', 'Designer', 'Receptionist']),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
];

// Client validation rules
const clientValidation = [
  body('name').trim().notEmpty().escape(),
  body('phone').trim().notEmpty().escape(),
  body('factoryName').trim().notEmpty().escape(),
  body('address').optional().trim().escape(),
  body('notes').optional().trim().escape(),
  validate,
];

// Order validation rules
const orderValidation = [
  body('client').isMongoId(),
  body('repeats').isInt({ min: 1 }),
  body('size').trim().notEmpty().escape(),
  body('type').trim().notEmpty().escape(),
  body('price').isFloat({ min: 0 }),
  body('deposit').isFloat({ min: 0 }),
  body('description').optional().trim().escape(),
  body('deliveryDate').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'active', 'done', 'delivered']),
  validate,
];

// ID validation
const idValidation = [
  param('id').isMongoId(),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  clientValidation,
  orderValidation,
  idValidation,
};
