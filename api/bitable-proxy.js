// Vercel API Route - 代理飞书 Base API 请求
// 解决生产环境 CORS 跨域问题

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
    // 路径格式: /api/bitable-proxy/apps/{BASE_TOKEN}/tables/...
    const path = req.url.replace('/api/bitable-proxy', '');
    const targetUrl = `https://open.feishu.cn/open-apis/bitable/v1${path}`;

    console.log('Proxying request to:', targetUrl);
    console.log('Method:', req.method);

    // 从环境变量获取飞书个人访问令牌
    const token = process.env.VITE_FEISHU_PAT || process.env.FEISHU_PAT;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
