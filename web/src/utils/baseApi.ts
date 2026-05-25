const BASE_TOKEN = import.meta.env.VITE_BASE_TOKEN;
const ALIYUN_FC_URL = import.meta.env.VITE_ALIYUN_FC_URL || '';

async function baseRequest(endpoint: string, options: RequestInit = {}) {
  const isProduction = import.meta.env.PROD;
  
  console.log('=== API Request Debug ===');
  console.log('Is production:', isProduction);
  console.log('BASE_TOKEN:', BASE_TOKEN ? 'exists' : 'missing');
  console.log('ALIYUN_FC_URL:', ALIYUN_FC_URL);
  
  let baseUrl: string;
  
  if (isProduction && ALIYUN_FC_URL) {
    baseUrl = ALIYUN_FC_URL;
    console.log('Using Aliyun FC proxy');
  } else if (isProduction) {
    baseUrl = '/api/bitable-proxy';
    console.log('Using relative proxy path');
  } else {
    baseUrl = '/api/bitable';
    console.log('Using dev proxy path');
  }
  
  const url = `${baseUrl}/apps/${BASE_TOKEN}${endpoint}`;
  console.log('Final URL:', url);
  console.log('Request method:', options.method || 'GET');
  console.log('Request body:', options.body);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'omit',
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response text (first 500 chars):', text.substring(0, 500));
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${text}`);
    }
    
    try {
      const json = JSON.parse(text);
      console.log('JSON parsed successfully');
      return json;
    } catch (e) {
      console.error('JSON parse error:', e);
      console.log('Raw response:', text);
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function listRecords(tableId: string, params?: Record<string, string>) {
  console.log('=== listRecords called ===');
  console.log('Table ID:', tableId);
  console.log('Params:', params);
  
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  console.log('Query string:', query);
  
  return baseRequest(`/tables/${tableId}/records${query}`, { method: 'GET' });
}

export async function createRecord(tableId: string, fields: Record<string, any>) {
  console.log('=== createRecord called ===');
  console.log('Table ID:', tableId);
  console.log('Fields:', JSON.stringify(fields, null, 2));
  
  const result = baseRequest(`/tables/${tableId}/records`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  
  console.log('createRecord result:', result);
  return result;
}

export async function updateRecord(tableId: string, recordId: string, fields: Record<string, any>) {
  console.log('=== updateRecord called ===');
  console.log('Table ID:', tableId);
  console.log('Record ID:', recordId);
  console.log('Fields:', JSON.stringify(fields, null, 2));
  
  return baseRequest(`/tables/${tableId}/records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
}

export async function deleteRecord(tableId: string, recordId: string) {
  console.log('=== deleteRecord called ===');
  console.log('Table ID:', tableId);
  console.log('Record ID:', recordId);
  
  return baseRequest(`/tables/${tableId}/records/${recordId}`, { method: 'DELETE' });
}

export async function batchCreateRecords(tableId: string, records: Array<Record<string, any>>) {
  console.log('=== batchCreateRecords called ===');
  console.log('Table ID:', tableId);
  console.log('Records count:', records.length);
  
  return baseRequest(`/tables/${tableId}/records/batch_create`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}
