import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = async () => { try { const data = await api('/api/tasks', { token }); setTasks(data.tasks); } catch (err) { setError(err.message); } };
  useEffect(() => { loadTasks(); }, []);
  const mutate = async (path, options) => { const data = await api(path, { token, ...options }); await loadTasks(); return data; };
  const save = async (payload) => { setSaving(true); try { if (editing?._id) await mutate(`/api/tasks/${editing._id}`, { method: 'PUT', body: payload }); else await mutate('/api/tasks', { method: 'POST', body: payload }); setEditing(undefined); } finally { setSaving(false); } };
  const toggle = (task) => mutate(`/api/tasks/${task._id}`, { method: 'PUT', body: { completed: !task.completed } });
  const remove = async (task) => { if (window.confirm(`Delete “${task.title}”? This cannot be undone.`)) await mutate(`/api/tasks/${task._id}`, { method: 'DELETE' }); };
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)), [filter, tasks]);

  return <div className="page"><header className="page-header"><div><p className="eyebrow">TASKS</p><h1>My tasks</h1><p className="muted">Plan, prioritise, and make steady progress.</p></div><button className="button primary" onClick={() => setEditing(null)}>+ New task</button></header>
    {error && <div className="form-error">{error}</div>}
    {editing !== undefined && <div className="modal-backdrop"><TaskForm task={editing} onSubmit={save} onCancel={() => setEditing(undefined)} submitting={saving} /></div>}
    <div className="filter-bar" role="tablist">{[['all', 'All'], ['pending', 'Pending'], ['completed', 'Completed']].map(([value, label]) => <button role="tab" aria-selected={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)} key={value}>{label}<span>{value === 'all' ? tasks.length : value === 'pending' ? tasks.filter((task) => !task.completed).length : tasks.filter((task) => task.completed).length}</span></button>)}</div>
    <section className="content-card"><TaskList tasks={visibleTasks} onToggle={toggle} onEdit={setEditing} onDelete={remove} emptyMessage="No tasks match this view. Create a new task or switch filters." /></section>
  </div>;
}
