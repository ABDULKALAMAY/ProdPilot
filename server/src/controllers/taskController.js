import Task from '../models/Task.js';

function taskFields(body) {
  const fields = ['title', 'description', 'priority', 'dueDate', 'completed'];
  return Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
}

export async function getTasks(req, res, next) {
  try {
    const filter = { user: req.user.id };
    if (req.query.status === 'completed') filter.completed = true;
    if (req.query.status === 'pending') filter.completed = false;
    const tasks = await Task.find(filter).sort({ completed: 1, dueDate: 1, createdAt: -1 });
    return res.json({ tasks });
  } catch (error) { return next(error); }
}

export async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.json({ task });
  } catch (error) { return next(error); }
}

export async function createTask(req, res, next) {
  try {
    const task = await Task.create({ ...taskFields(req.body), user: req.user.id });
    return res.status(201).json({ task });
  } catch (error) { return next(error); }
}

export async function updateTask(req, res, next) {
  try {
    const changes = taskFields(req.body);
    if (changes.completed !== undefined) changes.completedAt = changes.completed ? new Date() : null;
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, changes, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.json({ task });
  } catch (error) { return next(error); }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.status(204).send();
  } catch (error) { return next(error); }
}
