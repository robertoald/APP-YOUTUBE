const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = 'secret-key'; // In production use env var

app.use(cors());
app.use(bodyParser.json());

// In-memory users and tasks
const users = [
  { id: 1, username: 'admin', role: 'admin' },
  { id: 2, username: 'editor1', role: 'editor' },
  { id: 3, username: 'editor2', role: 'editor' }
];

let tasks = [];
let nextTaskId = 1;

const allowedStatus = ['pendiente', 'edicion', 'terminado', 'publicado'];

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post('/login', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'User not found' });
  const token = jwt.sign(user, SECRET);
  res.json({ token });
});

app.get('/tasks', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    res.json(tasks);
  } else {
    res.json(tasks.filter(task => task.editor === req.user.id));
  }
});

app.post('/tasks', authenticateToken, (req, res) => {
  const { title, description, editor, status, link, deadline, paid, amountPaid, datePaid } = req.body;
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const task = {
    id: nextTaskId++,
    title,
    description,
    editor,
    status,
    link,
    deadline,
    paid: !!paid,
    amountPaid: amountPaid || 0,
    datePaid: datePaid || null
  };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id == id);
  if (!task) return res.sendStatus(404);
  const {
    title,
    description,
    editor,
    status,
    link,
    deadline,
    paid,
    amountPaid,
    datePaid
  } = req.body;
  if (status && !allowedStatus.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  Object.assign(task, {
    title: title !== undefined ? title : task.title,
    description: description !== undefined ? description : task.description,
    editor: editor !== undefined ? editor : task.editor,
    status: status !== undefined ? status : task.status,
    link: link !== undefined ? link : task.link,
    deadline: deadline !== undefined ? deadline : task.deadline,
    paid: paid !== undefined ? paid : task.paid,
    amountPaid: amountPaid !== undefined ? amountPaid : task.amountPaid,
    datePaid: datePaid !== undefined ? datePaid : task.datePaid
  });
  res.json(task);
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id == id);
  if (index === -1) return res.sendStatus(404);
  tasks.splice(index, 1);
  res.sendStatus(204);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
