function dateLabel(date) {
  if (!date) return 'No due date';
  const value = new Date(date);
  return `Due ${value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete, showActions = true, emptyMessage = 'No tasks here yet.' }) {
  if (!tasks.length) return <div className="empty-state"><div>✓</div><h3>All clear</h3><p>{emptyMessage}</p></div>;

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className={`task-item ${task.completed ? 'completed' : ''}`} key={task._id}>
          <button className="check-button" onClick={() => onToggle(task)} aria-label={task.completed ? `Mark ${task.title} as pending` : `Mark ${task.title} as complete`}>{task.completed ? '✓' : ''}</button>
          <div className="task-copy"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`priority ${task.priority}`}>{task.priority}</span><span>{dateLabel(task.dueDate)}</span></div></div>
          {showActions && <div className="task-actions"><button onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>Edit</button><button className="danger-link" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>Delete</button></div>}
        </article>
      ))}
    </div>
  );
}
