/**
 * App.jsx
 * React single-file app component for TaskFlow
 * Designed to be used with in-browser Babel.
 */

const { useState, useEffect, useMemo } = React;
const API = `http://${window.location.hostname}:5001`;

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

function Header({ theme, toggleTheme, version = 'v1.0.0' }) {
  return (
    <header className="tf-header">
      <div className="brand">
        <div className="logo">TF</div>
        <div className="brand-text">
          <div className="brand-title">TaskFlow</div>
          <div className="brand-sub">DevOps · University Project</div>
        </div>
      </div>
      <div className="header-right">
        <div className="version">{version}</div>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

function StatusBadge({ status }) {
  const state = (status || 'pending').toLowerCase();
  const icon = state === 'done' ? '✅' : state === 'in-progress' ? '🔄' : '⏳';
  return <span className={`status-badge ${state}`}><span>{icon}</span>{state.replace(/-/g, ' ')}</span>;
}

function PriorityPill({ priority }) {
  const map = {
    low: ['Low', 'low'],
    medium: ['Medium', 'medium'],
    high: ['High', 'high'],
  };
  const [label, cls] = map[priority] || ['Low', 'low'];
  return <span className={`priority-pill ${cls}`}>{label}</span>;
}

function Sidebar({ apiStatus, logs, milestones }) {
  const status = apiStatus || { message: 'Loading…', healthy: true, worker: true };
  return (
    <aside className="tf-sidebar">
      <section className="status-panel">
        <div className="section-title">API Status</div>
        <div className="section-body">
          <div className="status-row">
            <div>TaskFlow API</div>
            <span className={`badge ${status.healthy ? 'ok' : 'down'}`}>{status.healthy ? 'Healthy' : 'Offline'}</span>
          </div>
          <div className="status-row">
            <div>.NET API</div>
            <span className={`status-pill ${status.healthy ? 'ok' : 'down'}`}>{status.healthy ? 'Healthy' : 'Down'}</span>
          </div>
          <div className="status-row">
            <div>Python Worker</div>
            <span className={`status-pill ${status.worker ? 'ok' : 'down'}`}>{status.worker ? 'Running' : 'Stopped'}</span>
          </div>
          <div className="section-body" style={{ marginTop: '12px' }}>{status.message}</div>
        </div>
      </section>

      <section className="progress-panel">
        <div className="section-title">Project Progress</div>
        <div className="section-body">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${milestones.percent}%` }} />
          </div>
          <div className="status-row" style={{ justifyContent: 'space-between', marginBottom: '18px' }}>
            <span>{milestones.completed} of {milestones.total} milestones</span>
            <strong>{milestones.percent}%</strong>
          </div>
          {milestones.items.map(item => (
            <div key={item.id} className="milestone-row">
              <div className="milestone-icon">{item.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div className="milestone-title">{item.title}</div>
                <div className="milestone-sub">{item.sub}</div>
              </div>
              <span className={`badge milestone-badge ${item.statusClass}`}>{item.statusLabel}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="log-panel">
        <div className="section-title">Worker Logs</div>
        <div className="section-body">
          {logs.map((log, index) => (
            <div key={index} className="log-row">
              <div className="log-time">{log.time}</div>
              <div className="log-message">{log.message}</div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function App() {
  const [theme, setTheme] = useLocalStorage('tf-theme', 'light');
  const [status, setStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [filter, setFilter] = useLocalStorage('tf-filter', 'all');

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  useEffect(() => {
    loadStatus();
    loadTasks();
    const interval = setInterval(() => {
      loadStatus();
      loadTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const milestones = useMemo(() => {
    const items = [
      { id: 1, title: 'Dockerization', sub: 'Milestone 1', statusLabel: 'Complete', statusClass: 'completed', icon: '✅' },
      { id: 2, title: 'Terraform Infrastructure', sub: 'Milestone 2', statusLabel: 'Complete', statusClass: 'completed', icon: '✅' },
      { id: 3, title: 'GitHub Actions CI', sub: 'Milestone 3', statusLabel: 'In Progress', statusClass: 'current', icon: '🔄' },
      { id: 4, title: 'Jenkins CD', sub: 'Milestone 4', statusLabel: 'Pending', statusClass: 'pending', icon: '⏳' },
      { id: 5, title: 'Final Demo', sub: 'Milestone 5', statusLabel: 'Pending', statusClass: 'pending', icon: '⏳' },
    ];
    const completed = items.filter(item => item.statusLabel === 'Complete').length;
    return { items, completed, total: items.length, percent: Math.round((completed / items.length) * 100) };
  }, []);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.status === filter);
  }, [filter, tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(task => task.status === 'done').length,
    pending: tasks.filter(task => task.status !== 'done').length,
  }), [tasks]);

  const logs = useMemo(() => {
    if (status && !status.worker) {
      return [{ time: '12:25', message: 'Worker is offline. Waiting for restart.' }];
    }
    return [
      { time: '12:03', message: 'Worker picked up a new task.' },
      { time: '12:15', message: 'Python job completed successfully.' },
      { time: '12:21', message: 'Health check passed for TaskFlow API.' },
    ];
  }, [status]);

  function loadStatus() {
    fetch(`${API}/api/status`)
      .then(response => response.json())
      .then(data => setStatus({ healthy: true, worker: true, message: data.message || 'TaskFlow API is Live!', ...data }))
      .catch(() => setStatus({ healthy: false, worker: false, message: 'API unreachable. Please check the service.' }));
  }

  function loadTasks() {
    setLoading(true);
    fetch(`${API}/api/tasks`)
      .then(response => response.json())
      .then(data => {
        setTasks((data || []).map(item => ({
          id: item.id,
          title: item.title,
          status: item.status || 'pending',
          priority: item.priority || 'low',
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    const payload = { title, priority: newPriority, status: 'pending' };
    fetch(`${API}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setNewTask('');
        setNewPriority('medium');
        loadTasks();
      })
      .catch(() => {
        setTasks(current => [{ id: Date.now(), title, status: 'pending', priority: newPriority }, ...current]);
        setNewTask('');
        setNewPriority('medium');
      });
  }

  function deleteTask(taskId) {
    setTasks(current => current.filter(item => item.id !== taskId));
  }

  function advanceTask(task) {
    const order = ['pending', 'in-progress', 'done'];
    const next = order[(order.indexOf(task.status || 'pending') + 1) % order.length];
    setTasks(current => current.map(item => item.id === task.id ? { ...item, status: next } : item));
  }

  return (
    <div className="tf-app">
      <Header theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      <div className="tf-body">
        <Sidebar apiStatus={status} logs={logs} milestones={milestones} />
        <main className="tf-main">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.done}</div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.pending}</div>
              <div className="stat-label">Pending / In-Progress</div>
            </div>
          </div>

          <section className="card">
            <div className="card-title">Create a Task</div>
            <div className="add-form">
              <input
                className="input"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Task title"
              />
              <div className="form-row">
                <select className="select" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
                <button className="btn-primary" type="button" onClick={addTask}>Add Task</button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">Task Board</div>
            <div className="filter-row">
              {['all', 'pending', 'in-progress', 'done'].map(key => (
                <button
                  key={key}
                  type="button"
                  className={`filter-pill ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {key === 'all' ? 'All' : key === 'pending' ? 'Pending' : key === 'in-progress' ? 'In-Progress' : 'Done'}
                </button>
              ))}
            </div>

            <div className="tasks-list">
              {loading && <div className="empty-state">Loading tasks…</div>}
              {!loading && filteredTasks.length === 0 && (
                <div className="empty-state">No tasks available. Add a new task to get started.</div>
              )}
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-card ${task.priority}`}>
                  <div className="task-main">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span>#{task.id}</span>
                      <PriorityPill priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn-secondary btn-inline" type="button" onClick={() => advanceTask(task)}>
                      {task.status === 'done' ? 'Reset' : task.status === 'pending' ? 'Start' : 'Complete'}
                    </button>
                    <button className="btn-ghost btn-inline" type="button" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="footer">DevOps · University Project · Air University</footer>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
