import React, { useState } from 'react';

interface LoginPanelProps {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
  loading?: boolean;
  lastError?: string | null;
}

const LoginPanel: React.FC<LoginPanelProps> = ({
  baseUrl,
  onBaseUrlChange,
  onLogin,
  loading = false,
  lastError
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onLogin({ username, password });
  };

  return (
    <div className="card">
      <h2>登录测试账号</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          API 基础地址
          <input
            type="text"
            value={baseUrl}
            onChange={event => onBaseUrlChange(event.target.value)}
            placeholder="http://localhost:3000/api"
            required
          />
        </label>
        <label>
          用户名
          <input
            type="text"
            value={username}
            onChange={event => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
        {lastError ? <p className="error-text">{lastError}</p> : null}
      </form>
    </div>
  );
};

export default LoginPanel;
