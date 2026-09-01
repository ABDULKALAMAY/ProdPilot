import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(form); navigate('/dashboard'); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  return <AuthCard title="Welcome back" subtitle="Sign in to continue planning with purpose." footerText="New to ProdPilot?" footerLink="/register" footerLabel="Create an account">
    <form onSubmit={submit} className="auth-form">
      {error && <div className="form-error" role="alert">{error}</div>}
      <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></label>
      <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" autoComplete="current-password" required /></label>
      <button className="button primary full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </AuthCard>;
}
