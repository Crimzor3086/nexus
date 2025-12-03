const express = require('express');
const { createProfile } = require('../services/profileService');
const router = express.Router();

// Optional: Add auth middleware later
router.post('/create', async (req, res) => {
  try {
    const { name, email, documentHash, userId } = req.body;
    if (!name || !email || !documentHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const txHash = await createProfile({ name, email, documentHash, userId });
    res.json({ success: true, txHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;