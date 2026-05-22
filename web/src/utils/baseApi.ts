const BASE_TOKEN = import.meta.env.VITE_BASE_TOKEN;
const FEISHU_PAT = import.meta.env.VITE_FEISHU_PAT;

async function baseRequest(endpoint: string, options: RequestInit = {}) {
  // 检测是否在 Vercel 环境（生产环境使用 API Route）
  const isProduction = import.meta.env.PROD;
  const baseUrl = isProduction ? '/api/bitable-proxy' : '/api/bitable';
  
  const url = `${baseUrl}/apps/${BASE_TOKEN}${endpoint}`;
  console.log('Request URL:', url);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 开发环境直接传递 PAT，生产环境由 API Route 处理
  if (!isProduction && FEISHU_PAT) {
    headers['Authorization'] = `Bearer ${FEISHU_PAT}`;
  }
  
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
