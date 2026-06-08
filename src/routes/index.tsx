import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Plus, Check, Calendar, ListTodo, Trash2, Edit2, X, Save } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const form = new FormData();
      form.append('title', newTask.title);
      form.append('description', newTask.description);
      
      const response = await fetch('/api/tasks', { method: 'POST', body: form });
      const result = await response.json();
      
      if (response.ok) {
        setNewTask({ title: '', description: '' });
        await loadTasks();
      } else {
        alert('Error: ' + JSON.stringify(result));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: !completed }),
      });
      if (response.ok) {
        await loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      if (response.ok) {
        await loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (task: any) => {
    setEditingTask(task);
    setEditForm({ title: task.title, description: task.description || '' });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask.id,
          title: editForm.title,
          description: editForm.description,
        }),
      });
      
      if (response.ok) {
        setEditingTask(null);
        await loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="page-wrap px-4 pb-8 pt-4">
      <section className="island-shell rise-in relative overflow-hidden rounded-[1.5rem] px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[var(--lagoon-deep)] flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">任务管理</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <input
            type="text"
            placeholder="任务标题..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full rounded-lg border border-[rgba(50,143,151,0.3)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)] text-base"
            required
          />
          <textarea
            placeholder="描述（可选）"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full rounded-lg border border-[rgba(50,143,151,0.3)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)] text-base"
            rows={2}
          />
          <button type="submit" disabled={isSubmitting} className="rounded-full bg-[var(--lagoon-deep)] px-5 py-2 text-white font-medium disabled:opacity-50 text-sm">
            <Plus className="inline-block w-4 h-4 mr-1" />添加
          </button>
        </form>
        
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">📝</div>
              <p className="text-[var(--sea-ink-soft)]">暂无任务</p>
              <p className="text-sm text-[var(--sea-ink-soft)] mt-1">添加第一个任务开始吧</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex gap-3 p-3 rounded-lg border border-[rgba(50,143,151,0.2)] items-start">
                <button 
                  onClick={() => handleToggleComplete(task.id, task.completed)}
                  className="mt-0.5 text-[var(--sea-ink-soft)] cursor-pointer"
                >
                  {task.completed ? <Check className="w-5 h-5 text-green-600" /> : <span className="block w-5 h-5 border border-[var(--sea-ink-soft)] rounded-full" />}
                </button>
                <div className="flex-1 min-w-0">
                  {editingTask?.id === task.id ? (
                    <form onSubmit={handleUpdate} className="space-y-2">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full rounded-lg border border-[rgba(50,143,151,0.3)] px-3 py-1.5 text-base"
                        required
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full rounded-lg border border-[rgba(50,143,151,0.3)] px-3 py-1.5 text-base"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="rounded bg-[var(--lagoon-deep)] px-3 py-1 text-white text-xs">
                          <Save className="inline-block w-3 h-3 mr-1" />保存
                        </button>
                        <button type="button" onClick={cancelEdit} className="rounded bg-gray-200 px-3 py-1 text-xs">
                          <X className="inline-block w-3 h-3 mr-1" />取消
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3 className={`font-medium text-base ${task.completed ? 'line-through text-[var(--sea-ink-soft)]' : 'text-[var(--sea-ink)]'}`}>{task.title}</h3>
                      {task.description && <p className="text-sm text-[var(--sea-ink-soft)] mt-1 break-words">{task.description}</p>}
                      {task.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-[var(--sea-ink-soft)]">
                          <Calendar className="w-3 h-3" />{task.due_date}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {editingTask?.id !== task.id && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(task)} className="p-1 text-[var(--sea-ink-soft)] hover:text-[var(--lagoon-deep)]">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="p-1 text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}