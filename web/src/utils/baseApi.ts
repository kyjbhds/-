const BASE_TOKEN = import.meta.env.VITE_BASE_TOKEN;
const ALIYUN_FC_URL = import.meta.env.VITE_ALIYUN_FC_URL || '';

async function baseRequest(endpoint: string, options: RequestInit = {}) {
  const isProduction = import.meta.env.PROD;
  
  let baseUrl: string;
  
  if (isProduction && ALIYUN_FC_URL) {
    // 阿里云函数计算代理
    baseUrl = ALIYUN_FC_URL;
  } else if (isProduction) {
    // 生产环境相对路径代理（Vercel）
    baseUrl = '/api/bitable-proxy';
  } else {
    // 开发环境代理
    baseUrl = '/api/bitable';
  }
  
  const url = `${baseUrl}/apps/${BASE_TOKEN}${endpoint}`;
  console.log('Request URL:', url);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  const text = await response.text();
  console.log('Response text:', text.substring(0, 200));
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', text);
    throw new Error('Invalid JSON response');
  }
}

export async function listRecords(tableId: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return baseRequest(`/tables/${tableId}/records${query}`, { method: 'GET' });
}

export async function createRecord(tableId: string, fields: Record<string, any>) {
  return baseRequest(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
}

export async function updateRecord(tableId: string, recordId: string, fields: Record<string, any>) {
  return baseRequest(`/tables/${tableId}/records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
}

export async function deleteRecord(tableId: string, recordId: string) {
  return baseRequest(`/tables/${tableId}/records/${recordId}`, { method: 'DELETE' });
}
