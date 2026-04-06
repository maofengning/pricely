import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/services/auth';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // If not remember me, set a flag to clear on session end
      if (!rememberMe) {
        sessionStorage.setItem('session-only', 'true');
      } else {
        sessionStorage.removeItem('session-only');
      }

      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '邮箱或密码错误';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-8 bg-bg-secondary rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
          登录 Pricely
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="email">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="请输入密码"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6 flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-bg-tertiary text-text-accent focus:ring-text-accent focus:ring-offset-0"
              disabled={loading}
            />
            <label className="ml-2 text-text-secondary text-sm" htmlFor="rememberMe">
              记住登录状态
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-secondary text-sm">
          还没有账号？{' '}
          <Link to="/register" className="text-text-accent hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}