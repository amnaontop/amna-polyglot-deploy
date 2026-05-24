/**
 * App.jsx
 * React single-file app component for TaskFlow
 * Designed to be used with in-browser Babel or a normal bundler.
 */

const { useState, useEffect, useMemo } = React;

const API = `http://${window.location.hostname}:5000`;

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

function Header({ theme, toggleTheme, version='v1.0.0' }){
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
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

function Sidebar({ apiStatus }){
  const now = apiStatus || { message: 'Loading…', healthy:true, worker:true };
  return (
    <aside className="tf-sidebar">
      <div className="card small">
        <div className="card-title">API Status</div>
        <div className="card-body">
          <div className="api-line"><span className="api-name">TaskFlow API</span><span className={`badge ${now.healthy? 'done':'failed'}`}>{now.healthy? 'Live' : 'Offline'}</span></div>
          <div className="muted">{now.message || 'TaskFlow API is Live!'}</div>
        </div>
      </div>

      <div className="card small">
        <div className="card-title">Services</div>
        <div className="card-body">
          <div className="svc"><span>.NET API</span><span className={`status-pill ${now.healthy? 'ok':'down'}`}>{now.healthy? 'Healthy' : 'Down'}</span></div>
          <div className="svc"><span>Python Worker</span><span className={`status-pill ${now.worker? 'ok':'down'}`}>{now.worker? 'Running' : 'Stopped'}</span></div>
        </div>
      </div>
    </aside>
  );
}

function PriorityPill({p}){
  const map = { low:['Low','low'], medium:['Medium','mid'], high:['High','high'] };
  const [label, cls] = map[p] || ['Low','low'];
  return <span className={`priority ${cls}`}>{label}</span>;
}

function StatusBadge({status}){
  const s = (status||'pending').toLowerCase();
  return <span className={`status-badge ${s}`}>{s.replace(/-/g,' ')}</span>;
}

function TaskCard({t, onToggle}){
  return (
    <div className="task-card">
      <div className="task-main">
        <div className="task-title">{t.title}</div>
        <div className="task-meta">#{t.id} &middot; <PriorityPill p={t.priority} /></div>
      </div>
      <div className="task-actions">
        <StatusBadge status={t.status} />
        <button className="btn-ghost" onClick={()=>onToggle(t)}>{t.status==='done' ? 'Undo' : 'Complete'}</button>
      </div>
    </div>
  );
}

function App(){
  const [theme, setTheme] = useLocalStorage('tf:theme','light');
  const [status, setStatus] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(()=>{ document.documentElement.setAttribute('data-theme', theme); },[theme]);

  useEffect(()=>{ loadStatus(); loadTasks(); const id = setInterval(()=>{ loadStatus(); loadTasks(); },30000); return ()=>clearInterval(id); },[]);

  function toggleTheme(){ setTheme(theme==='dark' ? 'light' : 'dark'); }

  function loadStatus(){
    fetch(`${API}/api/status`).then(r=>r.json()).then(d=> setStatus({ message:d.message || 'TaskFlow API is Live!', healthy:true, worker:true, ...d })).catch(()=> setStatus({ message:'API unreachable', healthy:false, worker:false }));
  }

  function loadTasks(){
    setLoading(true);
    fetch(`${API}/api/tasks`).then(r=>r.json()).then(d=>{ setTasks((d||[]).map(it=> ({ id: it.id, title: it.title, status: it.status||'pending', priority: it.priority||'low' }))); setLoading(false); }).catch(()=>{ setLoading(false); });
  }

  function addTask(){
    if (!newTask.trim()) return;
    const payload = { title:newTask.trim(), status:'pending', priority };
    fetch(`${API}/api/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      .then(r=>r.json()).then(()=>{ setNewTask(''); loadTasks(); })
      .catch(()=>{ // optimistic locally
        setTasks(ts=>[...ts, { id: ts.length+1, title: payload.title, status:payload.status, priority:payload.priority }]); setNewTask('');
      });
  }

  function toggleComplete(task){
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    // optimistic UI
    setTasks(ts => ts.map(x => x.id===task.id ? {...x, status:newStatus} : x));
    fetch(`${API}/api/tasks/${task.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...task, status:newStatus}) }).catch(()=> loadTasks());
  }

  const counts = useMemo(()=>({ total: tasks.length, done: tasks.filter(t=>t.status==='done').length, pending: tasks.filter(t=>t.status!=='done').length }),[tasks]);

  return (
    <div className="tf-app">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <div className="tf-body">
        <Sidebar apiStatus={status} />
        <main className="tf-main">
          <div className="stats">
            <div className="stat">
              <div className="stat-num">{counts.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat">
              <div className="stat-num">{counts.done}</div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat">
              <div className="stat-num">{counts.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Add Task</div>
            <div className="add-form">
              <input className="input" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Task title" />
              <select className="select" value={priority} onChange={e=>setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button className="btn-primary" onClick={addTask}>Add Task</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Tasks</div>
            <div className="tasks-list">
              {loading && <div className="muted">Loading tasks…</div>}
              {!loading && tasks.length===0 && <div className="muted">No tasks yet — add one above</div>}
              {tasks.map(t => <TaskCard key={t.id} t={t} onToggle={toggleComplete} />)}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
