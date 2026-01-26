const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/deposit', auth, async (req, res) => {
    res.json({ message: 'Deposit endpoint placeholder' });
});

router.post('/withdraw', auth, async (req, res) => {
    res.json({ message: 'Withdrawal endpoint placeholder' });
});

module.exports = router;
