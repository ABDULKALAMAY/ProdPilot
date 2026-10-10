import Project from '../models/Project.js';
import { calculateCPM, invalid } from '../services/cpm.js';
import { suggestAssignments } from '../services/assignment.js';

const accessible = (user) => ({ $or: [{ owner: user.id }, { 'members.email': user.email }] });
const canManage = (project, user) => String(project.owner) === user.id || project.members.some((member) => member.email === user.email && member.role.toLowerCase() === 'project manager');
const pick = (body, fields) => Object.fromEntries(fields.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
const projectFields = ['name', 'description', 'startDate'];
const activityFields = ['id', 'name', 'description', 'duration', 'predecessors', 'assignedMember', 'status', 'requiredRole', 'requiredSkills', 'startDate', 'endDate'];
const memberFields = ['name', 'email', 'role', 'skills'];

function validateActivity(activity) {
  if (!activity || typeof activity !== 'object') invalid('Each activity must be an object.');
  if (typeof activity.name !== 'string' || !activity.name.trim()) invalid('Activity name is required.');
  for (const key of ['startDate', 'endDate']) if (activity[key] && !Number.isFinite(Date.parse(activity[key]))) invalid(`Activity ${activity.id}: invalid ${key}.`);
  if (activity.startDate && activity.endDate && new Date(activity.endDate) < new Date(activity.startDate)) invalid(`Activity ${activity.id}: end date cannot be before start date.`);
}

async function save(project) {
  const emails = project.members.map((member) => member.email);
  if (new Set(emails).size !== emails.length) invalid('A team member with this email already exists.');
  if (project.members.length > 200) invalid('A project supports up to 200 members.');
  for (const activity of project.activities) {
    if (activity.assignedMember && !project.members.id(activity.assignedMember)) invalid(`Activity ${activity.id}: assigned member is not in this project.`);
  }
  calculateCPM(project.activities);
  try { await project.save(); } catch (error) {
    if (error.name === 'VersionError') { error.statusCode = 409; error.message = 'This project changed in another session. Reload and try again.'; }
    throw error;
  }
}

function send(res, project, user, status = 200) {
  return res.status(status).json({ project, canManage: canManage(project, user), isOwner: String(project.owner) === user.id, cpm: calculateCPM(project.activities) });
}

export async function listProjects(req, res, next) {
  try { res.json({ projects: await Project.find(accessible(req.user)).select('name description startDate owner updatedAt').sort({ updatedAt: -1 }) }); } catch (error) { next(error); }
}
export async function createProject(req, res, next) {
  try {
    const project = new Project({ ...pick(req.body, projectFields), owner: req.user.id });
    await save(project);
    send(res, project, req.user, 201);
  } catch (error) { next(error); }
}
export async function loadProject(req, res, next) {
  try {
    const project = await Project.findOne({ _id: req.params.id, ...accessible(req.user) });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    req.project = project;
    next();
  } catch (error) { next(error); }
}
export function requireManager(req, res, next) {
  if (!canManage(req.project, req.user)) return res.status(403).json({ message: 'Only the project owner or a Project Manager can make changes.' });
  next();
}
export function getProject(req, res) { send(res, req.project, req.user); }

export async function changeProject(req, res, next) {
  try {
    const project = req.project;
    const { action, activityId, memberId } = req.params;
    if (!action) Object.assign(project, pick(req.body, projectFields));
    if (action === 'activities') {
      if (req.method === 'DELETE') {
        if (!project.activities.some((a) => a.id === activityId)) return res.status(404).json({ message: 'Activity not found.' });
        if (project.activities.some((a) => a.predecessors.includes(activityId))) invalid('Remove this activity from its successors’ predecessors before deleting it.');
        project.activities = project.activities.filter((a) => a.id !== activityId);
      } else if (req.method === 'PUT' && !activityId) {
        // Atomic network replacement also permits importing a complete multi-root graph.
        calculateCPM(req.body.activities);
        req.body.activities.forEach(validateActivity);
        project.activities = req.body.activities.map((a) => pick(a, activityFields));
      } else {
        const existing = activityId && project.activities.find((a) => a.id === activityId);
        if (activityId && !existing) return res.status(404).json({ message: 'Activity not found.' });
        const input = { predecessors: [], ...(existing?.toObject() || {}), ...pick(req.body, activityFields) };
        if (activityId && input.id !== activityId) invalid('Activity IDs cannot be changed; edit the name instead.');
        validateActivity(input);
        const nextActivities = existing ? project.activities.map((a) => a.id === activityId ? input : a.toObject()) : [...project.activities.map((a) => a.toObject()), input];
        calculateCPM(nextActivities);
        project.activities = nextActivities;
      }
    }
    if (action === 'members') {
      const member = memberId && project.members.id(memberId);
      if (memberId && !member) return res.status(404).json({ message: 'Member not found.' });
      if (req.method === 'DELETE') {
        project.members.pull(memberId);
        project.activities.forEach((a) => { if (String(a.assignedMember) === memberId) a.assignedMember = null; });
      } else if (member) Object.assign(member, pick(req.body, memberFields));
      else {
        const inputs = req.body.members ?? [req.body];
        if (!Array.isArray(inputs) || !inputs.length || inputs.some((input) => !input || typeof input !== 'object')) invalid('Provide a non-empty list of members.');
        project.members.push(...inputs.map((input) => pick(input, memberFields)));
      }
    }
    if (action === 'assignments') {
      if (!Array.isArray(req.body.assignments)) invalid('Assignments must be an array.');
      for (const assignment of req.body.assignments) {
        const activity = project.activities.find((a) => a.id === assignment?.activityId);
        if (!activity) invalid('Assignment references an unknown activity.');
        activity.assignedMember = assignment.memberId || null;
      }
    }
    await save(project);
    send(res, project, req.user);
  } catch (error) { next(error); }
}
export function autoAssign(req, res) { res.json({ suggestions: suggestAssignments(req.project.activities, req.project.members) }); }
export async function deleteProject(req, res, next) {
  try {
    if (String(req.project.owner) !== req.user.id) return res.status(403).json({ message: 'Only the owner can delete a project.' });
    await Project.deleteOne({ _id: req.project._id, owner: req.user.id });
    res.status(204).send();
  } catch (error) { next(error); }
}
