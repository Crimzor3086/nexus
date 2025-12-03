const { getProfileRegistry } = require('./contractService');

async function createProfile({ name, email, documentHash, userId }) {
  const contract = getProfileRegistry();
  const tx = await contract.createProfile(name, email, documentHash);
  await tx.wait();
  return tx.hash;
}

module.exports = { createProfile };