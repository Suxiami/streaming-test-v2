// 最小测试前端：只返回一个简单的 HTML 页面
var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Test</title></head><body style="background:#0f172a;color:#fff;font-size:24px;padding:40px;">Hello, test OK!<br>如果你看到这行字，说明脚本能正常工作。</body></html>';
$done({
  response: {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    body: html
  }
});
