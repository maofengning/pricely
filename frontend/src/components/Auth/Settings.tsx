import { useState } from 'react';
import { useUserStore } from '@/stores';
import { useAuth } from '@/services/auth';
import { api } from '@/services/api';

export function Settings() {
  const { user } = useUserStore();
  const { changePassword } = useAuth();

  // Fund reset state
  const [initialCapital, setInitialCapital] = useState('100000');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundMessage, setFundMessage] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleResetFund = async () => {
    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 10000 || capital > 1000000) {
      setFundMessage('初始资金范围：¥10,000 - ¥1,000,000');
      return;
    }

    setFundLoading(true);
    setFundMessage('');
    try {
      await api.post('/trade/fund/reset', { initialCapital: capital });
      setFundMessage('资金重置成功！');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '资金重置失败，请稍后重试';
      setFundMessage(errorMessage);
    } finally {
      setFundLoading(false);
    }
  };

  const validatePasswordForm = (): string | null => {
    if (!currentPassword) {
      return '请输入当前密码';
    }

    if (!newPassword) {
      return '请输入新密码';
    }

    if (newPassword.length < 8) {
      return '新密码长度至少为8位';
    }

    if (newPassword.length > 100) {
      return '新密码长度不能超过100位';
    }

    if (!confirmNewPassword) {
      return '请确认新密码';
    }

    if (newPassword !== confirmNewPassword) {
      return '两次输入的新密码不一致';
    }

    return null;
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    const validationError = validatePasswordForm();
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '密码修改失败，请稍后重试';
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-bg-secondary rounded-lg">
        <p className="text-text-secondary">请先登录</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-secondary rounded-lg">
      <h2 className="text-xl font-bold text-text-primary mb-6">设置</h2>

      {/* Password change section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-text-primary mb-2">修改密码</h3>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-400">
            {passwordSuccess}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1" htmlFor="currentPassword">
              当前密码
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="输入当前密码"
              disabled={passwordLoading}
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1" htmlFor="newPassword">
              新密码
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="至少8位"
              minLength={8}
              maxLength={100}
              disabled={passwordLoading}
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1" htmlFor="confirmNewPassword">
              确认新密码
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              placeholder="再次输入新密码"
              minLength={8}
              maxLength={100}
              disabled={passwordLoading}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>

      {/* Fund reset section */}
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-2">模拟资金重置</h3>
        <p className="text-text-secondary text-sm mb-4">
          重置模拟账户资金将清除所有持仓和订单记录。
        </p>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1">
              初始资金 (¥)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              className="px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent w-48"
              min={10000}
              max={1000000}
              step={10000}
              disabled={fundLoading}
            />
          </div>

          <button
            onClick={handleResetFund}
            disabled={fundLoading}
            className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {fundLoading ? '重置中...' : '重置资金'}
          </button>
        </div>

        {fundMessage && (
          <p className={`mt-2 text-sm ${fundMessage.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
            {fundMessage}
          </p>
        )}
      </div>
    </div>
  );
}