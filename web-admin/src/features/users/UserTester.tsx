import React, { useState } from 'react';
import ResponseView from '../../components/common/ResponseView';
import type { ApiResponse } from '../../services/apiClient';
import type { ApiInvoker } from '../../types/api';

interface UserTesterProps {
  invoke: ApiInvoker;
}

const UserTester: React.FC<UserTesterProps> = ({ invoke }) => {
  const [rolesResponse, setRolesResponse] = useState<ApiResponse | null>(null);
  const [orgsResponse, setOrgsResponse] = useState<ApiResponse | null>(null);
  const [departmentsResponse, setDepartmentsResponse] = useState<ApiResponse | null>(null);
  const [userListResponse, setUserListResponse] = useState<ApiResponse | null>(null);
  const [createResponse, setCreateResponse] = useState<ApiResponse | null>(null);
  const [updateResponse, setUpdateResponse] = useState<ApiResponse | null>(null);
  const [assignResponse, setAssignResponse] = useState<ApiResponse | null>(null);

  const [departmentOrgId, setDepartmentOrgId] = useState('');
  const [userQuery, setUserQuery] = useState({ org_id: '', department_id: '', keyword: '', include_inactive: false });

  const [createForm, setCreateForm] = useState<CreateFormState>({
    username: '',
    real_name: '',
    password: '',
    org_id: '',
    department_id: '',
    phone: '',
    email: '',
    role_codes: ''
  });

  const [updateForm, setUpdateForm] = useState<UpdateFormState>({
    id: '',
    real_name: '',
    phone: '',
    email: '',
    password: '',
    department_id: '',
    is_active: '',
    role_codes: ''
  });

  const [assignForm, setAssignForm] = useState({ user_id: '', role_codes: '' });

  const fetchRoles = async () => {
    const response = await invoke('/roles', { method: 'GET' });
    setRolesResponse(response);
  };

  const fetchOrgs = async () => {
    const response = await invoke('/orgs', { method: 'GET' });
    setOrgsResponse(response);
  };

  const fetchDepartments = async (event: React.FormEvent) => {
    event.preventDefault();
    const query: Record<string, string | number | boolean> = {};
    if (departmentOrgId) {
      query.org_id = Number(departmentOrgId);
    }
    const response = await invoke('/departments', { method: 'GET', query });
    setDepartmentsResponse(response);
  };

  const fetchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    const query: Record<string, string | number | boolean> = {};
    if (userQuery.org_id) query.org_id = Number(userQuery.org_id);
    if (userQuery.department_id) query.department_id = Number(userQuery.department_id);
    if (userQuery.keyword) query.keyword = userQuery.keyword;
    if (userQuery.include_inactive) query.include_inactive = true;
    const response = await invoke('/users', { method: 'GET', query });
    setUserListResponse(response);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: Record<string, unknown> = {
      username: createForm.username,
      real_name: createForm.real_name,
      password: createForm.password,
      org_id: Number(createForm.org_id)
    };

    if (createForm.department_id) payload.department_id = Number(createForm.department_id);
    if (createForm.phone) payload.phone = createForm.phone;
    if (createForm.email) payload.email = createForm.email;

    if (createForm.role_codes) {
      payload.role_codes = parseRoleCodes(createForm.role_codes);
    }

    const response = await invoke('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setCreateResponse(response);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!updateForm.id) return;

    const payload: Record<string, unknown> = {};
    if (updateForm.real_name) payload.real_name = updateForm.real_name;
    if (updateForm.phone) payload.phone = updateForm.phone;
    if (updateForm.email) payload.email = updateForm.email;
    if (updateForm.password) payload.password = updateForm.password;
    if (updateForm.department_id) payload.department_id = Number(updateForm.department_id);
    if (updateForm.is_active) payload.is_active = updateForm.is_active === 'true';
    if (updateForm.role_codes) payload.role_codes = parseRoleCodes(updateForm.role_codes);

    const response = await invoke(`/users/${updateForm.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    setUpdateResponse(response);
  };

  const handleAssignRoles = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!assignForm.user_id || !assignForm.role_codes) return;

    const response = await invoke('/user-roles', {
      method: 'POST',
      body: JSON.stringify({
        user_id: Number(assignForm.user_id),
        role_codes: parseRoleCodes(assignForm.role_codes)
      })
    });

    setAssignResponse(response);
  };

  return (
    <div className="grid">
      <section className="card">
        <h2>角色与组织</h2>
        <div className="button-group">
          <button type="button" onClick={fetchRoles}>
            获取角色列表
          </button>
          <button type="button" onClick={fetchOrgs}>
            获取组织列表
          </button>
        </div>
        <ResponseView response={rolesResponse} />
        <ResponseView response={orgsResponse} />
      </section>

      <section className="card">
        <h2>部门查询</h2>
        <form onSubmit={fetchDepartments} className="form-inline">
          <input
            type="number"
            min={1}
            value={departmentOrgId}
            onChange={event => setDepartmentOrgId(event.target.value)}
            placeholder="组织ID，可选"
          />
          <button type="submit">查询部门</button>
        </form>
        <ResponseView response={departmentsResponse} />
      </section>

      <section className="card">
        <h2>用户列表</h2>
        <form onSubmit={fetchUsers} className="form-grid compact">
          <label>
            组织ID
            <input
              type="number"
              value={userQuery.org_id}
              onChange={event => setUserQuery(query => ({ ...query, org_id: event.target.value }))}
              placeholder="可选"
              min={1}
            />
          </label>
          <label>
            部门ID
            <input
              type="number"
              value={userQuery.department_id}
              onChange={event => setUserQuery(query => ({ ...query, department_id: event.target.value }))}
              placeholder="可选"
              min={1}
            />
          </label>
          <label>
            关键字
            <input
              type="text"
              value={userQuery.keyword}
              onChange={event => setUserQuery(query => ({ ...query, keyword: event.target.value }))}
              placeholder="用户名/姓名"
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={userQuery.include_inactive}
              onChange={event => setUserQuery(query => ({ ...query, include_inactive: event.target.checked }))}
            />
            包含停用用户
          </label>
          <button type="submit" className="primary">
            查询用户
          </button>
        </form>
        <ResponseView response={userListResponse} />
      </section>

      <section className="card">
        <h2>创建用户</h2>
        <p className="help">角色编码使用英文逗号分隔，如：ORG_ADMIN,EMPLOYEE</p>
        <form onSubmit={handleCreate} className="form-grid">
          {Object.entries(createForm).map(([key, value]) => (
            <label key={key}>
              {createLabels[key as keyof CreateFormState] || key}
              <input
                type={key.includes('password') ? 'password' : key.includes('_id') ? 'number' : 'text'}
                value={value}
                onChange={event =>
                  setCreateForm(form => ({
                    ...form,
                    [key]: event.target.value
                  }))
                }
                required={['username', 'real_name', 'password', 'org_id'].includes(key)}
                min={key.includes('_id') ? 1 : undefined}
              />
            </label>
          ))}
          <button type="submit" className="primary">
            创建用户
          </button>
        </form>
        <ResponseView response={createResponse} />
      </section>

      <section className="card">
        <h2>更新用户</h2>
        <form onSubmit={handleUpdate} className="form-grid compact">
          {Object.entries(updateForm).map(([key, value]) => (
            <label key={key}>
              {updateLabels[key as keyof UpdateFormState] || key}
              <input
                type={key === 'id' || key.includes('_id') ? 'number' : key.includes('password') ? 'password' : 'text'}
                value={value}
                onChange={event =>
                  setUpdateForm(form => ({
                    ...form,
                    [key]: event.target.value
                  }))
                }
                required={key === 'id'}
                min={key === 'id' || key.includes('_id') ? 1 : undefined}
              />
            </label>
          ))}
          <button type="submit">提交更新</button>
        </form>
        <ResponseView response={updateResponse} />
      </section>

      <section className="card">
        <h2>分配角色</h2>
        <form onSubmit={handleAssignRoles} className="form-inline">
          <input
            type="number"
            min={1}
            value={assignForm.user_id}
            onChange={event => setAssignForm(form => ({ ...form, user_id: event.target.value }))}
            placeholder="用户ID"
            required
          />
          <input
            type="text"
            value={assignForm.role_codes}
            onChange={event => setAssignForm(form => ({ ...form, role_codes: event.target.value }))}
            placeholder="角色编码，逗号分隔"
            required
          />
          <button type="submit">更新角色</button>
        </form>
        <ResponseView response={assignResponse} />
      </section>
    </div>
  );
};

type CreateFormState = {
  username: string;
  real_name: string;
  password: string;
  org_id: string;
  department_id: string;
  phone: string;
  email: string;
  role_codes: string;
};

type UpdateFormState = {
  id: string;
  real_name: string;
  phone: string;
  email: string;
  password: string;
  department_id: string;
  is_active: string;
  role_codes: string;
};

const createLabels: Record<keyof CreateFormState, string> = {
  username: '用户名',
  real_name: '姓名',
  password: '密码',
  org_id: '组织ID',
  department_id: '部门ID',
  phone: '手机号',
  email: '邮箱',
  role_codes: '角色编码列表'
};

const updateLabels: Record<keyof UpdateFormState, string> = {
  id: '用户ID',
  real_name: '姓名',
  phone: '手机号',
  email: '邮箱',
  password: '新密码',
  department_id: '部门ID',
  is_active: '是否启用(true/false)',
  role_codes: '角色编码列表'
};

function parseRoleCodes(value: string): string[] {
  return value
    .split(',')
    .map(code => code.trim())
    .filter(Boolean);
}

export default UserTester;
