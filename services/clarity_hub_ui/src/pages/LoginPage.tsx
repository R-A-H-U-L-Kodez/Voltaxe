import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-gold/10 rounded-full mb-4">
            <Shield className="text-primary-gold" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-primary-gold mb-2">Voltaxe</h1>
          <p className="text-foreground opacity-70">Security Monitoring Platform</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-surface">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Login</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-foreground text-sm mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                placeholder="admin@voltaxe.com"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-foreground text-sm mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary-gold"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger rounded-lg">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-gold text-background py-3 rounded-lg font-semibold hover:shadow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-foreground/60 text-sm">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-primary-gold hover:underline font-medium"
              >
                Sign up
              </a>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-foreground/60 text-sm">
              Demo credentials: admin@voltaxe.com / password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
