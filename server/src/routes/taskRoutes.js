import { Router } from 'express';
import { body, param } from 'express-validator';
import { createTask, deleteTask, getTask, getTasks, updateTask } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const idRule = param('id').isMongoId().withMessage('Task ID must be valid.');
const taskRules = [
  body('title').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Task title must be between 2 and 120 characters.'),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 500 }).withMessage('Description cannot be longer than 500 characters.'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date.'),
  body('completed').optional().isBoolean().withMessage('Completed must be true or false.')
];

router.use(requireAuth);
router.get('/', getTasks);
router.get('/:id', [idRule, validate], getTask);
router.post('/', [body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Task title must be between 2 and 120 characters.'), ...taskRules.slice(1), validate], createTask);
router.put('/:id', [idRule, ...taskRules, validate], updateTask);
router.delete('/:id', [idRule, validate], deleteTask);

export default router;
