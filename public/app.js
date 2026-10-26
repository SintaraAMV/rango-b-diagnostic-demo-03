let currentProjectId = null;
let currentTaskId = null;

async function loadProjects() {
  const res = await fetch('/api/projects');
  const projects = await res.json();
  const list = document.getElementById('project-list');
  list.innerHTML = '';
  projects.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    li.onclick = () => showTasks(p.id, p.name);
    list.appendChild(li);
  });
}

async function showTasks(projectId, name) {
  currentProjectId = projectId;
  document.getElementById('projects').style.display = 'none';
  document.getElementById('tasks').style.display = 'block';
  document.getElementById('task-detail').style.display = 'none';
  document.getElementById('project-title').textContent = name;

  const res = await fetch(`/api/tasks?projectId=${projectId}`);
  const tasks = await res.json();
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.title}</strong> — ${t.status}<br><small>${t.notes || 'No notes'}</small>`;
    li.onclick = () => showTaskDetail(t.id);
    list.appendChild(li);
  });
}

async function showTaskDetail(id) {
  currentTaskId = id;
  document.getElementById('tasks').style.display = 'none';
  document.getElementById('task-detail').style.display = 'block';

  const res = await fetch(`/api/tasks/${id}`);
  const task = await res.json();
  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('status-select').value = task.status;
  document.getElementById('notes-input').value = task.notes || '';
  document.getElementById('save-message').textContent = '';
}

document.getElementById('back-btn').onclick = () => {
  document.getElementById('tasks').style.display = 'none';
  document.getElementById('projects').style.display = 'block';
  loadProjects();
};

document.getElementById('detail-back-btn').onclick = () => {
  showTasks(currentProjectId, document.getElementById('project-title').textContent);
};

document.getElementById('save-btn').onclick = async () => {
  const status = document.getElementById('status-select').value;
  const notes = document.getElementById('notes-input').value;
  const res = await fetch(`/api/tasks/${currentTaskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });
  if (res.ok) {
    document.getElementById('save-message').textContent = 'Changes saved';
    setTimeout(() => {
      document.getElementById('save-message').textContent = '';
    }, 2000);
  } else {
    document.getElementById('save-message').textContent = 'Error saving';
    document.getElementById('save-message').style.color = 'red';
  }
};

loadProjects();