// server.js - Máy chủ HTTP tĩnh nhẹ (Zero Dependencies) để chạy và chia sẻ trong mạng LAN cho cả lớp
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;

// Bảng MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Tìm địa chỉ IP mạng nội bộ Wi-Fi/LAN
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  // Chuẩn hóa đường dẫn URL
  let parsedUrl = req.url.split('?')[0];
  if (parsedUrl === '/' || parsedUrl === '') {
    parsedUrl = '/index.html';
  }

  const filePath = path.join(__dirname, parsedUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h3>404 - Không tìm thấy file: ${parsedUrl}</h3>`);
      } else {
        res.writeHead(500);
        res.end(`Lỗi máy chủ: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('\n===============================================================');
  console.log('🚀 LMS ĐỀ CƯƠNG & LUYỆN THI LỚP HỌC ĐANG CHẠY!');
  console.log('===============================================================');
  console.log(`💻 Truy cập trên máy tính này:  http://localhost:${PORT}`);
  console.log(`📱 Mở trên ĐIỆN THOẠI (cùng Wi-Fi): http://${localIP}:${PORT}`);
  console.log('===============================================================');
  console.log('👉 Nhấn Ctrl + C để dừng máy chủ bất cứ lúc nào.\n');
});
