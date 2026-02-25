import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext.js';
import { useTranslation } from '../i18n/index.js';

const LANGUAGES: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: 'GB' },
  de: { name: 'Deutsch', flag: 'DE' },
  es: { name: 'Espanol', flag: 'ES' },
  fr: { name: 'Francais', flag: 'FR' },
  it: { name: 'Italiano', flag: 'IT' },
  pl: { name: 'Polski', flag: 'PL' },
  pt: { name: 'Portugues', flag: 'PT' },
  ro: { name: 'Romana', flag: 'RO' },
  ru: { name: 'Russian', flag: 'RU' },
  zh: { name: 'Chinese', flag: 'CN' },
  ja: { name: 'Japanese', flag: 'JP' },
  ko: { name: 'Korean', flag: 'KR' },
  vi: { name: 'Vietnamese', flag: 'VN' },
  tr: { name: 'Turkce', flag: 'TR' },
  hu: { name: 'Magyar', flag: 'HU' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter username and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: string) => {
    setLoading(true);
    setError('');
    try {
      await login(user, 'demo123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-title">GEMBA</div>
        <div className="login-subtitle">Shopfloor Management System</div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">{t('username')}</label>
            <input className="form-input" type="text" value={username}
              onChange={e => setUsername(e.target.value)} placeholder={t('username')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder={t('password')} />
          </div>
          {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <button className="login-btn login-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Loading...' : t('login')}
          </button>
        </form>

        <div className="login-divider">{t('selectAccessLevel')}</div>

        <div className="login-options">
          <button className="login-btn" onClick={() => handleQuickLogin('team1')} disabled={loading}>
            {t('level1Teams')}
          </button>
          <button className="login-btn" onClick={() => handleQuickLogin('leader1')} disabled={loading}>
            {t('level2Areas')}
          </button>
          <button className="login-btn" onClick={() => handleQuickLogin('manager1')} disabled={loading}>
            {t('level3Plant')}
          </button>
          <button className="login-btn" onClick={() => handleQuickLogin('admin')} disabled={loading}>
            Admin
          </button>
        </div>

        <div className="language-selector">
          {Object.entries(LANGUAGES).map(([code, { name }]) => (
            <button key={code} className={`lang-btn ${language === code ? 'active' : ''}`}
              onClick={() => setLanguage(code)}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
