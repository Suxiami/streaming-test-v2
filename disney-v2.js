// Disney+ 解锁检测 v2
// 原版误判：
//   1. 只返回 message，没有 status 字段，前端读不到 status 就显示不可用
//      ——能用的节点也被判不可用，这是最主要的原因
//   2. 超时只有 5 秒，慢一点的节点直接失败
// v2 规则：保留原版 GraphQL 地区检测（这个方法本身没问题），
//   全部结果都带上 status；网络失败时改测 disneyplus.com 首页兜底；
//   台湾用 🇨🇳
const DISNEY_LOCATION_BASE_URL = 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql';

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

function done(status, message) {
    $done({ response: { status: 200, body: JSON.stringify({ status: status, message: message }), headers: { "Content-Type": "application/json" } } });
}

// GraphQL 失败时兜底：能打开官网首页也算可用（地区未知）
function fallbackHomepage() {
    $httpClient.get({
        url: 'https://www.disneyplus.com/',
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    }, function (error, response, data) {
        if (!error && response.status === 200 && (data || '').length > 5000) {
            done('success', 'Disney+：可用（地区未知）');
        } else {
            done('failed', 'Disney+：连接失败');
        }
    });
}

$httpClient.post({
    url: DISNEY_LOCATION_BASE_URL,
    timeout: 10000,
    headers: {
        'Accept-Language': 'en',
        "Authorization": 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
        'Content-Type': 'application/json',
        'User-Agent': 'UA'
    },
    body: JSON.stringify({
        query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
        variables: {
            input: {
                applicationRuntime: 'chrome',
                attributes: {
                    browserName: 'chrome',
                    browserVersion: '94.0.4606',
                    manufacturer: 'microsoft',
                    model: null,
                    operatingSystem: 'windows',
                    operatingSystemVersion: '10.0',
                    osDeviceIds: [],
                },
                deviceFamily: 'browser',
                deviceLanguage: 'en',
                deviceProfile: 'windows',
            },
        },
    }),
}, function (errormsg, response, data) {
    if (errormsg) {
        fallbackHomepage();
        return;
    }
    if (response.status !== 200) {
        fallbackHomepage();
        return;
    }
    try {
        var resData = JSON.parse(data);
        if (resData && resData.extensions && resData.extensions.sdk && resData.extensions.sdk.session) {
            var session = resData.extensions.sdk.session;
            var countryCode = (session.location && session.location.countryCode) || 'UNKNOWN';
            var flag = flags.get(String(countryCode).toUpperCase()) || '🌍';
            if (session.inSupportedLocation) {
                done('success', 'Disney+：可用 ' + flag + ' (' + countryCode + ')');
            } else {
                done('failed', 'Disney+：该地区暂不支持 ' + flag + ' (' + countryCode + ')');
            }
        } else {
            fallbackHomepage();
        }
    } catch (e) {
        fallbackHomepage();
    }
});
