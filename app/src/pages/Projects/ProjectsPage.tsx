import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { useBusinessStore } from '../../store';
import { projectService, taskService, businessService } from '../../services/db';
import type { Project, ProjectTask, Employee } from '../../types';
import { Plus, Clock } from 'lucide-react';
import { HubLayout } from '../../components/common/HubLayout';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import './ProjectsPage.css';

const COLUMNS = [
    { id: 'backlog', title: 'Хүлээгдэж буй', colorClass: 'status-todo' },
    { id: 'in_progress', title: 'Хийгдэж байна', colorClass: 'status-in_progress' },
    { id: 'review', title: 'Шалгуулж буй', colorClass: 'status-review' },
    { id: 'done', title: 'Дууссан', colorClass: 'status-done' }
];

export function ProjectsPage() {
    const { business } = useBusinessStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [staff, setStaff] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Load: Projects & Staff
    useEffect(() => {
        if (!business?.id) return;
        setTimeout(() => setLoading(true), 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let unsnapProjects: any;

        const load = async () => {
            const employees = await businessService.getEmployees(business.id);
            setStaff(employees);

            unsnapProjects = projectService.subscribeProjects(business.id, (data) => {
                setProjects(data as Project[]);
                if (data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(data[0].id);
                }
                setLoading(false);
            });
        };

        load();
        return () => { if (unsnapProjects) unsnapProjects(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [business?.id]);

    // Load Tasks when a project is selected
    useEffect(() => {
        if (!business?.id || !selectedProjectId) {
            setTasks([]);
            return;
        }

        const unsnapTasks = taskService.subscribeTasks(business.id, selectedProjectId, (data) => {
            setTasks(data as ProjectTask[]);
        });

        return () => { unsnapTasks(); };
    }, [business?.id, selectedProjectId]);

    // Helper: Drag and Drop (Simple implementation without full dnd-kit for now)
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = async (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId || !business?.id) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === statusId) return; // No change

        // Optimistic UI update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: statusId as any } : t);
        setTasks(updatedTasks);

        try {
            await taskService.updateTask(business.id, taskId, { status: statusId });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
            toast.error('Шилжүүлэх үед алдаа гарлаа');
            // Revert on fail
            setTasks(tasks);
        }
    };

    if (loading) return <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Төслүүд уншиж байна...</div>;

    const currentProject = projects.find(p => p.id === selectedProjectId);

    return (
        <HubLayout hubId="projects-hub">
            <div className="page-container projects-page animate-fade-in">
                <Header
                    title="Төслийн хяналт"
                    subtitle="Ажлын явц, самбар"
                    action={{
                        label: "Шинэ төсөл",
                        onClick: () => toast('Төсөл нэмэх (Удахгүй)')
                    }}
                />

                <div className="project-controls">
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <select
                            className="input"
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                            style={{ minWidth: '250px', fontWeight: 600 }}
                        >
                            {projects.length === 0 && <option value="">Төсөл байхгүй байна</option>}
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.customerName}</option>
                            ))}
                        </select>

                        {currentProject && (
                            <div className="text-secondary text-sm">
                                Менежер: {currentProject.managerName} | Төсөв: ₮{currentProject.budget.toLocaleString()}
                            </div>
                        )}
                    </div>

                    {currentProject && (
                        <button className="btn btn-secondary" onClick={() => toast('Ажил (Task) нэмэх')}>
                            <Plus size={16} className="mr-sm" /> Таск нэмэх
                        </button>
                    )}
                </div>

                {!currentProject ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Шинээр төсөл үүсгэж эхэлнэ үү.
                    </div>
                ) : (
                    <div className="kanban-board">
                        {COLUMNS.map(col => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            return (
                                <div
                                    key={col.id}
                                    className="kanban-column"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div className={`column-header ${col.colorClass}`}>
                                        <span>{col.title}</span>
                                        <span className="task-count">{colTasks.length}</span>
                                    </div>
                                    <div className="column-body">
                                        {colTasks.length === 0 && (
                                            <div style={{ opacity: 0.5, textAlign: 'center', fontSize: '13px', padding: '20px 0' }}>
                                                Хоосон байна
                                            </div>
                                        )}
                                        {colTasks.map(task => {
                                            const assignee = staff.find(s => s.id === task.assignedTo);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="task-card"
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                >
                                                    <div className="task-title">{task.title}</div>
                                                    {task.description && <div className="task-desc">{task.description}</div>}

                                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                                        <span className={`priority-badge priority-${task.priority}`}>
                                                            {task.priority === 'urgent' ? 'Яаралтай' : task.priority}
                                                        </span>
                                                    </div>

                                                    <div className="task-meta">
                                                        <div className="task-assignee">
                                                            <div className="task-avatar">
                                                                {assignee ? (assignee.name || assignee.email || '?').charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                            <span>{assignee ? (assignee.name || assignee.email) : 'Эзэнгүй'}</span>
                                                        </div>

                                                        {task.dueDate && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                                                <Clock size={12} />
                                                                {format(task.dueDate, 'MM.dd')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </HubLayout>
    );
}
