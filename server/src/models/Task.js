import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required.'],
    trim: true,
    minlength: [2, 'Task title must have at least 2 characters.'],
    maxlength: [120, 'Task title cannot be longer than 120 characters.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters.'],
    default: ''
  },
  priority: {
    type: String,
    enum: { values: ['low', 'medium', 'high'], message: 'Priority must be low, medium, or high.' },
    default: 'medium'
  },
  dueDate: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

taskSchema.index({ user: 1, completed: 1, createdAt: -1 });

export default mongoose.model('Task', taskSchema);
