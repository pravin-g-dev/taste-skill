const { Router } = require('express');
const { getPending, removePending, appendToProfile, appendToRejected } = require('../lib/store');

const router = Router();

router.get('/pending', (req, res) => {
  res.json(getPending());
});

router.post('/accept/:id', (req, res) => {
  const suggestion = removePending(req.params.id);
  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
  appendToProfile(suggestion);
  req.app.locals.broadcast?.('accepted', { id: suggestion.id });
  res.json({ status: 'accepted', suggestion });
});

router.post('/discard/:id', (req, res) => {
  const suggestion = removePending(req.params.id);
  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
  appendToRejected(suggestion);
  req.app.locals.broadcast?.('discarded', { id: suggestion.id });
  res.json({ status: 'discarded', suggestion });
});

router.delete('/pending/:id', (req, res) => {
  const suggestion = removePending(req.params.id);
  if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
  req.app.locals.broadcast?.('removed', { id: suggestion.id });
  res.json({ status: 'removed', suggestion });
});

module.exports = router;
