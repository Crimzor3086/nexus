const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🚀 Starting Nexus Platform deployment...");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    const contractAddresses = {};

    try {
        // Deploy NexusToken first
        console.log("\n📦 Deploying NexusToken...");
        const NexusToken = await hre.ethers.getContractFactory("NexusToken");
        const nexusToken = await NexusToken.deploy();
        await nexusToken.waitForDeployment();
        const nexusTokenAddress = await nexusToken.getAddress();
        contractAddresses.nexusToken = nexusTokenAddress;
        console.log("✅ NexusToken deployed to:", nexusTokenAddress);

        // Deploy ProfileRegistry
        console.log("\n📦 Deploying ProfileRegistry...");
        const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
        const profileRegistry = await ProfileRegistry.deploy();
        await profileRegistry.waitForDeployment();
        const profileRegistryAddress = await profileRegistry.getAddress();
        contractAddresses.profileRegistry = profileRegistryAddress;
        console.log("✅ ProfileRegistry deployed to:", profileRegistryAddress);

        // Deploy UtilityPayment
        console.log("\n📦 Deploying UtilityPayment...");
        const UtilityPayment = await hre.ethers.getContractFactory("UtilityPayment");
        const utilityPayment = await UtilityPayment.deploy(
            profileRegistryAddress,
            nexusTokenAddress,
            deployer.address // Fee recipient
        );
        await utilityPayment.waitForDeployment();
        const utilityPaymentAddress = await utilityPayment.getAddress();
        contractAddresses.utilityPayment = utilityPaymentAddress;
        console.log("✅ UtilityPayment deployed to:", utilityPaymentAddress);

        // Deploy ReputationSystem
        console.log("\n📦 Deploying ReputationSystem...");
        const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
        const reputationSystem = await ReputationSystem.deploy(
            profileRegistryAddress,
            utilityPaymentAddress
        );
        await reputationSystem.waitForDeployment();
        const reputationSystemAddress = await reputationSystem.getAddress();
        contractAddresses.reputationSystem = reputationSystemAddress;
        console.log("✅ ReputationSystem deployed to:", reputationSystemAddress);

        // Set up initial configurations
        console.log("\n⚙️ Setting up initial configurations...");

        // Add UtilityPayment as minter for NexusToken
        console.log("Adding UtilityPayment as minter...");
        await nexusToken.addMinter(utilityPaymentAddress);
        console.log("✅ UtilityPayment added as minter");

        // Add deployer as admin to ProfileRegistry
        console.log("Adding deployer as admin...");
        await profileRegistry.addAdmin(deployer.address);
        console.log("✅ Deployer added as admin");

        // Add deployer as DAO to ReputationSystem
        console.log("Adding deployer as DAO...");
        await reputationSystem.addDAO(deployer.address);
        console.log("✅ Deployer added as DAO");

        // Save contract addresses to file
        const addressesPath = path.join(__dirname, '../deployed-contracts.json');
        const networkName = hre.network.name;
        
        let deployedContracts = {};
        if (fs.existsSync(addressesPath)) {
            deployedContracts = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        }
        
        deployedContracts[networkName] = {
            ...contractAddresses,
            deployedAt: new Date().toISOString(),
            deployer: deployer.address,
            network: networkName
        };

        fs.writeFileSync(addressesPath, JSON.stringify(deployedContracts, null, 2));
        console.log("\n💾 Contract addresses saved to deployed-contracts.json");

        // Display summary
        console.log("\n🎉 Deployment Summary:");
        console.log("========================");
        console.log("Network:", networkName);
        console.log("Deployer:", deployer.address);
        console.log("NexusToken:", nexusTokenAddress);
        console.log("ProfileRegistry:", profileRegistryAddress);
        console.log("UtilityPayment:", utilityPaymentAddress);
        console.log("ReputationSystem:", reputationSystemAddress);
        console.log("========================");

        // Verify contracts if on a live network
        if (networkName !== "hardhat" && networkName !== "localhost") {
            console.log("\n🔍 Verifying contracts on Etherscan...");
            await verifyContract(nexusTokenAddress, []);
            await verifyContract(profileRegistryAddress, []);
            await verifyContract(utilityPaymentAddress, [profileRegistryAddress, nexusTokenAddress, deployer.address]);
            await verifyContract(reputationSystemAddress, [profileRegistryAddress, utilityPaymentAddress]);
        }

        console.log("\n✅ Deployment completed successfully!");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

async function verifyContract(address, constructorArgs) {
    try {
        console.log(`Verifying contract at ${address}...`);
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArgs,
        });
        console.log(`✅ Contract verified: ${address}`);
    } catch (error) {
        console.log(`⚠️ Verification failed for ${address}:`, error.message);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
