import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import { API_BASE, THEME, STYLES } from '../utils/theme';

export default function LoginPage({ setToken }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, form);
      const token = res.data.token;
      localStorage.setItem('token', token);
      setToken(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: THEME.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif',
    }}>
      <div style={{
        width: '400px', backgroundColor: THEME.cardBg,
        border: `1px solid ${THEME.border}`, borderRadius: '16px', padding: '40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
          <ShieldCheck size={32} color={THEME.accentBlue} />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: THEME.textMain }}>
            BASIRAH <span style={{ color: THEME.accentBlue }}>360</span>
          </h1>
        </div>
        <p style={{ textAlign: 'center', color: THEME.textMuted, fontSize: '13px', marginBottom: '28px' }}>
          Material Management Platform
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={STYLES.label}>email</label>
            <input style={STYLES.input} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required placeholder="Enter username" autoComplete="email" />
          </div>
          <div>
            <label style={STYLES.label}>Password</label>
            <input type="password" style={STYLES.input} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required placeholder="Enter password" autoComplete="current-password" />
          </div>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
              backgroundColor: `${THEME.accentCrimson}18`, color: THEME.accentCrimson,
              border: `1px solid ${THEME.accentCrimson}44`,
            }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ ...STYLES.button(THEME.accentBlue), opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}