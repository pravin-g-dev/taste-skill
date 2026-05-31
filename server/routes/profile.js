const { Router } = require('express');
const { readProfile, readRejected } = require('../lib/store');
const { parseProfile } = require('../lib/parser');

const router = Router();

router.get('/profile', (req, res) => {
  const raw = readProfile();
  if (!raw) return res.json({ sections: {}, raw: null, exists: false });
  res.json({ sections: parseProfile(raw), raw, exists: true });
});

router.get('/profile/raw', (req, res) => {
  const raw = readProfile();
  if (!raw) return res.status(404).send('No profile found. Run: npx taste-skill init');
  res.type('text/plain').send(raw);
});

router.get('/rejected', (req, res) => {
  const raw = readRejected();
  res.json({ raw: raw || '', exists: !!raw });
});

module.exports = router;
