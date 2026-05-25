const https = require('https');

let cachedToken = null;
let tokenExpireTime = 0;

function getTenantAccessToken(appId, appSecret) {
    return new Promise((resolve, reject) => {
        if (cachedToken && Date.now() < tokenExpireTime - 5 * 60 * 1000) {
            return resolve(cachedToken);
        }

        const data = JSON.stringify({
            app_id: appId,
            app_secret: appSecret
        });

        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.code === 0) {
                        cachedToken = result.tenant_access_token;
                        tokenExpireTime = Date.now() + result.expire * 1000;
                        resolve(cachedToken);
                    } else {
                        reject(new Error(`获取token失败: ${result.msg}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function proxyToFeishu(path, method, token, body) {
    return new Promise((resolve, reject) => {
        const targetPath = `/open-apis/bitable/v1${path}`;
        const requestData = body ? JSON.stringify(body) : '';

        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: targetPath,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(body ? { 'Content-Length': requestData.length } : {})
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: responseData
                });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(requestData);
        }
        req.end();
    });
}

// 阿里云函数计算 HTTP 触发器标准入口
exports.handler = async function(event, context) {
    console.log('=== FC Function Start ===');
    console.log('Received event:', JSON.stringify(event));
    console.log('Context:', JSON.stringify(context));
    
    // 解析请求 - 兼容多种格式
    let request;
    try {
        if (typeof event === 'string') {
            request = JSON.parse(event);
        } else {
            request = event;
        }
    } catch (e) {
        request = {};
    }
    
    console.log('Parsed request:', JSON.stringify(request));
    
    // 阿里云HTTP触发器的请求格式 - 支持多种可能的字段名
    const method = request.httpMethod || request.method || 'GET';
    const path = request.path || request.url || request.requestPath || '/';
    const body = request.body || null;
    const headers = request.headers || {};
    
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Headers:', JSON.stringify(headers));

    // 处理路径 - 移除前缀
    let targetPath = path;
    if (targetPath.startsWith('/api/bitable-proxy')) {
        targetPath = targetPath.replace('/api/bitable-proxy', '');
    }
    if (!targetPath) {
        targetPath = '/';
    }
    
    console.log('Target path:', targetPath);

    // 健康检查
    if (targetPath === '/' || targetPath === '/health') {
        console.log('Returning health check');
        return {
            statusCode: 200,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'access-control-allow-headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify({ 
                status: 'ok', 
                message: 'Proxy is running',
                version: '2.0',
                timestamp: new Date().toISOString()
            })
        };
    }

    // 处理预检请求
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'access-control-allow-headers': 'Content-Type, Authorization',
                'access-control-max-age': '86400'
            },
            body: ''
        };
    }

    try {
        // 从环境变量获取飞书配置 - 支持多种变量名
        const appId = process.env.FEISHU_APP_ID || process.env.VITE_FEISHU_APP_ID;
        const appSecret = process.env.FEISHU_APP_SECRET || process.env.VITE_FEISHU_APP_SECRET;
        
        console.log('Environment variables check:');
        console.log('FEISHU_APP_ID exists:', !!process.env.FEISHU_APP_ID);
        console.log('VITE_FEISHU_APP_ID exists:', !!process.env.VITE_FEISHU_APP_ID);
        console.log('FEISHU_APP_SECRET exists:', !!process.env.FEISHU_APP_SECRET);
        console.log('VITE_FEISHU_APP_SECRET exists:', !!process.env.VITE_FEISHU_APP_SECRET);
        console.log('Final App ID exists:', !!appId);
        console.log('Final App Secret exists:', !!appSecret);

        if (!appId || !appSecret) {
            return {
                statusCode: 500,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'access-control-allow-origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Missing FEISHU credentials',
                    detail: 'Please set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables'
                })
            };
        }

        console.log('Getting token...');
        const token = await getTenantAccessToken(appId, appSecret);
        console.log('Token obtained successfully');

        let requestBody = null;
        if (body && method !== 'GET' && method !== 'HEAD') {
            try {
                requestBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (e) {
                requestBody = body;
            }
        }
        
        console.log('Request body:', JSON.stringify(requestBody));
        console.log('Proxying to Feishu path:', targetPath);

        const result = await proxyToFeishu(targetPath, method, token, requestBody);
        console.log('Feishu response status:', result.statusCode);
        console.log('Feishu response data (first 500 chars):', result.data.substring(0, 500));

        // 尝试解析飞书返回的数据
        let responseBody;
        try {
            const parsed = JSON.parse(result.data);
            responseBody = JSON.stringify(parsed);
        } catch (e) {
            responseBody = result.data;
        }

        return {
            statusCode: result.statusCode,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'access-control-allow-headers': 'Content-Type, Authorization'
            },
            body: responseBody
        };
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'access-control-allow-origin': '*'
            },
            body: JSON.stringify({
                error: 'Proxy request failed',
                message: error.message,
                stack: error.stack
            })
        };
    }
};
