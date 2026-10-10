import { useState } from 'react';

const dateValue = (value) => value ? value.slice(0, 10) : '';
const skills = (text) => text.split(/[,;]/).map((skill) => skill.trim()).filter(Boolean);

export default function ProjectForm({ kind, value, project, onSave, onCancel, saving }) {
  const [error, setError] = useState('');
  const activity = kind === 'activity', member = kind === 'member';
  async function submit(event) {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    let payload = Object.fromEntries(form);
    if (activity) payload = { ...payload, duration: Number(payload.duration), predecessors: form.getAll('predecessors'), assignedMember: payload.assignedMember || null, requiredSkills: skills(payload.requiredSkills), startDate: payload.startDate || null, endDate: payload.endDate || null };
    if (member) payload.skills = skills(payload.skills);
    try { await onSave(payload); } catch (err) { setError(err.message); }
  }
  return <div className="modal-backdrop"><form className="task-form" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="editor-title">
    <div className="form-heading"><h2 id="editor-title">{value ? 'Edit' : 'New'} {kind}</h2><button type="button" className="icon-button" aria-label="Close editor" onClick={onCancel} disabled={saving}>×</button></div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {activity && <label>Activity ID<input name="id" required pattern="[A-Za-z0-9_-]{1,40}" maxLength={40} defaultValue={value?.id || ''} readOnly={Boolean(value)} placeholder="A" /></label>}
    <label>Name<input name="name" required maxLength={member ? 100 : 120} defaultValue={value?.name || ''} autoFocus /></label>
    {!member && <label>Description<textarea name="description" maxLength={2000} rows={3} defaultValue={value?.description || ''} /></label>}
    {kind === 'project' && <label>Project start date<input type="date" name="startDate" required defaultValue={dateValue(value?.startDate) || new Date().toLocaleDateString('en-CA')} /></label>}
    {activity && <>
      <div className="field-row"><label>Duration (days)<input name="duration" type="number" min="0" max="1000000000" step="any" required defaultValue={value?.duration ?? ''} placeholder="2.5" /></label><label>Status<select name="status" defaultValue={value?.status || 'pending'}><option value="pending">Pending</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label></div>
      <label>Predecessors (Ctrl/Cmd + click for multiple)<select name="predecessors" multiple size={Math.min(5, Math.max(2, project.activities.length))} defaultValue={value?.predecessors || []}>{project.activities.filter((item) => item.id !== value?.id).map((item) => <option value={item.id} key={item.id}>{item.id} — {item.name}</option>)}</select></label>
      <label>Assigned member<select name="assignedMember" defaultValue={value?.assignedMember || ''}><option value="">Unassigned</option>{project.members.map((item) => <option key={item._id} value={item._id}>{item.name} — {item.role}</option>)}</select></label>
      <label>Required role<input name="requiredRole" maxLength={100} defaultValue={value?.requiredRole || ''} placeholder="Developer" /></label>
      <label>Required skills (comma separated)<input name="requiredSkills" defaultValue={value?.requiredSkills?.join(', ') || ''} placeholder="Node.js, MongoDB" /></label>
      <div className="field-row"><label>Optional start date<input type="date" name="startDate" defaultValue={dateValue(value?.startDate)} /></label><label>Optional end date<input type="date" name="endDate" defaultValue={dateValue(value?.endDate)} /></label></div>
      <p className="muted">CPM uses duration and predecessors. Optional dates and status do not constrain the calculation.</p>
    </>}
    {member && <><label>Email<input name="email" type="email" required defaultValue={value?.email || ''} /></label><label>Role<input name="role" required maxLength={100} list="member-roles" defaultValue={value?.role || ''} placeholder="Developer" /><datalist id="member-roles">{['Developer', 'Designer', 'Tester', 'Data Scientist', 'Project Manager'].map((role) => <option key={role} value={role} />)}</datalist></label><label>Skills (comma separated)<input name="skills" defaultValue={value?.skills?.join(', ') || ''} placeholder="React, Node.js, MongoDB" /></label><p className="muted">Members can sign in using this email to view the project. The Project Manager role grants editing and team-management access.</p></>}
    <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel} disabled={saving}>Cancel</button><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
  </form></div>;
}
