const http = require('http');
const data = JSON.stringify({ title: 'Test Task', status: 'pending', priority: 'medium' });
const options = {
  hostname: '127.0.0.1',
  port: 5001,
  path: '/api/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(body);

    http.get('http://127.0.0.1:5001/api/tasks', (getRes) => {
      let out = '';
      getRes.on('data', (chunk) => (out += chunk));
      getRes.on('end', () => {
        console.log('GET STATUS', getRes.statusCode);
        console.log(out);
      });
    }).on('error', (err) => console.error('GET ERR', err));
  });
});
req.on('error', (err) => console.error('POST ERR', err));
req.write(data);
req.end();
