import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, type ApiResponse } from '../services/apiClient';
import type { ApiInvoker } from '../types/api';
import LoginPanel from '../features/auth/LoginPanel';
import AssetTester from '../features/assets/AssetTester';
import InventoryTester from '../features/inventory/InventoryTester';
import RepairTester from '../features/repairs/RepairTester';
import TransferTester from '../features/transfers/TransferTester';
import ResponseView from '../components/common/ResponseView';
import TestDataManager from '../features/testData/TestDataManager';
import './App.css';

type TabKey = 'assets' | 'inventory' | 'repairs' | 'transfers' | 'profile' | 'testData';

const DEFAULT_BASE_URL = 'http://localhost:3000/api/';

const App: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('asset-admin-base-url') || DEFAULT_BASE_URL);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('asset-admin-token'));
  const [userInfo, setUserInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('assets');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [profileResponse, setProfileResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    localStorage.setItem('asset-admin-base-url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('asset-admin-token', token);
    } else {
      localStorage.removeItem('asset-admin-token');
    }
  }, [token]);

  const invoke: ApiInvoker = useCallback(
    (path, options) => apiRequest(baseUrl, token, path, options),
    [baseUrl, token]
  );

  useEffect(() => {
    if (!token) {
      setUserInfo(null);
      setProfileResponse(null);
      return;
    }
    const fetchProfile = async () => {
      const response = await invoke('/auth/profile', { method: 'GET' });
      setProfileResponse(response);
      if (response.ok) {
        setUserInfo((response.data as any)?.data || null);
      }
    };
    fetchProfile();
  }, [token, invoke]);

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    setLoginLoading(true);
    setLoginError(null);
    const response = await apiRequest(baseUrl, null, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setLoginLoading(false);

    if (!response.ok) {
      setLoginError(response.error || '登录失败');
      return;
    }

    const payload = response.data as any;
    setToken(payload?.data?.token || null);
    setUserInfo(payload?.data?.user || null);
  };

  const handleLogout = () => {
    setToken(null);
    setUserInfo(null);
    setActiveTab('assets');
  };

  const isSuperAdmin = useMemo(
    () => (userInfo?.roles || []).some((role: any) => role.code === 'SUPER_ADMIN'),
    [userInfo]
  );

  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'testData') {
      setActiveTab('assets');
    }
  }, [isSuperAdmin, activeTab]);

  const navItems: { key: TabKey; label: string }[] = useMemo(() => {
    const base: { key: TabKey; label: string }[] = [
      { key: 'assets', label: '资产管理' },
      { key: 'inventory', label: '盘点管理' },
      { key: 'repairs', label: '维修管理' },
      { key: 'transfers', label: '调拨管理' },
      { key: 'profile', label: '当前用户' }
    ];

    if (isSuperAdmin) {
      base.push({ key: 'testData', label: '测试数据' });
    }

    return base;
  }, [isSuperAdmin]);

  if (!token) {
    return (
      <main className="container">
        <header className="page-header">
          <h1>资产二维码管理系统 · 接口测试台</h1>
          <p>请填写后端 API 地址和测试账号完成登录。</p>
        </header>
        <LoginPanel
          baseUrl={baseUrl}
          onBaseUrlChange={setBaseUrl}
          onLogin={handleLogin}
          loading={loginLoading}
          lastError={loginError}
        />
      </main>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'assets':
        return <AssetTester invoke={invoke} />;
      case 'inventory':
        return <InventoryTester invoke={invoke} />;
      case 'repairs':
        return <RepairTester invoke={invoke} />;
      case 'transfers':
        return <TransferTester invoke={invoke} />;
      case 'testData':
        return <TestDataManager invoke={invoke} />;
      case 'profile':
        return (
          <section className="card">
            <h2>当前用户信息</h2>
            <p className="help">从 /auth/profile 获取的完整响应。</p>
            <ResponseView response={profileResponse} />
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>资产二维码管理系统 · 接口测试台</h1>
          <p>当前环境：{baseUrl}</p>
        </div>
        <div className="user-block">
          <div>
            <strong>{userInfo?.real_name || userInfo?.username || '未获取到姓名'}</strong>
            {userInfo?.org ? <span>{userInfo.org.name}</span> : null}
          </div>
          <button onClick={handleLogout} className="secondary">
            退出登录
          </button>
        </div>
      </header>

      <section className="card">
        <form
          className="form-inline"
          onSubmit={event => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const newUrl = (formData.get('baseUrl') as string) || baseUrl;
            setBaseUrl(newUrl.endsWith('/') ? newUrl : `${newUrl}/`);
          }}
        >
          <label className="grow">
            API 基础地址
            <input name="baseUrl" type="text" defaultValue={baseUrl} placeholder="http://localhost:3000/api" />
          </label>
          <button type="submit">更新</button>
        </form>
      </section>

      <nav className="tabs">
        {navItems.map(item => (
          <button
            key={item.key}
            className={item.key === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section>{renderContent()}</section>
    </main>
  );
};

export default App;
