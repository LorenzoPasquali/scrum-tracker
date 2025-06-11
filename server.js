import express from 'express';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const app = express();
const __dirname = path.resolve();

// Configura LowDB
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { entries: [] });
await db.read();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/entries
app.get('/api/entries', async (_, res) => {
  await db.read();
  res.json(db.data.entries);
});

// POST /api/task
app.post('/api/task', async (req, res) => {
  const { date, type, text, time } = req.body;
  await db.read();
  let entry = db.data.entries.find(e => e.date === date);
  if (!entry) {
    entry = { id: Date.now(), date, did: [], will: [] };
    db.data.entries.push(entry);
  }
  const taskId = Date.now();
  const task = { id: taskId, text, time };
  if (type === 'did') entry.did.push(task);
  else entry.will.push(task);
  await db.write();
  res.json(task);
});

// PUT /api/task
app.put('/api/task', async (req, res) => {
  const { date, type, id, text } = req.body;
  await db.read();
  const entry = db.data.entries.find(e => e.date === date);
  if (!entry) return res.status(404).send('Entry not found');
  const arr = type === 'did' ? entry.did : entry.will;
  const task = arr.find(t => t.id === id);
  if (!task) return res.status(404).send('Task not found');
  task.text = text;
  await db.write();
  res.json(task);
});

// DELETE /api/task
app.delete('/api/task', async (req, res) => {
  const { date, type, id } = req.body;
  await db.read();
  const entry = db.data.entries.find(e => e.date === date);
  if (!entry) return res.status(404).send('Entry not found');
  const arrKey = type === 'did' ? 'did' : 'will';
  entry[arrKey] = entry[arrKey].filter(t => t.id !== id);
  await db.write();
  res.sendStatus(204);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));