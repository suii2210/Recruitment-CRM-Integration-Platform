import React, { useEffect, useState } from 'react';
import { Calendar, PlusCircle, Share2 } from 'lucide-react';
import { useApplicationStore } from '../../store/applicationStore';
import { useTaskStore } from '../../store/taskStore';

const TaskManagement: React.FC = () => {
  const hiredApplicants = useApplicationStore((state) => state.hiredApplicants);
  const fetchHiredApplicants = useApplicationStore((state) => state.fetchHiredApplicants);
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const createTask = useTaskStore((state) => state.createTask);
  const shareTask = useTaskStore((state) => state.shareTask);
  const loading = useTaskStore((state) => state.loading);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    fetchHiredApplicants();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAssignee = (id: string) => {
    if (assignees.includes(id)) {
      setAssignees(assignees.filter((item) => item !== id));
    } else {
      setAssignees([...assignees, id]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask({
      title,
      description,
      due_date: dueDate || undefined,
      assignees,
    });
    setTitle('');
    setDescription('');
    setDueDate('');
    setAssignees([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <PlusCircle className="text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Create task</h2>
        </div>
        <form onSubmit={handleCreateTask} className="grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-white"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task..."
            className="bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-white"
            rows={3}
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-[#0d0e0a] border border-gray-800 rounded-xl px-4 py-3 text-white"
          />
          <div>
            <p className="text-sm text-slate-400 mb-2">Assign to</p>
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {hiredApplicants.map((hire) => (
                <label
                  key={hire.id}
                  className={`border rounded-xl px-3 py-2 text-sm flex items-center gap-2 ${
                    assignees.includes(hire.id)
                      ? 'border-cyan-400 text-white'
                      : 'border-gray-800 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-cyan-400"
                    checked={assignees.includes(hire.id)}
                    onChange={() => toggleAssignee(hire.id)}
                  />
                  <span>{hire.applicant_name}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-500 text-black font-semibold rounded-xl py-2 hover:bg-cyan-400 transition-colors"
          >
            Create task
          </button>
        </form>
      </div>

      <div className="bg-[#15170f] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-cyan-400" />
          <h2 className="text-xl font-semibold text-white">Tasks</h2>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="border border-gray-800 rounded-2xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => shareTask(task._id)}
                  className="text-xs flex items-center gap-1 px-3 py-1 rounded-full border border-gray-700 text-white hover:border-cyan-400"
                >
                  <Share2 size={14} /> Share
                </button>
              </div>
              <p className="text-sm text-slate-300">{task.description}</p>
              <p className="text-xs text-slate-500">
                Assigned to {task.assigned_candidates?.length || 0} hires
              </p>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No tasks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
