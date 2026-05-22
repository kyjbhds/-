// Vercel API Route - 代理飞书 Base API 请求
// 使用 App ID + App Secret 获取 tenant_access_token，无需 PAT

let cachedToken = null;
let tokenExpireTime = 0;

async function getTenantAccessToken() {
  // 如果缓存的token还有效（提前5分钟过期），直接返回
  if (cachedToken && Date.now() < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const appId = process.env.VITE_FEISHU_APP_ID;
  const appSecret = process.env.VITE_FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET');
  }

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Failed to get token: ${data.msg}`);
  }

  cachedToken = data.tenant_access_token;
  tokenExpireTime = Date.now() + data.expire * 1000;

  return cachedToken;
}

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 从请求路径中提取飞书 API 路径
    const path = req.url.replace('/api/bitable-proxy', '');
    const targetUrl = `https://open.feishu.cn/open-apis/bitable/v1${path}`;

    console.log('Proxying request to:', targetUrl);
    console.log('Method:', req.method);

    // 获取 tenant_access_token
    const token = await getTenantAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // 转发请求到飞书 API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    // 设置响应状态码并返回数据
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy request failed',
      message: error.message,
    });
  }
}
