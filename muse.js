// Muse (muse.ai) 解锁检测
// 仿照 chatgpt.js 的 $httpClient.get 结构
// 200 且页面不含 blocked / access denied 字样 = 可用
async function WebTest_Muse() {
    const log = (message) => {
        console.log(`[${new Date().toLocaleString()}] ${message}`);
    };

    try {
        log("🚀 开始检测 Muse 服务可用性...");

        const testUrl = 'https://muse.ai/';
        log(`🔍 正在发起请求...`);
        log(`📄 请求 URL: ${testUrl}`);

        $httpClient.get({
            url: testUrl,
            timeout: 15000,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.9',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
            }
        }, function (error, response, data) {
            let result = {};

            if (error) {
                result = {
                    status: "failed",
                    message: "Muse: 网络连接失败 ❗️"
                };
                log(`❌ 检测结果: ${JSON.stringify(result)}`);
                log(`🔍 错误详情: ${error}`);
                $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
                return;
            }

            log(`✅ Muse: 已收到响应。`);
            log(`📄 响应状态码: ${response.status}`);
            const body = (data || '').toLowerCase();
            log(`📄 响应体长度: ${data ? data.length : 0} 字符`);
            const isBlocked = body.includes('blocked') ||
                              body.includes('access denied') ||
                              body.includes('not available in your country') ||
                              body.includes('unsupported_country');
            log(`🔍 是否含拦截字样: ${isBlocked}`);

            if (response.status === 200 && !isBlocked) {
                result = {
                    status: "success",
                    message: "Muse: 恭喜你，服务可用 ✅"
                };
            } else if (response.status === 403 || isBlocked) {
                result = {
                    status: "failed",
                    message: "Muse: 对不起，该服务在您所在的地区不可用 🚫"
                };
            } else {
                result = {
                    status: "failed",
                    message: `Muse: 检测失败（状态码 ${response.status}）❗️`
                };
            }

            log(`🎉 检测结果: ${JSON.stringify(result)}`);
            $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
        });

    } catch (error) {
        const errorMsg = `Muse: 检测失败（错误: ${error.message}）`;
        let result = {
            status: "failed",
            message: errorMsg
        };
        log(`❌ 检测结果: ${JSON.stringify(result)}`);
        log(`🔍 错误详情: ${error}`);
        $done({ response: { status: 200, body: JSON.stringify(result), headers: { "Content-Type": "application/json" } } });
    }
}

WebTest_Muse();
