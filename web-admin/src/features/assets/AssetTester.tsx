import React, { useState } from 'react';
import type { ApiResponse } from '../../services/apiClient';
import ResponseView from '../../components/common/ResponseView';
import type { ApiInvoker } from '../../types/api';

interface AssetTesterProps {
  invoke: ApiInvoker;
}

const AssetTester: React.FC<AssetTesterProps> = ({ invoke }) => {
  const [listResponse, setListResponse] = useState<ApiResponse | null>(null);
  const [createResponse, setCreateResponse] = useState<ApiResponse | null>(null);
  const [detailResponse, setDetailResponse] = useState<ApiResponse | null>(null);
  const [scanResponse, setScanResponse] = useState<ApiResponse | null>(null);
  const [deleteResponse, setDeleteResponse] = useState<ApiResponse | null>(null);
  const [listParams, setListParams] = useState({ page: 1, limit: 20, keyword: '' });
  const [detailId, setDetailId] = useState('');
  const [scanId, setScanId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [assetForm, setAssetForm] = useState({
    name: '',
    category_id: '',
    org_id: '',
    department_id: '',
    user_id: '',
    location: '',
    brand: '',
    model: '',
    serial_no: '',
    supplier: '',
    purchase_date: '',
    purchase_price: '',
    warranty_expire_date: '',
    expected_life_years: '',
    remark: ''
  });

  const handleList = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingList(true);
    const response = await invoke('/assets', {
      method: 'GET',
      query: {
        page: listParams.page,
        limit: listParams.limit,
        keyword: listParams.keyword
      }
    });
    setListResponse(response);
    setLoadingList(false);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    const payload: Record<string, unknown> = {};
    Object.entries(assetForm).forEach(([key, value]) => {
      if (value !== '') {
        payload[key] = key.endsWith('_id') || key.endsWith('_years') ? Number(value) : value;
      }
    });
    const response = await invoke('/assets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setCreateResponse(response);
    setCreating(false);
  };

  const handleDetail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailId) return;
    const response = await invoke(`/assets/${detailId}`, { method: 'GET' });
    setDetailResponse(response);
  };

  const handleScan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scanId) return;
    const response = await invoke(`/assets/scan/${scanId}`, { method: 'GET' });
    setScanResponse(response);
  };

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deleteId) return;
    const response = await invoke(`/assets/${deleteId}`, { method: 'DELETE' });
    setDeleteResponse(response);
  };

  const handleBatchQr = async () => {
    const response = await invoke('/assets/qrcode/batch', { method: 'POST' });
    setDeleteResponse(response);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>资产列表</h2>
        <form onSubmit={handleList} className="form-grid compact">
          <label>
            页码
            <input
              type="number"
              min={1}
              value={listParams.page}
              onChange={event => setListParams(params => ({ ...params, page: Number(event.target.value) }))}
            />
          </label>
          <label>
            每页数量
            <input
              type="number"
              min={1}
              value={listParams.limit}
              onChange={event => setListParams(params => ({ ...params, limit: Number(event.target.value) }))}
            />
          </label>
          <label>
            关键字
            <input
              type="text"
              value={listParams.keyword}
              onChange={event => setListParams(params => ({ ...params, keyword: event.target.value }))}
              placeholder="资产名称/编号"
            />
          </label>
          <button type="submit" className="primary" disabled={loadingList}>
            {loadingList ? '加载中…' : '查询'}
          </button>
        </form>
        <ResponseView response={listResponse} />
      </section>

      <section className="card">
        <h2>创建资产</h2>
        <p className="help">仅填写需要的字段，ID 类字段需使用数据库中的数值。</p>
        <form onSubmit={handleCreate} className="form-grid">
          {Object.entries(assetForm).map(([key, value]) => (
            <label key={key}>
              {labelMap[key as keyof typeof assetForm] || key}
              <input
                type={key.includes('date') ? 'date' : 'text'}
                value={value}
                onChange={event =>
                  setAssetForm(form => ({
                    ...form,
                    [key]: event.target.value
                  }))
                }
              />
            </label>
          ))}
          <button type="submit" className="primary" disabled={creating}>
            {creating ? '提交中…' : '创建资产'}
          </button>
        </form>
        <ResponseView response={createResponse} />
      </section>

      <section className="card">
        <h2>资产详情</h2>
        <form onSubmit={handleDetail} className="form-inline">
          <input
            type="number"
            min={1}
            value={detailId}
            onChange={event => setDetailId(event.target.value)}
            placeholder="资产主键ID"
          />
          <button type="submit">查询</button>
        </form>
        <ResponseView response={detailResponse} />
      </section>

      <section className="card">
        <h2>扫码查询资产</h2>
        <form onSubmit={handleScan} className="form-inline">
          <input
            type="text"
            value={scanId}
            onChange={event => setScanId(event.target.value)}
            placeholder="资产编号"
          />
          <button type="submit">查询</button>
        </form>
        <ResponseView response={scanResponse} />
      </section>

      <section className="card">
        <h2>删除/报废资产</h2>
        <form onSubmit={handleDelete} className="form-inline">
          <input
            type="number"
            min={1}
            value={deleteId}
            onChange={event => setDeleteId(event.target.value)}
            placeholder="资产主键ID"
          />
          <button type="submit" className="danger">
            标记报废
          </button>
        </form>
        <button onClick={handleBatchQr} className="secondary">
          批量生成缺失二维码
        </button>
        <ResponseView response={deleteResponse} />
      </section>
    </div>
  );
};

const labelMap: Record<string, string> = {
  name: '资产名称',
  category_id: '分类ID',
  org_id: '所属组织ID',
  department_id: '所属部门ID',
  user_id: '负责人用户ID',
  location: '存放位置',
  brand: '品牌',
  model: '型号',
  serial_no: '序列号',
  supplier: '供应商',
  purchase_date: '采购日期',
  purchase_price: '采购价格',
  warranty_expire_date: '质保到期日',
  expected_life_years: '预计寿命（年）',
  remark: '备注'
};

export default AssetTester;
