const express = require('express');
const { getUtilityPayment } = require('../services/contractService');
const router = express.Router();

router.post('/pay', async (req, res) => {
  try {
    const { billId, amount } = req.body;
    if (!billId || !amount) {
      return res.status(400).json({ error: 'billId and amount required' });
    }

    const contract = getUtilityPayment();
    const tx = await contract.payBill(billId, amount);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;