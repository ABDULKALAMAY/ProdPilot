import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await register(form); navigate('/dashboard'); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  return <AuthCard title="Start your journey" subtitle="Create a free account and take control of your day." footerText="Already have an account?" footerLink="/login" footerLabel="Sign in">
    <form onSubmit={submit} className="auth-form">
      {error && <div className="form-error" role="alert">{error}</div>}
      <label>Your name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Abdulkalam" autoComplete="name" minLength="2" required /></label>
      <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></label>
      <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" autoComplete="new-password" minLength="8" required /></label>
      <button className="button primary full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
    </form>
  </AuthCard>;
}
