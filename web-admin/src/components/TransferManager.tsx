import React, { useState } from 'react';
import type { ApiResponse, RequestOptions } from '../api';
import ResponseView from './ResponseView';

type ApiInvoker = <T = unknown>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;

interface TransferManagerProps {
  invoke: ApiInvoker;
}

const TransferManager: React.FC<TransferManagerProps> = ({ invoke }) => {
  const [listResponse, setListResponse] = useState<ApiResponse | null>(null);
  const [createResponse, setCreateResponse] = useState<ApiResponse | null>(null);
  const [approveResponse, setApproveResponse] = useState<ApiResponse | null>(null);

  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', asset_id: '' });
  const [createForm, setCreateForm] = useState({ asset_id: '', to_org_id: '', to_department_id: '', to_user_id: '', reason: '' });
  const [approveForm, setApproveForm] = useState({ id: '', approved: 'true', reject_reason: '' });

  const loadTransfers = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await invoke('/transfers', {
      method: 'GET',
      query: {
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        asset_id: filters.asset_id || undefined
      }
    });
    setListResponse(response);
  };

  const createTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createForm.asset_id || !createForm.to_org_id) return;
    const payload: Record<string, unknown> = {
      asset_id: Number(createForm.asset_id),
      to_org_id: Number(createForm.to_org_id),
      to_department_id: createForm.to_department_id ? Number(createForm.to_department_id) : undefined,
      to_user_id: createForm.to_user_id ? Number(createForm.to_user_id) : undefined,
      reason: createForm.reason || undefined
    };
    const response = await invoke('/transfers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setCreateResponse(response);
  };

  const approveTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!approveForm.id) return;
    const response = await invoke(`/transfers/${approveForm.id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({
        approved: approveForm.approved === 'true',
        reject_reason: approveForm.reject_reason || undefined
      })
    });
    setApproveResponse(response);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>调拨记录列表</h2>
        <form onSubmit={loadTransfers} className="form-grid compact">
          <label>
            页码
            <input
              type="number"
              min={1}
              value={filters.page}
              onChange={event => setFilters(values => ({ ...values, page: Number(event.target.value) }))}
            />
          </label>
          <label>
            每页数量
            <input
              type="number"
              min={1}
              value={filters.limit}
              onChange={event => setFilters(values => ({ ...values, limit: Number(event.target.value) }))}
            />
          </label>
          <label>
            状态
            <input
              type="text"
              value={filters.status}
              onChange={event => setFilters(values => ({ ...values, status: event.target.value }))}
              placeholder="审批中/已通过/已驳回"
            />
          </label>
          <label>
            资产 ID
            <input
              type="number"
              value={filters.asset_id}
              onChange={event => setFilters(values => ({ ...values, asset_id: event.target.value }))}
            />
          </label>
          <button type="submit" className="primary">
            查询
          </button>
        </form>
        <ResponseView response={listResponse} />
      </section>

      <section className="card">
        <h2>创建调拨申请</h2>
        <form onSubmit={createTransfer} className="form-grid">
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
            调入组织 ID
            <input
              type="number"
              value={createForm.to_org_id}
              onChange={event => setCreateForm(form => ({ ...form, to_org_id: event.target.value }))}
              required
            />
          </label>
          <label>
            调入部门 ID
            <input
              type="number"
              value={createForm.to_department_id}
              onChange={event => setCreateForm(form => ({ ...form, to_department_id: event.target.value }))}
            />
          </label>
          <label>
            调入负责人用户 ID
            <input
              type="number"
              value={createForm.to_user_id}
              onChange={event => setCreateForm(form => ({ ...form, to_user_id: event.target.value }))}
            />
          </label>
          <label>
            调拨原因
            <textarea
              value={createForm.reason}
              onChange={event => setCreateForm(form => ({ ...form, reason: event.target.value }))}
              rows={3}
            />
          </label>
          <button type="submit" className="primary">
            发起调拨
          </button>
        </form>
        <ResponseView response={createResponse} />
      </section>

      <section className="card">
        <h2>审批调拨</h2>
        <form onSubmit={approveTransfer} className="form-grid compact">
          <label>
            调拨记录 ID
            <input
              type="number"
              value={approveForm.id}
              onChange={event => setApproveForm(form => ({ ...form, id: event.target.value }))}
              required
            />
          </label>
          <label>
            审批结果
            <select
              value={approveForm.approved}
              onChange={event => setApproveForm(form => ({ ...form, approved: event.target.value }))}
            >
              <option value="true">通过</option>
              <option value="false">驳回</option>
            </select>
          </label>
          <label>
            驳回原因（可选）
            <input
              type="text"
              value={approveForm.reject_reason}
              onChange={event => setApproveForm(form => ({ ...form, reject_reason: event.target.value }))}
              placeholder="审批驳回时填写"
            />
          </label>
          <button type="submit" className="secondary">
            提交审批
          </button>
        </form>
        <ResponseView response={approveResponse} />
      </section>
    </div>
  );
};

export default TransferManager;
