const { useState, useEffect } = React;

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const handleSubmit = async e => {
    e.preventDefault();
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    if (res.ok) {
      const data = await res.json();
      onLogin(data.token);
    } else {
      alert('Login failed');
    }
  };
  return (
    <form className="login" onSubmit={handleSubmit}>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
      <button type="submit">Login</button>
    </form>
  );
}

function TaskBoard({ token }) {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await fetch('/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateTask = async (id, updates) => {
    await fetch(`/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates)
    });
    fetchTasks();
  };

  const columns = ['pendiente', 'edicion', 'terminado', 'publicado'];

  const onDrop = (e, status) => {
    const id = e.dataTransfer.getData('text');
    updateTask(parseInt(id), { status });
  };

  const onDragStart = (e, id) => {
    e.dataTransfer.setData('text', id);
  };

  return (
    <div className="board">
      {columns.map(col => (
        <div
          key={col}
          className="column"
          onDragOver={e => e.preventDefault()}
          onDrop={e => onDrop(e, col)}
        >
          <h3>{col}</h3>
          {tasks.filter(t => t.status === col).map(t => (
            <div key={t.id} className="card" draggable onDragStart={e => onDragStart(e, t.id)}>
              <div><strong>{t.title}</strong></div>
              <div>Editor: {t.editor}</div>
              <div>Link: <a href={t.link} target="_blank">{t.link}</a></div>
              <div>Estado: {t.status}</div>
              <button onClick={() => updateTask(t.id, { status: col === 'publicado' ? 'pendiente' : columns[columns.indexOf(col)+1] || col })}>Mover</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  if (!token) {
    return <Login onLogin={setToken} />;
  }
  return <TaskBoard token={token} />;
}

ReactDOM.render(<App />, document.getElementById('app'));
