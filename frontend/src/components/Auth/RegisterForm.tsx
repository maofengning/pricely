import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/services/auth';

export function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少为8位');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, nickname || undefined);
      navigate('/');
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-8 bg-bg-secondary rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
          注册 Pricely
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="email">
              邮箱 *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="nickname">
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="可选"
            />
          </div>

          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="password">
              密码 *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="至少8位"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-text-secondary text-sm mb-2" htmlFor="confirmPassword">
              确认密码 *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="mt-4 text-center text-text-secondary text-sm">
          已有账号？{' '}
          <Link to="/login" className="text-text-accent hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}