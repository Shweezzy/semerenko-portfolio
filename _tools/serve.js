// Local preview of dist/ with the same clean URLs as Vercel: node _tools/serve.js [port]
const http = require('http'), path = require('path'), handler = require('serve-handler');
const port = +(process.argv[2] || 4300);
http.createServer((req, res) => handler(req, res, { public: path.join(__dirname, '..', 'dist'), cleanUrls: true }))
  .listen(port, () => console.log(`Preview: http://localhost:${port}`));
