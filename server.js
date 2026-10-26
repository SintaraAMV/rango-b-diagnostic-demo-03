const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'taskboard.db');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let taskListCache = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'todo',
        notes TEXT DEFAULT '',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `);
    // Seed data
    db.run("INSERT INTO projects (name) VALUES (?)", ["Website Redesign"]);
    db.run("INSERT INTO projects (name) VALUES (?)", ["Mobile App Launch"]);
    db.run("INSERT INTO tasks (project_id, title, status, notes) VALUES (?, ?, ?, ?)", [1, "Design homepage mockup", "in_progress", "Waiting for client feedback on colors"]);
    db.run("INSERT INTO tasks (project_id, title, status, notes) VALUES (?, ?, ?, ?)", [1, "Implement responsive layout", "todo", ""]);
    db.run("INSERT INTO tasks (project_id, title, status, notes) VALUES (?, ?, ?, ?)", [2, "Set up CI pipeline", "done", "Completed last week"]);
    db.run("INSERT INTO tasks (project_id, title, status, notes) VALUES (?, ?, ?, ?)", [2, "Write API documentation", "todo", "Need to cover new endpoints"]);
    saveDatabase();
  }
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getTasksFromDb(projectId) {
  const stmt = db.prepare("SELECT id, project_id, title, status, notes, updated_at FROM tasks WHERE project_id = ? ORDER BY id");
  stmt.bind([projectId]);
  const tasks = [];
  while (stmt.step()) {
    tasks.push(stmt.getAsObject());
  }
  stmt.free();
  return tasks;
}

app.get('/api/projects', (req, res) => {
  const stmt = db.prepare("SELECT id, name FROM projects ORDER BY id");
  const projects = [];
  while (stmt.step()) {
    projects.push(stmt.getAsObject());
  }
  stmt.free();
  res.json(projects);
});

app.get('/api/tasks', (req, res) => {
  const projectId = parseInt(req.query.projectId, 10);
  if (!projectId) return res.status(400).json({ error: 'projectId required' });

  if (taskListCache && taskListCache.projectId === projectId) {
    return res.json(taskListCache.tasks);
  }

  const tasks = getTasksFromDb(projectId);
  taskListCache = { projectId, tasks };
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const stmt = db.prepare("SELECT id, project_id, title, status, notes, updated_at FROM tasks WHERE id = ?");
  stmt.bind([id]);
  if (stmt.step()) {
    const task = stmt.getAsObject();
    stmt.free();
    return res.json(task);
  }
  stmt.free();
  res.status(404).json({ error: 'Task not found' });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status, notes } = req.body;

  if (!status) return res.status(400).json({ error: 'status required' });

  // Update database
  db.run("UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
  saveDatabase();

  // Update cache if present
  if (taskListCache && taskListCache.tasks) {
    const task = taskListCache.tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      if (notes !== undefined) {
        task.notes = notes;
      }
      task.updated_at = new Date().toISOString();
    }
  }

  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`TaskBoard running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});