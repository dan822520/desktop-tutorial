import React, { useState } from 'react';

interface LoginFormProps {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  loading: boolean;
  error?: string | null;
  onSubmit: (payload: { username: string; password: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ baseUrl, onBaseUrlChange, loading, error, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>资产移动端</h1>
        <p>扫码资产、提交报修与调拨申请的移动入口。</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="baseUrl">API 基础地址</label>
            <input
              id="baseUrl"
              type="url"
              inputMode="url"
              value={baseUrl}
              placeholder="http://localhost:3000/api"
              onChange={event => onBaseUrlChange(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="username">账号</label>
            <input
              id="username"
              type="text"
              inputMode="text"
              value={username}
              placeholder="请输入用户名"
              onChange={event => setUsername(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="请输入密码"
              onChange={event => setPassword(event.target.value)}
            />
          </div>

          {error ? <div className="error-text">{error}</div> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '登录中…' : '立即登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
