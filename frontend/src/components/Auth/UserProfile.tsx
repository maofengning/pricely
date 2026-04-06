import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores';
import { useAuth } from '@/services/auth';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const { updateUser, logout } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <div className="p-4 bg-bg-secondary rounded-lg">
        <p className="text-text-secondary">请先登录</p>
      </div>
    );
  }

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updatedUser = await updateUser({ nickname: nickname.trim() || undefined });
      setUser(updatedUser);
      setEditing(false);
      setSuccess('个人信息更新成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNickname(user?.nickname || '');
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-6 bg-bg-secondary rounded-lg">
      <h2 className="text-xl font-bold text-text-primary mb-4">用户信息</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-400">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-1">邮箱</label>
          <p className="text-text-primary">{user.email}</p>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">昵称</label>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="px-3 py-1 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent w-full max-w-xs"
                placeholder="输入昵称"
                maxLength={100}
                disabled={loading}
              />
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-3 py-1 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded hover:bg-border transition-colors disabled:opacity-50 text-sm"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-text-primary">{user.nickname || '未设置'}</p>
              <button
                onClick={() => setEditing(true)}
                className="px-2 py-1 text-text-accent hover:underline text-sm"
              >
                编辑
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">注册时间</label>
          <p className="text-text-primary">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
      >
        退出登录
      </button>
    </div>
  );
}