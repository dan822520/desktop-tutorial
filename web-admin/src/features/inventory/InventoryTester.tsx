import React, { useState } from 'react';
import type { ApiResponse } from '../../services/apiClient';
import ResponseView from '../../components/common/ResponseView';
import type { ApiInvoker } from '../../types/api';

interface InventoryTesterProps {
  invoke: ApiInvoker;
}

const InventoryTester: React.FC<InventoryTesterProps> = ({ invoke }) => {
  const [taskResponse, setTaskResponse] = useState<ApiResponse | null>(null);
  const [createResponse, setCreateResponse] = useState<ApiResponse | null>(null);
  const [scanResponse, setScanResponse] = useState<ApiResponse | null>(null);
  const [finishResponse, setFinishResponse] = useState<ApiResponse | null>(null);
  const [reportResponse, setReportResponse] = useState<ApiResponse | null>(null);

  const [taskFilters, setTaskFilters] = useState({ page: 1, limit: 20, status: '' });
  const [createForm, setCreateForm] = useState({
    name: '',
    org_id: '',
    scope_type: '抽盘',
    start_date: '',
    end_date: '',
    asset_ids: ''
  });
  const [scanForm, setScanForm] = useState({ task_id: '', asset_id: '', result_status: '正常', actual_location: '', remark: '' });
  const [reportTaskId, setReportTaskId] = useState('');

  const loadTasks = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await invoke('/inventory/tasks', {
      method: 'GET',
      query: {
        page: taskFilters.page,
        limit: taskFilters.limit,
        status: taskFilters.status || undefined
      }
    });
    setTaskResponse(response);
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: Record<string, unknown> = {
      name: createForm.name,
      org_id: Number(createForm.org_id),
      scope_type: createForm.scope_type,
      start_date: createForm.start_date || undefined,
      end_date: createForm.end_date || undefined,
      remark: undefined
    };

    if (createForm.asset_ids.trim()) {
      payload.asset_ids = createForm.asset_ids.split(',').map(id => Number(id.trim())).filter(Boolean);
    }

    const response = await invoke('/inventory/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setCreateResponse(response);
  };

  const scanAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scanForm.task_id || !scanForm.asset_id) return;
    const response = await invoke(`/inventory/tasks/${scanForm.task_id}/scan`, {
      method: 'POST',
      body: JSON.stringify({
        asset_id: Number(scanForm.asset_id),
        result_status: scanForm.result_status,
        actual_location: scanForm.actual_location || undefined,
        remark: scanForm.remark || undefined
      })
    });
    setScanResponse(response);
  };

  const finishTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scanForm.task_id) return;
    const response = await invoke(`/inventory/tasks/${scanForm.task_id}/finish`, {
      method: 'PUT'
    });
    setFinishResponse(response);
  };

  const loadReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportTaskId) return;
    const response = await invoke(`/inventory/tasks/${reportTaskId}/report`, { method: 'GET' });
    setReportResponse(response);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>盘点任务列表</h2>
        <form onSubmit={loadTasks} className="form-grid compact">
          <label>
            页码
            <input
              type="number"
              min={1}
              value={taskFilters.page}
              onChange={event => setTaskFilters(filters => ({ ...filters, page: Number(event.target.value) }))}
            />
          </label>
          <label>
            每页数量
            <input
              type="number"
              min={1}
              value={taskFilters.limit}
              onChange={event => setTaskFilters(filters => ({ ...filters, limit: Number(event.target.value) }))}
            />
          </label>
          <label>
            状态
            <input
              type="text"
              value={taskFilters.status}
              onChange={event => setTaskFilters(filters => ({ ...filters, status: event.target.value }))}
              placeholder="待执行/执行中/已完成"
            />
          </label>
          <button type="submit" className="primary">
            查询
          </button>
        </form>
        <ResponseView response={taskResponse} />
      </section>

      <section className="card">
        <h2>创建盘点任务</h2>
        <form onSubmit={createTask} className="form-grid">
          <label>
            任务名称
            <input
              type="text"
              value={createForm.name}
              onChange={event => setCreateForm(form => ({ ...form, name: event.target.value }))}
              required
            />
          </label>
          <label>
            组织 ID
            <input
              type="number"
              value={createForm.org_id}
              onChange={event => setCreateForm(form => ({ ...form, org_id: event.target.value }))}
              required
            />
          </label>
          <label>
            范围类型
            <select
              value={createForm.scope_type}
              onChange={event => setCreateForm(form => ({ ...form, scope_type: event.target.value }))}
            >
              <option value="抽盘">抽盘</option>
              <option value="全盘">全盘</option>
            </select>
          </label>
          <label>
            开始日期
            <input
              type="date"
              value={createForm.start_date}
              onChange={event => setCreateForm(form => ({ ...form, start_date: event.target.value }))}
            />
          </label>
          <label>
            结束日期
            <input
              type="date"
              value={createForm.end_date}
              onChange={event => setCreateForm(form => ({ ...form, end_date: event.target.value }))}
            />
          </label>
          <label>
            指定资产 ID（逗号分隔）
            <input
              type="text"
              value={createForm.asset_ids}
              onChange={event => setCreateForm(form => ({ ...form, asset_ids: event.target.value }))}
              placeholder="例如：1,2,3"
            />
          </label>
          <button type="submit" className="primary">
            创建任务
          </button>
        </form>
        <ResponseView response={createResponse} />
      </section>

      <section className="card">
        <h2>扫码记录盘点</h2>
        <form onSubmit={scanAsset} className="form-grid compact">
          <label>
            任务 ID
            <input
              type="number"
              value={scanForm.task_id}
              onChange={event => setScanForm(form => ({ ...form, task_id: event.target.value }))}
              required
            />
          </label>
          <label>
            资产 ID
            <input
              type="number"
              value={scanForm.asset_id}
              onChange={event => setScanForm(form => ({ ...form, asset_id: event.target.value }))}
              required
            />
          </label>
          <label>
            盘点结果
            <select
              value={scanForm.result_status}
              onChange={event => setScanForm(form => ({ ...form, result_status: event.target.value }))}
            >
              <option value="正常">正常</option>
              <option value="位置不符">位置不符</option>
              <option value="未找到">未找到</option>
              <option value="状态异常">状态异常</option>
            </select>
          </label>
          <label>
            实际位置
            <input
              type="text"
              value={scanForm.actual_location}
              onChange={event => setScanForm(form => ({ ...form, actual_location: event.target.value }))}
            />
          </label>
          <label>
            备注
            <input
              type="text"
              value={scanForm.remark}
              onChange={event => setScanForm(form => ({ ...form, remark: event.target.value }))}
            />
          </label>
          <button type="submit" className="primary">
            保存记录
          </button>
        </form>
        <form onSubmit={finishTask} className="form-inline">
          <input
            type="number"
            placeholder="任务 ID"
            value={scanForm.task_id}
            onChange={event => setScanForm(form => ({ ...form, task_id: event.target.value }))}
            required
          />
          <button type="submit" className="secondary">
            完成任务
          </button>
        </form>
        <ResponseView response={scanResponse || finishResponse} />
      </section>

      <section className="card">
        <h2>盘点报告</h2>
        <form onSubmit={loadReport} className="form-inline">
          <input
            type="number"
            value={reportTaskId}
            onChange={event => setReportTaskId(event.target.value)}
            placeholder="任务 ID"
            required
          />
          <button type="submit">获取报告</button>
        </form>
        <ResponseView response={reportResponse} />
      </section>
    </div>
  );
};

export default InventoryTester;
