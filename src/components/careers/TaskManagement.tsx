import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  Paperclip,
  Plus,
  Share2,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApplicationStore } from '../../store/applicationStore';
import { useTaskStore, Task } from '../../store/taskStore';

type DrawerTab = 'edit' | 'activity';

const BOARD_COLUMNS = [
  { id: 'draft', title: 'Backlog', badge: 'bg-emerald-500/10 text-white' },
  { id: 'assigned', title: 'Assigned', badge: 'bg-emerald-500/15 text-white' },
  { id: 'in_progress', title: 'In Progress', badge: 'bg-emerald-500/20 text-white' },
  { id: 'in_review', title: 'In Review', badge: 'bg-emerald-500/20 text-white' },
  { id: 'completed', title: 'Done', badge: 'bg-emerald-500/25 text-white' },
];

const STATUS_OPTIONS = BOARD_COLUMNS.map((column) => ({
  value: column.id,
  label: column.title,
}));

const labelClassFor = () =>
  'bg-emerald-500/20 text-white border border-emerald-500/40';

const formatDate = (value?: string) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString();
};

const initialsFor = (name?: string) => {
  if (!name) return 'C';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const TaskManagement: React.FC = () => {
  const hiredApplicants = useApplicationStore((state) => state.hiredApplicants);
  const fetchHiredApplicants = useApplicationStore((state) => state.fetchHiredApplicants);

  const {
    tasks,
    fetchTasks,
    createTask,
    shareTask,
    moveTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    currentTask,
    loading,
  } = useTaskStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('edit');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    label: '',
    due_date: '',
    status: 'draft',
    assignees: [] as string[],
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    label: '',
    due_date: '',
    status: 'draft',
    assignees: [] as string[],
  });

  useEffect(() => {
    fetchTasks();
    fetchHiredApplicants();
  }, [fetchTasks, fetchHiredApplicants]);

  useEffect(() => {
    if (currentTask) {
      setEditForm({
        title: currentTask.title,
        description: currentTask.description || '',
        label: currentTask.label || '',
        due_date: currentTask.due_date ? currentTask.due_date.slice(0, 10) : '',
        status: currentTask.status,
        assignees:
          currentTask.assigned_candidates
            ?.map((assignment) => assignment.application?._id)
            .filter(Boolean) || [],
      });
    }
  }, [currentTask]);

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const tasksByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce<Record<string, Task[]>>((acc, column) => {
      acc[column.id] = filteredTasks.filter((task) => task.status === column.id);
      return acc;
    }, {});
  }, [filteredTasks]);

  const handleDragStart = (taskId: string) => setDraggingTaskId(taskId);
  const handleDragEnd = () => setDraggingTaskId(null);

  const handleDrop = (status: string) => {
    if (draggingTaskId) {
      moveTask(draggingTaskId, status);
      setDraggingTaskId(null);
    }
  };

  const handleNewTaskChange = (field: string, value: string | string[]) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditChange = (field: string, value: string | string[]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.title.trim()) return;
    await createTask({
      ...newTask,
      due_date: newTask.due_date || undefined,
    });
    setNewTask({
      title: '',
      description: '',
      label: '',
      due_date: '',
      status: 'draft',
      assignees: [],
    });
  };

  const handleAddFromColumn = (status: string) => {
    setNewTask((prev) => ({ ...prev, status }));
    document.getElementById('new-task-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openDrawer = (task: Task) => {
    setCurrentTask(task);
    setDrawerTab('edit');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setCurrentTask(null);
  };

  const handleUpdateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentTask) return;
    await updateTask(currentTask._id, {
      ...editForm,
      due_date: editForm.due_date || undefined,
    });
    closeDrawer();
  };

  const handleDeleteTask = async () => {
    if (!currentTask) return;
    if (confirm('Delete this task?')) {
      await deleteTask(currentTask._id);
      closeDrawer();
    }
  };

  const toggleAssignee = (
    target: 'new' | 'edit',
    id: string
  ) => {
    const setter = target === 'new' ? setNewTask : setEditForm;
    setter((prev) => {
      const currentList = prev.assignees as string[];
      const exists = currentList.includes(id);
      return {
        ...prev,
        assignees: exists
          ? currentList.filter((assignee) => assignee !== id)
          : [...currentList, id],
      };
    });
  };

  const activityLog = useMemo(() => {
    if (!currentTask) return [];
    const events: Array<{ label: string; timestamp: string }> = [];
    if (currentTask.created_at) {
      events.push({ label: 'Task created', timestamp: currentTask.created_at });
    }
    currentTask.assigned_candidates?.forEach((assignment) => {
      if (assignment.shared_at) {
        events.push({
          label: `${assignment.user?.name || 'Candidate'} was assigned`,
          timestamp: assignment.shared_at,
        });
      }
      if (assignment.submission?.submitted_at) {
        events.push({
          label: `${assignment.user?.name || 'Candidate'} submitted their work`,
          timestamp: assignment.submission.submitted_at,
        });
      }
      if (assignment.status === 'completed') {
        events.push({
          label: `${assignment.user?.name || 'Candidate'} marked task completed`,
          timestamp:
            assignment.submission?.submitted_at ||
            assignment.shared_at ||
            currentTask.updated_at ||
            new Date().toISOString(),
        });
      }
    });
    if (currentTask.updated_at) {
      events.push({
        label: `Status updated to ${currentTask.status.replace('_', ' ')}`,
        timestamp: currentTask.updated_at,
      });
    }
    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [currentTask]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-white uppercase tracking-wide">Tasks</p>
          <h1 className="text-2xl font-semibold text-white">Kanban workspace</h1>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-black border border-emerald-900/30 rounded-xl px-3 py-2">
            <FolderKanban size={16} className="text-white" />
            <span className="text-xs text-white">Total boards</span>
            <span className="text-white font-semibold">{tasks.length}</span>
          </div>
          <div className="relative">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search task..."
              className="bg-[#050806] border border-emerald-900/30 rounded-xl px-4 py-2 text-sm text-white w-64"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white border border-emerald-900/40 rounded px-1">
              CTRL + K
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="w-full overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-[960px]">
            {BOARD_COLUMNS.map((column) => (
              <section
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.id)}
                className="w-64 flex-shrink-0"
              >
                <div className="bg-[#030705] border border-emerald-900/40 rounded-2xl p-4 space-y-4 min-h-[380px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{column.title}</p>
                      <div
                        className={`text-[11px] px-2 py-1 rounded-full mt-1 ${column.badge}`}
                      >
                        {tasksByColumn[column.id]?.length || 0} items
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddFromColumn(column.id)}
                      className="text-white hover:text-white"
                      title="Add new card"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasksByColumn[column.id]?.map((task) => {
                      const attachmentCount = task.attachments?.length || 0;
                      const submissionCount =
                        task.assigned_candidates?.filter((assignment) => assignment.submission)
                          .length || 0;
                      const assignees = task.assigned_candidates || [];
                      const overflow = Math.max(assignees.length - 3, 0);

                      return (
                        <button
                          key={task._id}
                          draggable
                          onDragStart={() => handleDragStart(task._id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openDrawer(task)}
                          className={`w-full text-left bg-[#050805] border border-emerald-900/30 rounded-2xl p-4 transition-colors ${
                            draggingTaskId === task._id ? 'border-emerald-500/70' : 'hover:border-emerald-600/40'
                          }`}
                        >
                          {task.label && (
                            <span
                              className={`text-[11px] px-2 py-1 rounded-full ${labelClassFor(
                                task.label
                              )}`}
                            >
                              {task.label}
                            </span>
                          )}
                          <p className="text-white font-semibold text-sm mt-3">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-white mt-1 max-h-10 overflow-hidden">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-white mt-4">
                            <span className="flex items-center gap-1">
                              <Paperclip size={14} />
                              {attachmentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={14} />
                              {submissionCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex -space-x-2">
                              {assignees.slice(0, 3).map((assignment) => (
                                <div
                                  key={`${task._id}-${assignment.user?._id || assignment.application?._id}`}
                                  className="w-8 h-8 rounded-full bg-emerald-900/40 text-xs text-white flex items-center justify-center border border-emerald-900/50"
                                >
                                  {initialsFor(assignment.user?.name || assignment.application?.applicant_name)}
                                </div>
                              ))}
                              {overflow > 0 && (
                                <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-[11px] text-white flex items-center justify-center border border-emerald-900/50">
                                  +{overflow}
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-white flex items-center gap-1">
                              <Calendar size={13} />
                              {formatDate(task.due_date)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleAddFromColumn(column.id)}
                      className="w-full text-sm text-white hover:text-white text-left"
                    >
                      + Add New Item
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside
          id="new-task-form"
          className="w-full xl:w-80 bg-[#030705] border border-emerald-900/40 rounded-2xl p-6 space-y-4 flex-shrink-0"
        >
          <div>
            <p className="text-sm text-white">+ Add new</p>
            <h3 className="text-white font-semibold">Create board item</h3>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <input
              value={newTask.title}
              onChange={(event) => handleNewTaskChange('title', event.target.value)}
              placeholder="Task title"
              className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
              required
            />
            <textarea
              value={newTask.description}
              onChange={(event) => handleNewTaskChange('description', event.target.value)}
              placeholder="Short description"
              className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-white mb-1">Due date</p>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(event) => handleNewTaskChange('due_date', event.target.value)}
                  className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[11px] text-white mb-1">Column</p>
                <select
                  value={newTask.status}
                  onChange={(event) => handleNewTaskChange('status', event.target.value)}
                  className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-white mb-1">Label</p>
              <div className="flex items-center gap-2 bg-[#050805] border border-emerald-900/30 rounded-xl px-3 py-2">
                <Tag size={14} className="text-white" />
                <input
                  value={newTask.label}
                  onChange={(event) => handleNewTaskChange('label', event.target.value)}
                  placeholder="e.g. UX, Code Review"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] text-white mb-1">Assign to</p>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {hiredApplicants.map((hire) => (
                  <label
                    key={hire.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                      newTask.assignees.includes(hire.id)
                        ? 'border-emerald-500 text-white'
                        : 'border-emerald-900/30 text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={newTask.assignees.includes(hire.id)}
                      onChange={() => toggleAssignee('new', hire.id)}
                    />
                    <span>{hire.applicant_name}</span>
                  </label>
                ))}
                {hiredApplicants.length === 0 && (
                  <p className="text-xs text-white">No hired candidates yet.</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              Add
            </button>
          </form>
        </aside>
      </div>

      {drawerOpen && currentTask && (
        <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
          <div className="w-full max-w-md bg-black h-full border-l border-emerald-900/40 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => setDrawerTab('edit')}
                  className={`px-3 py-1 rounded-lg ${
                    drawerTab === 'edit'
                      ? 'bg-emerald-500/20 text-white'
                      : 'text-white'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDrawerTab('activity')}
                  className={`px-3 py-1 rounded-lg ${
                    drawerTab === 'activity'
                      ? 'bg-emerald-500/20 text-white'
                      : 'text-white'
                  }`}
                >
                  Activity
                </button>
              </div>
              <button onClick={closeDrawer} className="text-white hover:text-white">
                <X size={18} />
              </button>
            </div>

            {drawerTab === 'edit' ? (
              <form onSubmit={handleUpdateTask} className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="space-y-1">
                  <p className="text-xs text-white">Title</p>
                  <input
                    value={editForm.title}
                    onChange={(event) => handleEditChange('title', event.target.value)}
                    className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white">Due date</p>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(event) => handleEditChange('due_date', event.target.value)}
                    className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white">Label</p>
                  <input
                    value={editForm.label}
                    onChange={(event) => handleEditChange('label', event.target.value)}
                    className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
                    placeholder="Label"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white">Status</p>
                  <select
                    value={editForm.status}
                    onChange={(event) => handleEditChange('status', event.target.value)}
                    className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white">Assigned</p>
                  <div className="flex flex-wrap gap-2">
                    {editForm.assignees.map((assigneeId) => {
                      const hire = hiredApplicants.find((candidate) => candidate.id === assigneeId);
                      if (!hire) return null;
                      return (
                        <span
                          key={assigneeId}
                          className="px-3 py-1 rounded-full bg-emerald-900/60 text-xs text-white flex items-center gap-2"
                        >
                          <Users size={12} />
                          {hire.applicant_name}
                        </span>
                      );
                    })}
                    {editForm.assignees.length === 0 && (
                      <p className="text-xs text-white">No assignees selected</p>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto mt-2 space-y-2 pr-1">
                    {hiredApplicants.map((hire) => (
                      <label
                        key={`edit-${hire.id}`}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                          editForm.assignees.includes(hire.id)
                            ? 'border-emerald-500 text-white'
                            : 'border-emerald-900/30 text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-emerald-500"
                          checked={editForm.assignees.includes(hire.id)}
                          onChange={() => toggleAssignee('edit', hire.id)}
                        />
                        <span>{hire.applicant_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white">Description</p>
                  <textarea
                    value={editForm.description}
                    onChange={(event) => handleEditChange('description', event.target.value)}
                    className="w-full bg-[#050805] border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-white min-h-[120px]"
                    placeholder="Write a comment..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="px-4 py-3 rounded-xl border border-emerald-500/40 text-white hover:bg-emerald-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activityLog.length === 0 && (
                  <p className="text-sm text-white">No activity captured yet.</p>
                )}
                {activityLog.map((activity) => (
                  <div
                    key={`${activity.label}-${activity.timestamp}`}
                    className="bg-[#050805] border border-emerald-900/30 rounded-xl p-3"
                  >
                    <p className="text-sm text-white">{activity.label}</p>
                    <p className="text-[11px] text-white">{formatDate(activity.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-white border-t border-emerald-900/50 pt-3">
              <button
                onClick={async () => {
                  if (currentTask) {
                    await shareTask(currentTask._id);
                  }
                }}
                className="flex items-center gap-2 text-white hover:text-white"
              >
                <Share2 size={14} />
                Share with assignees
              </button>
              <span>
                Created {formatDate(currentTask.created_at)} · Updated {formatDate(currentTask.updated_at)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
