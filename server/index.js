// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getAllItems, upsertItems, deleteItemById } from './db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. /api/openai/vision will fail until it is provided.');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Catalog DB endpoints
app.get('/api/catalog', (_req, res) => {
  try {
    const items = getAllItems();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB read error' });
  }
});

app.post('/api/catalog', (req, res) => {
  try {
    const { items } = req.body || {};
    const numIncoming = Array.isArray(items) ? items.length : 0;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    const saved = upsertItems(items);
    console.log(`[catalog] received: ${numIncoming}, saved: ${saved}${items?.[0]?.id ? `, sample id: ${items[0].id}` : ''}`);
    res.json({ saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB write error' });
  }
});

app.delete('/api/catalog/:id', (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const deleted = deleteItemById(id);
    if (deleted > 0) {
      return res.json({ deleted });
    }
    return res.status(404).json({ error: 'not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

app.post('/api/openai/vision', async (req, res) => {
  try {
    const { model = 'gpt-4o', imageDataUrl } = req.body || {};
    if (!imageDataUrl) {
      return res.status(400).json({ error: 'imageDataUrl is required' });
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
    }

    const prompt = `You are a product stylist. Given a transparent PNG of eyeglass frames, infer suitable face shapes and common style tags.\nReturn a STRICT JSON object with keys: recommendedFor (array of face shapes from [round, square, oval, oblong, heart, diamond]), styles (array of strings), and reasoning (short string). No extra text.`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      },
    ];

    const body = { model, messages, temperature: 0.2, response_format: { type: 'json_object' } };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error('OpenAI error', resp.status, text);
      return res.status(resp.status).send(text);
    }

    return res.type('application/json').send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
}); 