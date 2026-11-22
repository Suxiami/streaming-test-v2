// Netflix 解锁检测 v2
// 改进点：同时测两个片名，区分「仅自制」和「完整全库」
//   自制剧：80211492（Netflix Original，一定在自制库里）
//   非自制授权片：70143836《绝命毒师 Breaking Bad》（第三方授权，非自制）
//   两个都 200 = 完整支持，全库
//   只有自制 200，非自制 404 = 仅支持自制剧，部分库
//   两个都 403/404 = 不支持
const NF_ORIGINAL_URL = "https://www.netflix.com/title/80211492";
const NF_LICENSED_URL = "https://www.netflix.com/title/70143836";
let result = {};
const flags = new Map([
    ["AC", "🇦🇨"], ["AE", "🇦🇪"], ["AF", "🇦🇫"], ["AI", "🇦🇮"],
    ["AL", "🇦🇱"], ["AM", "🇦🇲"], ["AQ", "🇦🇶"], ["AR", "🇦🇷"],
    ["AS", "🇦🇸"], ["AT", "🇦🇹"], ["AU", "🇦🇺"], ["AW", "🇦🇼"],
    ["AX", "🇦🇽"], ["AZ", "🇦🇿"], ["BA", "🇧🇦"], ["BB", "🇧🇧"],
    ["BD", "🇧🇩"], ["BE", "🇧🇪"], ["BF", "🇧🇫"], ["BG", "🇧🇬"],
    ["BH", "🇧🇭"], ["BI", "🇧🇮"], ["BJ", "🇧🇯"], ["BM", "🇧🇲"],
    ["BN", "🇧🇳"], ["BO", "🇧🇴"], ["BR", "🇧🇷"], ["BS", "🇧🇸"],
    ["BT", "🇧🇹"], ["BV", "🇧🇻"], ["BW", "🇧🇼"], ["BY", "🇧🇾"],
    ["BZ", "🇧🇿"], ["CA", "🇨🇦"], ["CF", "🇨🇫"], ["CH", "🇨🇭"],
    ["CK", "🇨🇰"], ["CL", "🇨🇱"], ["CM", "🇨🇲"], ["CN", "🇨🇳"],
    ["CO", "🇨🇴"], ["CP", "🇨🇵"], ["CR", "🇨🇷"], ["CU", "🇨🇺"],
    ["CV", "🇨🇻"], ["CW", "🇨🇼"], ["CX", "🇨🇽"], ["CY", "🇨🇾"],
    ["CZ", "🇨🇿"], ["DE", "🇩🇪"], ["DG", "🇩🇬"], ["DJ", "🇩🇯"],
    ["DK", "🇩🇰"], ["DM", "🇩🇲"], ["DO", "🇩🇴"], ["DZ", "🇩🇿"],
    ["EA", "🇪🇦"], ["EC", "🇪🇨"], ["EE", "🇪🇪"], ["EG", "🇪🇬"],
    ["EH", "🇪🇭"], ["ER", "🇪🇷"], ["ES", "🇪🇸"], ["ET", "🇪🇹"],
    ["EU", "🇪🇺"], ["FI", "🇫🇮"], ["FJ", "🇫🇯"], ["FK", "🇫🇰"],
    ["FM", "🇫🇲"], ["FO", "🇫"], ["FR", "🇫🇷"], ["GA", "🇬🇦"],
    ["GB", "🇬🇧"], ["HK", "🇭🇰"], ["HU", "🇭🇺"], ["ID", "🇮🇩"],
    ["IE", "🇮🇪"], ["IL", "🇮🇱"], ["IM", "🇮🇲"], ["IN", "🇮🇳"],
    ["IS", "🇮🇸"], ["IT", "🇮🇹"], ["JP", "🇯🇵"], ["KR", "🇰🇷"],
    ["LU", "🇱🇺"], ["MO", "🇲🇴"], ["MX", "🇲🇽"], ["MY", "🇲🇾"],
    ["NL", "🇳🇱"], ["PH", "🇵🇭"], ["RO", "🇷🇴"], ["RS", "🇷🇸"],
    ["RU", "🇷🇺"], ["RW", "🇷🇼"], ["SA", "🇸🇦"], ["SB", "🇧"],
    ["SC", "🇸🇨"], ["SD", "🇸🇩"], ["SE", "🇸🇪"], ["SG", "🇸🇬"],
    ["TH", "🇹🇭"], ["TN", "🇹🇳"], ["TO", "🇹🇴"], ["TR", "🇹🇷"],
    ["TV", "🇹🇻"], ["TW", "🇨🇳"], ["UK", "🇬🇧"], ["UM", "🇺🇲"],
    ["US", "🇺🇸"], ["UY", "🇺🇾"], ["UZ", "🇺🇿"], ["VA", "🇻🇦"],
    ["VE", "🇻🇪"], ["VG", "🇻🇬"], ["VI", "🇻🇮"], ["VN", "🇻🇳"],
    ["ZA", "🇿🇦"]
]);

