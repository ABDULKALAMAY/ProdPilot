// Small RFC-style CSV reader: quoted commas, escaped quotes and CRLF are supported.
function csvRows(text) {
  const rows = [];
  let row = [], value = '', quoted = false, closed = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { value += '"'; index++; }
      else if (char === '"') { quoted = false; closed = true; }
      else value += char;
    } else if (char === '"' && !value && !closed) quoted = true;
    else if (char === ',' || char === '\n' || char === '\r') {
      row.push(value.trim()); value = ''; closed = false;
      if (char !== ',') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === '\r' && text[index + 1] === '\n') index++;
      }
    } else {
      if (char === '"' || (closed && char.trim())) throw new Error('Invalid CSV quoting. Put quotes around fields containing commas.');
      value += char;
    }
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseMembers(text, filename) {
  let members;
  if (filename.toLowerCase().endsWith('.json')) members = JSON.parse(text.replace(/^\uFEFF/, ''));
  else if (filename.toLowerCase().endsWith('.csv')) {
    const [header, ...rows] = csvRows(text.replace(/^\uFEFF/, ''));
    const columns = header?.map((value) => value.toLowerCase());
    if (!columns || ['name', 'email', 'role', 'skills'].some((key) => !columns.includes(key))) throw new Error('CSV headers must include name,email,role,skills.');
    members = rows.map((row) => {
      if (row.length !== columns.length) throw new Error('CSV column count differs from the header. Quote skills containing commas.');
      return Object.fromEntries(columns.map((key, index) => [key, row[index]]));
    });
  } else throw new Error('Choose a .csv or .json file.');
  if (!Array.isArray(members) || !members.length || members.length > 200) throw new Error('Import must contain 1–200 members.');
  return members.map((member, index) => {
    if (!member || ['name', 'email', 'role'].some((key) => typeof member[key] !== 'string' || !member[key].trim())) throw new Error(`Member ${index + 1}: name, email and role are required.`);
    const skills = Array.isArray(member.skills) ? member.skills : typeof member.skills === 'string' ? member.skills.split(/[,;]/) : [];
    if (skills.some((skill) => typeof skill !== 'string')) throw new Error(`Member ${index + 1}: skills must be strings.`);
    return { name: member.name.trim(), email: member.email.trim().toLowerCase(), role: member.role.trim(), skills: skills.map((skill) => skill.trim()).filter(Boolean) };
  });
}
