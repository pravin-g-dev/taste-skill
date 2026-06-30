const fs = require('fs');
const path = require('path');

const tastePath = () => process.env.TASTE_PATH || path.join(process.cwd(), '.taste');

function resolveTargetPath(suggestion) {
  const { targetType, target, cwd } = suggestion;
  switch (targetType) {
    case 'root-claude-md':
      return path.join(cwd || process.cwd(), 'CLAUDE.md');
    case 'project-claude-md':
    case 'skill-md':
      return target || null;
    case 'taste-profile':
    default:
      return path.join(tastePath(), 'profile.md');
  }
}

function appendToTargetFile(suggestion) {
  const filePath = resolveTargetPath(suggestion);
  if (!filePath) return;
  appendToFile(filePath, suggestion.section, suggestion.rule, suggestion.example, suggestion.targetType);
}

function appendToFile(filePath, section, rule, example, targetType) {
  const line = buildLine(rule, example);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${getDefaultHeader(targetType)}\n\n## ${section}\n${line}\n`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const sectionHeader = `## ${section}`;
  if (content.includes(sectionHeader)) {
    fs.writeFileSync(filePath, content.replace(sectionHeader, `${sectionHeader}\n${line}`));
  } else {
    fs.appendFileSync(filePath, `\n## ${section}\n${line}\n`);
  }
}

function buildLine(rule, example) {
  let line = `- ${rule}`;
  if (example) line += `\n  - Example: \`${example}\``;
  return line;
}

function getDefaultHeader(targetType) {
  switch (targetType) {
    case 'root-claude-md':
    case 'project-claude-md':
      return '# CLAUDE.md\n<!-- Organization coding standards. Managed by taste-skill. -->';
    case 'skill-md':
      return '# Skill Rules\n<!-- Rules appended by taste-skill. -->';
    default:
      return '# Taste Profile\n<!-- Auto-managed by taste-skill. -->';
  }
}

function getAvailableTargets(cwd) {
  const targets = [];
  const base = cwd || process.cwd();

  const profilePath = path.join(tastePath(), 'profile.md');
  targets.push({ type: 'taste-profile', label: 'Taste Profile (.taste/profile.md)', path: profilePath, exists: fs.existsSync(profilePath) });

  const projectClaudeMd = path.join(base, 'CLAUDE.md');
  targets.push({ type: 'root-claude-md', label: 'CLAUDE.md (project root)', path: projectClaudeMd, exists: fs.existsSync(projectClaudeMd) });

  const globalClaudeMd = path.join(process.env.HOME || '', '.claude-shared', 'CLAUDE.md');
  if (fs.existsSync(path.dirname(globalClaudeMd))) {
    targets.push({ type: 'root-claude-md', label: 'CLAUDE.md (global ~/.claude-shared)', path: globalClaudeMd, exists: fs.existsSync(globalClaudeMd) });
  }

  const skillDirs = [
    path.join(base, '.claude', 'skills'),
    path.join(process.env.HOME || '', '.claude', 'skills'),
    path.join(process.env.HOME || '', '.claude-shared', 'skills'),
    path.join(process.env.HOME || '', '.claude-office-pro', 'skills'),
  ];

  for (const dir of skillDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const skillMd = path.join(dir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          targets.push({ type: 'skill-md', label: `Skill: ${entry.name}`, path: skillMd, exists: true });
        }
      }
    } catch {}
  }

  return targets;
}

module.exports = { resolveTargetPath, appendToTargetFile, appendToFile, getAvailableTargets };
