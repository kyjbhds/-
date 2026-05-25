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
    
    // 阿里云HTTP触发器的请求格式
    const method = request.httpMethod || request.method || 'GET';
    const path = request.path || request.url || '/';
    const body = request.body || null;

    // 处理路径
    let targetPath = path;
    if (targetPath.startsWith('/api/bitable-proxy')) {
        targetPath = targetPath.replace('/api/bitable-proxy', '');
    }
    if (!targetPath) {
        targetPath = '/';
    }

    // 健康检查
    if (targetPath === '/' || targetPath === '/health') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'X-Content-Type-Options': 'nosniff'
            },
            body: JSON.stringify({ status: 'ok', message: 'Proxy is running' })
        };
    }

    try {
        const appId = process.env.FEISHU_APP_ID;
        const appSecret = process.env.FEISHU_APP_SECRET;

        if (!appId || !appSecret) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Missing FEISHU credentials' })
            };
        }

        const token = await getTenantAccessToken(appId, appSecret);

        let requestBody = null;
        if (body && method !== 'GET' && method !== 'HEAD') {
            try {
                requestBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (e) {
                requestBody = body;
            }
        }

        const result = await proxyToFeishu(targetPath, method, token, requestBody);

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
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'X-Content-Type-Options': 'nosniff'
            },
            body: responseBody
        };
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Proxy request failed',
                message: error.message
            })
        };
    }
};
