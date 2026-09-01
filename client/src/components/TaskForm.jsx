import { useEffect, useState } from 'react';

const emptyTask = { title: '', description: '', priority: 'medium', dueDate: '' };

export default function TaskForm({ task, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyTask);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(task ? {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
    } : emptyTask);
  }, [task]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 2) {
      setError('Please enter a task title with at least 2 characters.');
      return;
    }
    try {
      await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || null });
      if (!task) setForm(emptyTask);
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-heading"><div><h2>{task ? 'Edit task' : 'Create a task'}</h2><p>Break your goal into a clear next action.</p></div>{onCancel && <button type="button" className="icon-button" onClick={onCancel} aria-label="Close form">×</button>}</div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <label>Task title<input value={form.title} maxLength="120" onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Prepare sprint demo" required /></label>
      <label>Description <span className="optional">(optional)</span><textarea value={form.description} maxLength="500" onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add helpful details" rows="3" /></label>
      <div className="field-row">
        <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Due date <span className="optional">(optional)</span><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
      </div>
      <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancel</button><button className="button primary" disabled={submitting}>{submitting ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button></div>
    </form>
  );
}
