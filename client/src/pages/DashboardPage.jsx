import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProgressCard from '../components/ProgressCard';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = async () => { try { setError(''); const data = await api('/api/tasks', { token }); setTasks(data.tasks); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { loadTasks(); }, []);
  const mutateTask = async (path, options) => { const data = await api(path, { token, ...options }); await loadTasks(); return data; };
  const addTask = async (payload) => { setSaving(true); try { await mutateTask('/api/tasks', { method: 'POST', body: payload }); setShowForm(false); } finally { setSaving(false); } };
  const toggleTask = async (task) => mutateTask(`/api/tasks/${task._id}`, { method: 'PUT', body: { completed: !task.completed } });
  const deleteTask = async (task) => { if (window.confirm(`Delete “${task.title}”? This cannot be undone.`)) await mutateTask(`/api/tasks/${task._id}`, { method: 'DELETE' }); };
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.filter((task) => !task.completed);

  return <div className="page">
    <header className="page-header"><div><p className="eyebrow">OVERVIEW</p><h1>Good morning, {user?.name?.split(' ')[0]}.</h1><p className="muted">Here’s a calm view of what needs your attention.</p></div><button className="button primary" onClick={() => setShowForm(true)}>+ New task</button></header>
    {error && <div className="form-error">{error}</div>}
    {showForm && <div className="modal-backdrop"><TaskForm onSubmit={addTask} onCancel={() => setShowForm(false)} submitting={saving} /></div>}
    <ProgressCard completed={completed} total={tasks.length} />
    <section className="stat-grid"><article><span className="stat-icon lavender">☷</span><div><strong>{tasks.length}</strong><p>Total tasks</p></div></article><article><span className="stat-icon amber">◷</span><div><strong>{pending.length}</strong><p>Still to do</p></div></article><article><span className="stat-icon green">✓</span><div><strong>{completed}</strong><p>Completed</p></div></article></section>
    <section className="content-card"><div className="section-heading"><div><h2>Up next</h2><p>Focus on one meaningful task at a time.</p></div><Link to="/tasks">View all tasks →</Link></div>{loading ? <p className="loading">Loading your tasks…</p> : <TaskList tasks={pending.slice(0, 4)} onToggle={toggleTask} showActions={false} emptyMessage="You have no pending tasks. Add one to get started." />}</section>
  </div>;
}
