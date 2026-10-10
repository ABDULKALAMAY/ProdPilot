import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ProjectForm from '../components/ProjectForm';
import CPMNetwork from '../components/CPMNetwork';
import { parseMembers } from '../utils/memberImport';

export default function ProjectsPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]), [data, setData] = useState(null);
  const [tab, setTab] = useState('Overview'), [editor, setEditor] = useState(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null), [imported, setImported] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setEditor(null); setSuggestions(null); setImported(null); setError(''); setTab('Overview');
    api(id ? `/api/projects/${id}` : '/api/projects', { token }).then((result) => { if (active) id ? setData(result) : setProjects(result.projects); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token]);
  const project = data?.project;
  async function change(path, method, body) {
    const result = await api(`/api/projects/${id}${path}`, { token, method, body });
    if (result.project) setData(result);
    setSuggestions(null);
    return result;
  }
  async function action(callback) {
    setBusy(true); setError('');
    try { await callback(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function save(payload) {
    setBusy(true);
    try {
      if (editor.kind === 'project' && !project) {
        const result = await api('/api/projects', { token, method: 'POST', body: payload });
        navigate(`/projects/${result.project._id}`);
      } else {
        const suffix = editor.kind === 'project' ? '' : editor.kind === 'activity' ? `/activities${editor.value ? `/${editor.value.id}` : ''}` : `/members${editor.value ? `/${editor.value._id}` : ''}`;
        await change(suffix, editor.value ? 'PUT' : 'POST', payload);
      }
      setEditor(null);
    } finally { setBusy(false); }
  }
  function remove(kind, value) {
    if (window.confirm(`Delete ${value.name}?${kind === 'member' ? ' Their activities will become unassigned.' : ''}`)) action(() => change(`/${kind === 'activity' ? 'activities' : 'members'}/${kind === 'activity' ? value.id : value._id}`, 'DELETE'));
  }
  async function readImport(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    await action(async () => {
      if (file.size > 100000) throw new Error('Choose a CSV/JSON file smaller than 100 KB.');
      setImported(parseMembers(await file.text(), file.name));
    });
  }
  return <div className="page projects-page">
    <header className="page-header"><div><p className="eyebrow">PROJECT PLANNING</p><h1>{project?.name || 'Projects'}</h1><p className="muted">{project ? project.description : 'Plan activities, assign your team, and find the critical paths.'}</p>{id && <Link className="back-link" to="/projects">← All projects</Link>}</div>{!id && <button className="button primary" onClick={() => setEditor({ kind: 'project' })}>+ New project</button>}</header>
    {error && <div className="form-error" role="alert">{error}</div>}
    {editor && <ProjectForm key={`${editor.kind}-${editor.value?.id || editor.value?._id || 'new'}`} {...editor} project={project} onSave={save} onCancel={() => setEditor(null)} saving={busy} />}
    {loading && <p className="loading">Loading projects…</p>}
    {!loading && !id && <div className="project-grid">{projects.map((item) => <Link className="content-card project-card" to={`/projects/${item._id}`} key={item._id}><h2>{item.name}</h2><p className="muted">{item.description || 'No description yet.'}</p><p>Starts {item.startDate.slice(0, 10)}</p><span className="back-link">Open project →</span></Link>)}{!projects.length && <div className="content-card empty-state">No projects yet. Create your first project to start planning.</div>}</div>}
    {project && <>
      <div className="filter-bar project-tabs" role="tablist" aria-label="Project sections">{['Overview', 'Activities', 'Network / CPM', 'Team'].map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? 'selected' : ''} onClick={() => setTab(name)}>{name}</button>)}</div>
      {!data.canManage && <p className="muted project-note">You have read access. Ask the owner or a Project Manager to update this project.</p>}
      {tab === 'Overview' && <section className="content-card"><h2>Project overview</h2><p>Start date: {project.startDate.slice(0, 10)}</p><p>{project.activities.length} activities · {project.members.length} members · {data.cpm.duration} days</p><p className="muted">Build one connected activity network. Durations can be decimal days. Multiple roots and final activities are supported when connected through branches. All roots connect to START and all final activities connect to FINISH.</p><div className="project-toolbar"><button className="button primary" onClick={() => setTab('Network / CPM')}>View Network / CPM</button>{data.canManage && <button className="button secondary" disabled={busy} onClick={() => setEditor({ kind: 'project', value: project })}>Edit project</button>}{data.isOwner && <button className="button secondary" disabled={busy} onClick={() => { if (window.confirm('Delete this project and all its activities and members?')) action(async () => { await change('', 'DELETE'); navigate('/projects'); }); }}>Delete project</button>}</div></section>}
      {tab === 'Activities' && <section className="content-card"><div className="section-heading"><div><h2>Activities</h2><p>Connect activities using their immediate predecessors.</p></div>{data.canManage && <div className="project-toolbar"><button className="button secondary" disabled={busy || !project.members.length || !project.activities.length} onClick={() => action(async () => { const result = await api(`/api/projects/${id}/auto-assign`, { token, method: 'POST' }); setSuggestions(result.suggestions); })}>Auto Assign</button><button className="button primary" disabled={busy} onClick={() => setEditor({ kind: 'activity' })}>+ Activity</button></div>}</div>
        {suggestions && <div className="assignment-preview"><h3>Review suggested assignments</h3><p className="muted">Only unassigned activities are suggested. Change any selection before applying.</p>{!suggestions.length && <p>All activities are already assigned.</p>}{suggestions.map((item, index) => <label className="suggestion-row" key={item.activityId}><span><strong>{item.activityId}</strong> · {project.activities.find((a) => a.id === item.activityId)?.name}<small>{item.reasons.join(' · ')}</small></span><select aria-label={`Assignment for ${item.activityId}`} value={item.memberId || ''} onChange={(event) => setSuggestions(suggestions.map((suggestion, i) => i === index ? { ...suggestion, memberId: event.target.value || null } : suggestion))}><option value="">Unassigned</option>{project.members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label>)}<div className="project-toolbar"><button className="button primary" disabled={busy || !suggestions.length} onClick={() => action(() => change('/assignments', 'PUT', { assignments: suggestions.map(({ activityId, memberId }) => ({ activityId, memberId })) }))}>Apply assignments</button><button className="button secondary" disabled={busy} onClick={() => setSuggestions(null)}>Cancel</button></div></div>}
        <div className="table-scroll"><table className="project-table"><thead><tr><th>Activity</th><th>Days</th><th>Predecessors</th><th>Assigned to</th><th>Status</th>{data.canManage && <th>Actions</th>}</tr></thead><tbody>{project.activities.map((activity) => <tr key={activity.id}><th>{activity.id} · {activity.name}<small>{activity.description}</small><small>{[activity.requiredRole, ...activity.requiredSkills].filter(Boolean).join(' · ')}</small>{(activity.startDate || activity.endDate) && <small>{activity.startDate?.slice(0, 10) || '—'} → {activity.endDate?.slice(0, 10) || '—'}</small>}</th><td>{activity.duration}</td><td>{activity.predecessors.join(', ') || 'START'}</td><td>{project.members.find((member) => member._id === activity.assignedMember)?.name || 'Unassigned'}</td><td>{activity.status}</td>{data.canManage && <td><div className="task-actions"><button disabled={busy} onClick={() => setEditor({ kind: 'activity', value: activity })}>Edit</button><button className="danger-link" disabled={busy} onClick={() => remove('activity', activity)}>Delete</button></div></td>}</tr>)}</tbody></table></div>{!project.activities.length && <p className="empty-state">No activities yet. Add your first activity with no predecessors.</p>}
      </section>}
      {tab === 'Network / CPM' && <CPMNetwork cpm={data.cpm} />}
      {tab === 'Team' && <section className="content-card"><div className="section-heading"><div><h2>Project team</h2><p>Manage member roles and skills for manual and automatic assignment.</p></div>{data.canManage && <button className="button primary" disabled={busy} onClick={() => setEditor({ kind: 'member' })}>+ Member</button>}</div>
        {data.canManage && <div className="team-import"><label>Import CSV / JSON <input type="file" accept=".csv,.json" disabled={busy} onChange={readImport} /></label><p className="muted">CSV headers: name,email,role,skills. Quote comma-separated skills, or separate skills with semicolons. JSON: an array of objects with the same fields; skills may be an array.</p><code>Arun,arun@example.com,Developer,"React,Node.js,MongoDB"</code></div>}
        {imported && <div className="assignment-preview"><h3>Review {imported.length} imported members</h3>{imported.map((member, index) => <p key={index}>{member.name} · {member.email} · {member.role} · {member.skills.join(', ')}</p>)}<div className="project-toolbar"><button className="button primary" disabled={busy} onClick={() => action(async () => { await change('/members', 'POST', { members: imported }); setImported(null); })}>Import members</button><button className="button secondary" disabled={busy} onClick={() => setImported(null)}>Cancel</button></div></div>}
        <div className="task-list">{project.members.map((member) => <article className="task-item" key={member._id}><div className="task-copy"><h3>{member.name} · {member.role}</h3><p>{member.email}</p><p>{member.skills.join(', ') || 'No skills specified'}</p></div>{data.canManage && <div className="task-actions"><button disabled={busy} onClick={() => setEditor({ kind: 'member', value: member })}>Edit</button><button className="danger-link" disabled={busy} onClick={() => remove('member', member)}>Delete</button></div>}</article>)}</div>{!project.members.length && <p className="empty-state">Add team members to assign activities.</p>}
      </section>}
    </>}
  </div>;
}
