import { validationResult } from 'express-validator';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    message: errors.array().map((error) => error.msg).join(' '),
    errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg }))
  });
}
