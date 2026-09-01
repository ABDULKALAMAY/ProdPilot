import { Router } from 'express';
import { body } from 'express-validator';
import { login, register } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const emailRule = body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail();
const passwordRule = body('password').isString().isLength({ min: 8 }).withMessage('Password must have at least 8 characters.');

router.post('/register', [body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters.'), emailRule, passwordRule, validate], register);
router.post('/login', [emailRule, passwordRule, validate], login);

export default router;
