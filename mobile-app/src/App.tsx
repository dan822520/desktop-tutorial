import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LoginForm from './components/LoginForm';
import ScanView from './components/ScanView';
import AssetCard from './components/AssetCard';
import Toast from './components/Toast';
import { apiRequest, type ApiResponse } from './api/client';

interface UserProfile {
  id: number;
  username: string;
  real_name?: string | null;
  org?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  roles?: { id: number; code: string; name: string }[];
}

const DEFAULT_BASE_URL = 'http://localhost:3000/api';

type ViewKey = 'home' | 'scan' | 'profile' | 'tasks';

const App: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('asset-mobile-base-url') || DEFAULT_BASE_URL);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('asset-mobile-token'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewKey>('home');
  const [toast, setToast] = useState('');
  const [lastAssetResponse, setLastAssetResponse] = useState<ApiResponse | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState('');

  useEffect(() => {
    localStorage.setItem('asset-mobile-base-url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('asset-mobile-token', token);
    } else {
      localStorage.removeItem('asset-mobile-token');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      return;
    }
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const response = await apiRequest<{ data: UserProfile }>(baseUrl, token, '/auth/profile', {
        method: 'GET'
      });
      setLoadingProfile(false);
      if (response.ok && response.data) {
        setProfile((response.data as any).data || (response.data as any));
      } else {
        setToast(response.error || '获取用户信息失败');
      }
    };
    fetchProfile();
  }, [token, baseUrl]);

  const handleLogin = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      setLoginLoading(true);
      setLoginError(null);
      const response = await apiRequest<{ data: { token: string; user: UserProfile } }>(baseUrl, null, '/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setLoginLoading(false);
      if (!response.ok || !response.data) {
        setLoginError(response.error || '登录失败');
        return;
      }
      const payload = (response.data as any).data;
      setToken(payload.token);
      setProfile(payload.user);
      setActiveView('home');
      setToast('登录成功');
    },
    [baseUrl]
  );

  const handleLogout = useCallback(() => {
    setToken(null);
    setProfile(null);
    setActiveView('home');
    setToast('已退出登录');
  }, []);

  const handleScanResult = useCallback(
    async (code: string) => {
      if (!token) return;
      setActiveView('home');
      setLastScannedCode(code);
      const response = await apiRequest(baseUrl, token, `/assets/scan/${encodeURIComponent(code)}`, {
        method: 'GET'
      });
      setLastAssetResponse(response);
      if (response.ok) {
        setToast('扫码成功');
      } else {
        setToast(response.error || '未找到资产');
      }
    },
    [baseUrl, token]
  );

  const canSeeAdminEntries = useMemo(() => {
    return (profile?.roles || []).some(role => role.code === 'SUPER_ADMIN' || role.code === 'ORG_ADMIN');
  }, [profile]);

  if (!token) {
    return (
      <LoginForm
        baseUrl={baseUrl}
        onBaseUrlChange={setBaseUrl}
        loading={loginLoading}
        error={loginError}
        onSubmit={handleLogin}
      />
    );
  }

  const assetData = (lastAssetResponse?.data as any)?.data || (lastAssetResponse?.data as any);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>资产移动端</h1>
          <small>{profile?.real_name || profile?.username}</small>
        </div>
        <button type="button" className="secondary-button" onClick={handleLogout}>
          退出
        </button>
      </header>

      <main className="app-main">
        {activeView === 'home' ? (
          <>
            <section className="section-card">
              <h2>快速操作</h2>
              <button className="scan-button" onClick={() => setActiveView('scan')}>
                📷 扫码资产
              </button>
            </section>

            {lastScannedCode ? (
              <section className="section-card">
                <h2>最近扫码</h2>
                <p>资产编号：{lastScannedCode}</p>
                {lastAssetResponse?.ok && assetData ? (
                  <AssetCard asset={assetData} />
                ) : (
                  <p className="error-text">{lastAssetResponse?.error || '未找到资产信息'}</p>
                )}
              </section>
            ) : null}

            <section className="section-card">
              <h2>我的信息</h2>
              <div className="profile-card">
                <div>
                  <strong>{profile?.real_name || profile?.username}</strong>
                  <span>所属组织：{profile?.org?.name || '—'}</span>
                  <span>所属部门：{profile?.department?.name || '—'}</span>
                </div>
                <div>
                  <span>
                    角色：{profile?.roles?.map(role => role.name).join('、') || '普通员工'}
                  </span>
                </div>
                <div>
                  <span>API 地址：{baseUrl}</span>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {activeView === 'scan' ? (
          <section className="section-card">
            <h2>扫码资产</h2>
            <ScanView
              onResult={handleScanResult}
              onCancel={() => setActiveView('home')}
            />
          </section>
        ) : null}

        {activeView === 'profile' ? (
          <section className="section-card">
            <h2>个人资料</h2>
            <div className="profile-card">
              <div>
                <strong>{profile?.real_name || profile?.username}</strong>
                <span>账号：{profile?.username}</span>
              </div>
              <div>
                <span>所属组织：{profile?.org?.name || '—'}</span>
                <span>所属部门：{profile?.department?.name || '—'}</span>
              </div>
              <div>
                <span>角色：{profile?.roles?.map(role => role.name).join('、') || '普通员工'}</span>
              </div>
              <div>
                <span>API 基础地址：{baseUrl}</span>
              </div>
              <div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    const newUrl = prompt('请输入新的 API 地址', baseUrl) || baseUrl;
                    setBaseUrl(newUrl);
                    setToast('API 地址已更新');
                  }}
                >
                  修改 API 地址
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeView === 'tasks' ? (
          <section className="section-card">
            <h2>待办事项</h2>
            <p>该版本暂提供扫码、查询和个人信息功能。</p>
            {canSeeAdminEntries ? (
              <p>请前往 Web 管理后台处理审批、盘点等高级操作。</p>
            ) : null}
          </section>
        ) : null}
      </main>

      <nav className="bottom-nav">
        <button className={activeView === 'home' ? 'active' : ''} onClick={() => setActiveView('home')}>
          <span>🏠</span>
          首页
        </button>
        <button className={activeView === 'scan' ? 'active' : ''} onClick={() => setActiveView('scan')}>
          <span>📷</span>
          扫码
        </button>
        <button className={activeView === 'tasks' ? 'active' : ''} onClick={() => setActiveView('tasks')}>
          <span>🗂️</span>
          我的待办
        </button>
        <button className={activeView === 'profile' ? 'active' : ''} onClick={() => setActiveView('profile')}>
          <span>👤</span>
          我的
        </button>
      </nav>

      {toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}

      {loadingProfile && <Toast message="正在同步用户信息…" onClose={() => setToast('')} />}
    </div>
  );
};

export default App;
