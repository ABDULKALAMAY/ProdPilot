const tokens = (text) => String(text || '').toLowerCase().match(/[a-z0-9]+(?:[.+#-][a-z0-9+#]+)*/g) || [];
const contains = (text, phrase) => {
  const source = ` ${tokens(text).join(' ')} `;
  const target = tokens(phrase).join(' ');
  return target && source.includes(` ${target} `);
};

export function suggestAssignments(activities, members) {
  const load = new Map(members.map((member) => [String(member._id), activities.filter((a) => String(a.assignedMember) === String(member._id)).length]));
  return activities.filter((activity) => !activity.assignedMember).map((activity) => {
    const text = `${activity.name} ${activity.description}`;
    const ranked = members.map((member) => {
      const reasons = [];
      let score = 0;
      if (activity.requiredRole && contains(member.role, activity.requiredRole)) { score += 8; reasons.push(`Role: ${member.role}`); }
      for (const skill of activity.requiredSkills || []) {
        if (member.skills.some((value) => contains(value, skill))) { score += 10; reasons.push(`Required skill: ${skill}`); }
      }
      for (const skill of member.skills) if (contains(text, skill)) { score += 3; reasons.push(`Mentioned skill: ${skill}`); }
      if (contains(text, member.role)) { score += 2; reasons.push(`Mentioned role: ${member.role}`); }
      return { memberId: String(member._id), memberName: member.name, score, reasons };
    }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score || load.get(a.memberId) - load.get(b.memberId) || a.memberId.localeCompare(b.memberId));
    const best = ranked[0];
    if (best) load.set(best.memberId, load.get(best.memberId) + 1);
    return { activityId: activity.id, ...(best || { memberId: null, score: 0, reasons: ['No matching role or skill. Assign manually.'] }) };
  });
}
