// Parse a profile.md into sections for API responses
function parseProfile(markdown) {
  if (!markdown) return {};
  const sections = {};
  let currentSection = null;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim();
      sections[currentSection] = [];
    } else if (currentSection && line.startsWith('- ')) {
      sections[currentSection].push(line.slice(2).trim());
    }
  }
  return sections;
}

module.exports = { parseProfile };