function logWithTimestamp(message) {
    const timestamp = new Date().toLocaleString('zh-CN', {
        hour12: false,
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(',', '');
    console.log(`[${timestamp}] ${message}`);
}

// 从响应头里解析 Netflix 地区代码，返回 {flag, code}，解析不到返回 null
function parseRegion(response) {
    let ourl = response.headers['X-Originating-URL'] ||
               response.headers['X-Originating-Url'] ||
               response.headers['x-originating-url'];
    if (!ourl) return null;
    let urlParts = ourl.split('/');
    let region = urlParts[3] ? urlParts[3] : 'title';
    region = region.split('-')[0];
    if (region === 'title') region = 'us';
    const code = region.toUpperCase();
    return { flag: flags.get(code) || '🇺🇳 未知', code: code };
}

// 测一个片名，返回 Promise<{ok: boolean, status: number, region: {flag, code}|null}>
function nfGet(url) {
    return new Promise((resolve) => {
        let params = {
            url: url,
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15'
            }
        };
        $httpClient.get(params, (errormsg, response, data) => {
            if (errormsg) {
                logWithTimestamp(`❌ 请求 ${url} 发生错误: ${JSON.stringify(errormsg)}`);
                resolve({ ok: false, status: 0, region: null, error: true });
                return;
            }
            logWithTimestamp(`✔️ ${url} 状态码: ${response.status}`);
            resolve({
                ok: response.status === 200,
                status: response.status,
                region: response.status === 200 ? parseRegion(response) : null,
                error: false
            });
        });
    });
}

function finish() {
    $done({
        response: {
            status: 200,
            body: JSON.stringify(result),
            headers: { "Content-Type": "application/json" }
        }
    });
}

async function nfTestV2() {
    logWithTimestamp("▷ 开始 Netflix 双片名检测（自制 + 非自制）...");
    const original = await nfGet(NF_ORIGINAL_URL);   // 自制剧 80211492
    const licensed = await nfGet(NF_LICENSED_URL);   // 非自制《绝命毒师》70143836

    // 网络错误
    if (original.error && licensed.error) {
        result = { status: "failed", message: "Netflix: 检测失败 ❗️" };
        logWithTimestamp(`✓ 设置结果: ${result.message}`);
        finish();
        return;
    }

    // 地区以自制那次为准，拿不到就用非自制那次
    const region = original.region || licensed.region;
    const regionText = region ? `⟦${region.flag}（${region.code}）⟧` : "⟦未知地区⟧";

    if (original.ok && licensed.ok) {
        // 两个都能看 = 完整全库
        result = {
            status: "success",
            message: `Netflix: 完整支持 ${regionText} 🎉\n自制剧：✅ 能看\n非自制授权片：✅ 能看\n片库：完整全库`
        };
    } else if (original.ok && !licensed.ok) {
        // 只有自制能看 = 部分库
        result = {
            status: "partial",
            message: `Netflix: 仅支持自制剧 ${regionText} ⚠️\n自制剧：✅ 能看\n非自制授权片：❌ 不能看\n片库：仅部分库（自制剧）`
        };
    } else if (!original.ok && licensed.ok) {
        // 罕见：自制挂了但非自制能看，仍算部分支持
        result = {
            status: "partial",
            message: `Netflix: 部分支持 ${regionText} ⚠️\n自制剧：❌ 不能看\n非自制授权片：✅ 能看\n片库：仅部分库`
        };
    } else {
        // 两个都 403/404 = 不支持
        result = {
            status: "failed",
            message: "Netflix: 未支持 🚫\n自制剧：❌ 不能看\n非自制授权片：❌ 不能看"
        };
    }

    logWithTimestamp(`🎯 检测结果: ${JSON.stringify(result, null, 2)}`);
    finish();
}

// 注意：finish() 里已经调过一次 $done，不要再调第二次，
// 否则第二次空 $done 会把第一次的检测结果覆盖掉
nfTestV2().catch(error => {
    logWithTimestamp(`\n❌ 发生错误: ${JSON.stringify({ error: error }, null, 2)}`);
    result = { status: "failed", message: "Netflix: 检测失败 ❗️" };
    finish();
});
