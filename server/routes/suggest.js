const { Router } = require('express');
const { addSuggestion } = require('../lib/store');

const router = Router();

router.post('/', (req, res) => {
  const { rule, section, subsection, example, trigger, source, target, targetType, cwd, source_type, contextSkill } = req.body;
  if (!rule) return res.status(400).json({ error: 'rule is required' });
  const suggestion = addSuggestion({ rule, section, subsection, example, trigger, source, target, targetType, cwd, source_type, contextSkill });
  req.app.locals.broadcast?.('suggestion', suggestion);
  res.status(201).json(suggestion);
});

module.exports = router;
