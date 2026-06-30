const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadPending } = require('./lib/store');

const app = express();
const PORT = parseInt(process.env.TASTE_PORT || '3247', 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/suggest', require('./routes/suggest'));
app.use('/api', require('./routes/review'));
app.use('/api', require('./routes/profile'));

// SSE endpoint for real-time UI updates
const sseClients = new Set();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function broadcast(event, data) {
  for (const client of sseClients) {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

// Attach broadcast and cwd so routes can reference them
app.locals.broadcast = broadcast;
app.locals.cwd = process.cwd();

loadPending();

app.listen(PORT, () => {
  console.log(`\nTaste Review Server running at http://localhost:${PORT}`);
  console.log(`Review pending suggestions at http://localhost:${PORT}\n`);
});

module.exports = app;
