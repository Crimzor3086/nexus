const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 Verifying Nexus Platform contracts...");

    // Load deployed contracts
    const addressesPath = path.join(__dirname, '../deployed-contracts.json');
    if (!fs.existsSync(addressesPath)) {
        console.error("❌ No deployed contracts found. Please run deployment first.");
        process.exit(1);
    }

    const deployedContracts = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    const networkName = hre.network.name;
    const contracts = deployedContracts[networkName];

    if (!contracts) {
        console.error(`❌ No contracts found for network: ${networkName}`);
        process.exit(1);
    }

    console.log("📋 Verifying contracts on network:", networkName);
    console.log("NexusToken:", contracts.nexusToken);
    console.log("ProfileRegistry:", contracts.profileRegistry);
    console.log("UtilityPayment:", contracts.utilityPayment);
    console.log("ReputationSystem:", contracts.reputationSystem);

    try {
        // Verify NexusToken
        console.log("\n🔍 Verifying NexusToken...");
        await hre.run("verify:verify", {
            address: contracts.nexusToken,
            constructorArguments: [],
        });
        console.log("✅ NexusToken verified");

        // Verify ProfileRegistry
        console.log("\n🔍 Verifying ProfileRegistry...");
        await hre.run("verify:verify", {
            address: contracts.profileRegistry,
            constructorArguments: [],
        });
        console.log("✅ ProfileRegistry verified");

        // Verify UtilityPayment
        console.log("\n🔍 Verifying UtilityPayment...");
        await hre.run("verify:verify", {
            address: contracts.utilityPayment,
            constructorArguments: [
                contracts.profileRegistry,
                contracts.nexusToken,
                deployedContracts[networkName].deployer
            ],
        });
        console.log("✅ UtilityPayment verified");

        // Verify ReputationSystem
        console.log("\n🔍 Verifying ReputationSystem...");
        await hre.run("verify:verify", {
            address: contracts.reputationSystem,
            constructorArguments: [
                contracts.profileRegistry,
                contracts.utilityPayment
            ],
        });
        console.log("✅ ReputationSystem verified");

        console.log("\n🎉 All contracts verified successfully!");

    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
