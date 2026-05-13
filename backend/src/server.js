require('dotenv').config();

const cors = require('cors');
const express = require('express');

const { debates, destinations, feed } = require('./data/mockData');

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || '*';

app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'TRUEFEED API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/feed', (_req, res) => {
  res.json(feed);
});

app.get('/api/destinations', (_req, res) => {
  res.json(destinations);
});

app.get('/api/debates', (_req, res) => {
  res.json(debates);
});

app.post('/api/posts', (req, res) => {
  const payload = req.body ?? {};

  res.status(201).json({
    message: 'Brouillon recu. Branche cette route a la base de donnees ensuite.',
    receivedAt: new Date().toISOString(),
    payload,
  });
});

app.listen(port, () => {
  console.log(`TRUEFEED API listening on http://localhost:${port}`);
});
