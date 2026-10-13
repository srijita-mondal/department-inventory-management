import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff, Shield } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    const result = signIn(email, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate(result.user.role === 'admin' ? '/admin' : '/student');
  };

  const fillDemo = (email, pw) => { setEmail(email); setPassword(pw); setError(''); };

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: 10 }}>
              <Shield size={32} color="#e8a020" />
            </div>
          </div>
          <h1>NFSU InventoryHub</h1>
          <p>National Forensic Sciences University · Secure Inventory Portal</p>
        </div>
        <div className="login-body">
          
          <div className="login-demo-accounts">
            <h4>Demo Accounts</h4>
            <div className="account">🔴 Admin: <code>coordinator@nfsu.ac.in</code> / <code>Admin@123</code>
              <button onClick={() => fillDemo('coordinator@nfsu.ac.in','Admin@123')} style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', color: '#1e40af' }}>Fill</button>
            </div>
            <div className="account">🔴 Admin 2: <code>lab@nfsu.ac.in</code> / <code>Lab@123</code>
              <button onClick={() => fillDemo('lab@nfsu.ac.in','Lab@123')} style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', color: '#1e40af' }}>Fill</button>
            </div>
            <div className="account">🟢 Student: <code>student1@nfsu.ac.in</code> / <code>Student@123</code>
              <button onClick={() => fillDemo('student1@nfsu.ac.in','Student@123')} style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', color: '#1e40af' }}>Fill</button>
            </div>
            <div className="account">🟢 Student 2: <code>student2@nfsu.ac.in</code> / <code>Student@123</code>
              <button onClick={() => fillDemo('student2@nfsu.ac.in','Student@123')} style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', border: 'none', borderRadius: 3, padding: '1px 6px', cursor: 'pointer', color: '#1e40af' }}>Fill</button>
            </div>
          </div>
          {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@nfsu.ac.in" autoComplete="username" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" style={{ paddingRight: 38 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
            Role is assigned server-side. Students cannot escalate privileges.
          </p>
        </div>
      </div>
    </div>
  );
}
