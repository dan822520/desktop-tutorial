import React from 'react';
import type { ApiResponse } from '../api';

interface ResponseViewProps {
  response?: ApiResponse | null;
}

const ResponseView: React.FC<ResponseViewProps> = ({ response }) => {
  if (!response) {
    return null;
  }

  const { status, ok, data, error } = response;

  return (
    <div className={`response ${ok ? 'success' : 'error'}`}>
      <header>
        <strong>{ok ? '成功' : '失败'}</strong>
        <span>状态码：{status}</span>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      {data !== undefined ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : null}
    </div>
  );
};

export default ResponseView;
