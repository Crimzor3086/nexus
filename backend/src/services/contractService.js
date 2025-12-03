const { ethers } = require('ethers');
const config = require('../config');

// Load ABIs from artifacts
let ProfileRegistryABI, UtilityPaymentABI;

try {
  ProfileRegistryABI = require('../../artifacts/contracts/ProfileRegistry.sol/ProfileRegistry.json').abi;
  UtilityPaymentABI = require('../../artifacts/contracts/UtilityPayment.sol/UtilityPayment.json').abi;
} catch (error) {
  console.warn('⚠️  Warning: Contract ABIs not found. Using empty ABIs.');
  ProfileRegistryABI = [];
  UtilityPaymentABI = [];
}

let provider, signer, profileRegistry, utilityPayment;

async function initContracts() {
  provider = new ethers.JsonRpcProvider(config.rpcUrl);
  signer = new ethers.Wallet(config.privateKey, provider);

  profileRegistry = new ethers.Contract(
    config.contracts.profileRegistry,
    ProfileRegistryABI,
    signer
  );

  utilityPayment = new ethers.Contract(
    config.contracts.utilityPayment,
    UtilityPaymentABI,
    signer
  );

  console.log('✅ Backend wallet:', await signer.getAddress());
}

module.exports = {
  initContracts,
  getProfileRegistry: () => profileRegistry,
  getUtilityPayment: () => utilityPayment,
  getSigner: () => signer,
};