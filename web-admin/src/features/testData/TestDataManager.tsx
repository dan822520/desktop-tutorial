import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiInvoker } from '../../types/api';
import type { ApiResponse } from '../../services/apiClient';
import ResponseView from '../../components/common/ResponseView';

interface TestDataSummary {
  orgs: number;
  departments: number;
  users: number;
  assetCategories: number;
  assets: number;
  transfers: number;
  repairs: number;
  inventoryTasks: number;
  inventoryRecords: number;
}

interface TestDataStatusPayload {
  installed: boolean;
  summary: TestDataSummary;
}

interface SeedResult {
  counts: TestDataSummary;
  credentials: Array<{ username: string; password: string; roles: string[] }>;
}

interface RemoveResult {
  removed: TestDataSummary;
}

type TestDataActionResponse = ApiResponse<{ data?: SeedResult | RemoveResult }>;

type Props = {
  invoke: ApiInvoker;
};

const defaultSummary: TestDataSummary = {
  orgs: 0,
  departments: 0,
  users: 0,
  assetCategories: 0,
  assets: 0,
  transfers: 0,
  repairs: 0,
  inventoryTasks: 0,
  inventoryRecords: 0
};

const TestDataManager: React.FC<Props> = ({ invoke }) => {
  const [status, setStatus] = useState<TestDataStatusPayload | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResponse, setActionResponse] = useState<TestDataActionResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setStatusError(null);
    const response = await invoke<{ data?: TestDataStatusPayload }>('/test-data');
    setLoadingStatus(false);

    if (!response.ok) {
      setStatusError(response.error || '无法获取测试数据状态');
      setStatus(response.data?.data ?? null);
      return;
    }

    setStatus(response.data?.data ?? null);
  }, [invoke]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const latestSummary = useMemo<TestDataSummary>(() => status?.summary ?? defaultSummary, [status]);

  const handlePopulate = async () => {
    setActionLoading(true);
    setActionResponse(null);
    const response = await invoke<{ data?: SeedResult }>('/test-data', { method: 'POST' });
    setActionResponse(response as TestDataActionResponse);
    setActionLoading(false);
    if (response.ok) {
      await fetchStatus();
    }
  };

  const handleClear = async () => {
    setActionLoading(true);
    setActionResponse(null);
    const response = await invoke<{ data?: RemoveResult }>('/test-data', { method: 'DELETE' });
    setActionResponse(response as TestDataActionResponse);
    setActionLoading(false);
    if (response.ok) {
      await fetchStatus();
    }
  };

  const credentials = useMemo(() => {
    if (!actionResponse?.ok) {
      return null;
    }
    const payload = actionResponse.data?.data;
    if (!payload || !('credentials' in payload)) {
      return null;
    }
    return payload.credentials;
  }, [actionResponse]);

  return (
    <section className="card stack-md">
      <header className="card-header">
        <div>
          <h2>测试数据管理</h2>
          <p className="help">
            一键填充或卸载官方提供的演示数据，便于验证资产、调拨、维修与盘点等完整流程。
          </p>
        </div>
        <div className="actions">
          <button onClick={fetchStatus} className="secondary" disabled={loadingStatus || actionLoading}>
            {loadingStatus ? '刷新中…' : '刷新状态'}
          </button>
        </div>
      </header>

      {statusError ? <div className="alert error">{statusError}</div> : null}

      <div className="grid two">
        <div>
          <h3>当前状态</h3>
          {loadingStatus && !status ? <p>正在获取状态…</p> : null}
          <ul className="metrics">
            <li>
              <strong>{status?.installed ? '已安装' : '未安装'}</strong>
              <span>测试数据集</span>
            </li>
            <li>
              <strong>{latestSummary.assets}</strong>
              <span>资产</span>
            </li>
            <li>
              <strong>{latestSummary.transfers}</strong>
              <span>调拨记录</span>
            </li>
            <li>
              <strong>{latestSummary.repairs}</strong>
              <span>维修工单</span>
            </li>
            <li>
              <strong>{latestSummary.inventoryTasks}</strong>
              <span>盘点任务</span>
            </li>
            <li>
              <strong>{latestSummary.inventoryRecords}</strong>
              <span>盘点记录</span>
            </li>
          </ul>
        </div>
        <div className="stack-sm">
          <h3>操作</h3>
          <p className="help">
            填充操作需要超级管理员权限，卸载会删除所有以 TEST 标识的演示数据并恢复数据库到自定义数据。
          </p>
          <div className="stack-sm">
            <button onClick={handlePopulate} disabled={actionLoading}>
              {actionLoading ? '执行中…' : '填充测试数据'}
            </button>
            <button onClick={handleClear} className="danger" disabled={actionLoading}>
              {actionLoading ? '执行中…' : '卸载测试数据'}
            </button>
          </div>
        </div>
      </div>

      {credentials ? (
        <section className="card subtle">
          <h3>新增测试账号</h3>
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>密码</th>
                <th>角色</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map(credential => (
                <tr key={credential.username}>
                  <td>{credential.username}</td>
                  <td>{credential.password}</td>
                  <td>{credential.roles.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {actionResponse ? (
        <section className="card subtle">
          <h3>最近一次操作响应</h3>
          <ResponseView response={actionResponse} />
        </section>
      ) : null}
    </section>
  );
};

export default TestDataManager;
