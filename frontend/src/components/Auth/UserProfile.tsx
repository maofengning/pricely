import { useUserStore } from '@/stores';

export function UserProfile() {
  const { user, logout } = useUserStore();

  if (!user) {
    return (
      <div className="p-4 bg-bg-secondary rounded-lg">
        <p className="text-text-secondary">请先登录</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-secondary rounded-lg">
      <h2 className="text-xl font-bold text-text-primary mb-4">用户信息</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-1">邮箱</label>
          <p className="text-text-primary">{user.email}</p>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">昵称</label>
          <p className="text-text-primary">{user.nickname || '未设置'}</p>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-1">注册时间</label>
          <p className="text-text-primary">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
      >
        退出登录
      </button>
    </div>
  );
}