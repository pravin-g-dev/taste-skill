const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { appendToTargetFile } = require('./targets');

const tastePath = () => process.env.TASTE_PATH || path.join(process.cwd(), '.taste');

function ensureDir() {
  const dir = tastePath();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// In-memory pending suggestions (also persisted to pending.json)
let pending = [];

function loadPending() {
  const dir = ensureDir();
  const file = path.join(dir, 'pending.json');
  if (fs.existsSync(file)) {
    try {
      pending = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      pending = [];
    }
  }
}

function savePending() {
  const dir = ensureDir();
  fs.writeFileSync(path.join(dir, 'pending.json'), JSON.stringify(pending, null, 2));
}

function addSuggestion(data) {
  const suggestion = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    rule: data.rule,
    section: data.section || 'General',
    subsection: data.subsection || null,
    example: data.example || null,
    trigger: data.trigger || 'passive',
    source: data.source || null,
    target: data.target || '',
    targetType: data.targetType || 'taste-profile',
    cwd: data.cwd || null,
    source_type: data.source_type || 'manual',
    contextSkill: data.contextSkill || null,
  };
  pending.push(suggestion);
  savePending();
  return suggestion;
}

function getPending() {
  return [...pending];
}

function removePending(id) {
  const idx = pending.findIndex(s => s.id === id);
  if (idx === -1) return null;
  const [removed] = pending.splice(idx, 1);
  savePending();
  return removed;
}

function readProfile() {
  const file = path.join(tastePath(), 'profile.md');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function readRejected() {
  const file = path.join(tastePath(), 'rejected.md');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

// Kept for backward compatibility; routes through appendToTargetFile
function appendToProfile(suggestion) {
  appendToTargetFile({ ...suggestion, targetType: suggestion.targetType || 'taste-profile' });
}

function appendToRejected(suggestion) {
  const dir = ensureDir();
  const file = path.join(dir, 'rejected.md');
  const line = `- [${new Date().toISOString().split('T')[0]}] ${suggestion.rule} (section: ${suggestion.section})\n`;
  fs.appendFileSync(file, line);
}

module.exports = { loadPending, addSuggestion, getPending, removePending, readProfile, readRejected, appendToProfile, appendToTargetFile, appendToRejected };
