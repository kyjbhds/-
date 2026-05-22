// 阿里云函数计算 - 飞书API代理
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

module.exports.handler = async function(req, resp, context) {
    resp.setHeader('Content-Type', 'application/json');
    resp.setHeader('Access-Control-Allow-Origin', '*');
    resp.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    resp.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        resp.setStatusCode(200);
        resp.send('');
        return;
    }

    try {
        const appId = process.env.FEISHU_APP_ID;
        const appSecret = process.env.FEISHU_APP_SECRET;

        if (!appId || !appSecret) {
            resp.setStatusCode(500);
            resp.send(JSON.stringify({ error: 'Missing FEISHU credentials' }));
            return;
        }

        const token = await getTenantAccessToken(appId, appSecret);

        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = JSON.parse(req.body || '{}');
        }

        const path = req.path.replace('/api/bitable-proxy', '');
        
        const result = await proxyToFeishu(path, req.method, token, body);

        resp.setStatusCode(result.statusCode);
        resp.send(result.data);
    } catch (error) {
        console.error('Proxy error:', error);
        resp.setStatusCode(500);
        resp.send(JSON.stringify({
            error: 'Proxy request failed',
            message: error.message
        }));
    }
};
