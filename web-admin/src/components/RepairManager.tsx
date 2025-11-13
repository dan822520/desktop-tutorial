import React, { useState } from 'react';
import type { ApiResponse, RequestOptions } from '../api';
import ResponseView from './ResponseView';

type ApiInvoker = <T = unknown>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;

interface RepairManagerProps {
  invoke: ApiInvoker;
}

const RepairManager: React.FC<RepairManagerProps> = ({ invoke }) => {
  const [listResponse, setListResponse] = useState<ApiResponse | null>(null);
  const [createResponse, setCreateResponse] = useState<ApiResponse | null>(null);
  const [assignResponse, setAssignResponse] = useState<ApiResponse | null>(null);
  const [completeResponse, setCompleteResponse] = useState<ApiResponse | null>(null);

  const [listFilters, setListFilters] = useState({ page: 1, limit: 20, status: '', asset_id: '' });
  const [createForm, setCreateForm] = useState({ asset_id: '', level: '一般', description: '', can_continue_use: true });
  const [assignForm, setAssignForm] = useState({ id: '', repair_user_id: '' });
  const [completeForm, setCompleteForm] = useState({ id: '', result: '', used_parts: '', cost: '' });

  const loadRepairs = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await invoke('/repairs', {
      method: 'GET',
      query: {
        page: listFilters.page,
        limit: listFilters.limit,
        status: listFilters.status || undefined,
        asset_id: listFilters.asset_id || undefined
      }
    });
    setListResponse(response);
  };

  const createRepair = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.asset_id || !createForm.description) return;
    const response = await invoke('/repairs', {
      method: 'POST',
      body: JSON.stringify({
        asset_id: Number(createForm.asset_id),
        level: createForm.level,
        description: createForm.description,
        can_continue_use: createForm.can_continue_use
      })
    });
    setCreateResponse(response);
  };

  const assignRepair = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignForm.id || !assignForm.repair_user_id) return;
    const response = await invoke(`/repairs/${assignForm.id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ repair_user_id: Number(assignForm.repair_user_id) })
    });
    setAssignResponse(response);
  };

  const completeRepair = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!completeForm.id) return;
    const payload: Record<string, unknown> = {
      result: completeForm.result || undefined,
      used_parts: completeForm.used_parts || undefined,
      cost: completeForm.cost ? Number(completeForm.cost) : undefined
    };
    const response = await invoke(`/repairs/${completeForm.id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setCompleteResponse(response);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>维修工单列表</h2>
        <form onSubmit={loadRepairs} className="form-grid compact">
          <label>
            页码
            <input
              type="number"
              min={1}
              value={listFilters.page}
              onChange={event => setListFilters(filters => ({ ...filters, page: Number(event.target.value) }))}
            />
          </label>
          <label>
            每页数量
            <input
              type="number"
              min={1}
              value={listFilters.limit}
              onChange={event => setListFilters(filters => ({ ...filters, limit: Number(event.target.value) }))}
            />
          </label>
          <label>
            状态
            <input
              type="text"
              value={listFilters.status}
              onChange={event => setListFilters(filters => ({ ...filters, status: event.target.value }))}
              placeholder="待派单/待维修/已完成"
            />
          </label>
          <label>
            资产 ID
            <input
              type="number"
              value={listFilters.asset_id}
              onChange={event => setListFilters(filters => ({ ...filters, asset_id: event.target.value }))}
            />
          </label>
          <button type="submit" className="primary">
            查询
          </button>
        </form>
        <ResponseView response={listResponse} />
      </section>

      <section className="card">
        <h2>创建报修</h2>
        <form onSubmit={createRepair} className="form-grid">
          <label>
            资产 ID
            <input
              type="number"
              value={createForm.asset_id}
              onChange={event => setCreateForm(form => ({ ...form, asset_id: event.target.value }))}
              required
            />
          </label>
          <label>
            故障等级
            <select
              value={createForm.level}
              onChange={event => setCreateForm(form => ({ ...form, level: event.target.value }))}
            >
              <option value="一般">一般</option>
              <option value="严重">严重</option>
              <option value="紧急">紧急</option>
            </select>
          </label>
          <label>
            故障描述
            <textarea
              value={createForm.description}
              onChange={event => setCreateForm(form => ({ ...form, description: event.target.value }))}
              rows={3}
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={createForm.can_continue_use}
              onChange={event => setCreateForm(form => ({ ...form, can_continue_use: event.target.checked }))}
            />
            故障期间可继续使用
          </label>
          <button type="submit" className="primary">
            提交报修
          </button>
        </form>
        <ResponseView response={createResponse} />
      </section>

      <section className="card">
        <h2>派单给维修人员</h2>
        <form onSubmit={assignRepair} className="form-inline">
          <input
            type="number"
            value={assignForm.id}
            onChange={event => setAssignForm(form => ({ ...form, id: event.target.value }))}
            placeholder="工单 ID"
            required
          />
          <input
            type="number"
            value={assignForm.repair_user_id}
            onChange={event => setAssignForm(form => ({ ...form, repair_user_id: event.target.value }))}
            placeholder="维修人员用户 ID"
            required
          />
          <button type="submit" className="secondary">
            派单
          </button>
        </form>
        <ResponseView response={assignResponse} />
      </section>

      <section className="card">
        <h2>完成维修</h2>
        <form onSubmit={completeRepair} className="form-grid compact">
          <label>
            工单 ID
            <input
              type="number"
              value={completeForm.id}
              onChange={event => setCompleteForm(form => ({ ...form, id: event.target.value }))}
              required
            />
          </label>
          <label>
            维修结果说明
            <input
              type="text"
              value={completeForm.result}
              onChange={event => setCompleteForm(form => ({ ...form, result: event.target.value }))}
            />
          </label>
          <label>
            使用配件
            <input
              type="text"
              value={completeForm.used_parts}
              onChange={event => setCompleteForm(form => ({ ...form, used_parts: event.target.value }))}
            />
          </label>
          <label>
            费用
            <input
              type="number"
              step="0.01"
              value={completeForm.cost}
              onChange={event => setCompleteForm(form => ({ ...form, cost: event.target.value }))}
            />
          </label>
          <button type="submit" className="primary">
            完成维修
          </button>
        </form>
        <ResponseView response={completeResponse} />
      </section>
    </div>
  );
};

export default RepairManager;
