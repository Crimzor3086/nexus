const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔧 Setting up Nexus Platform test environment...");

    // Get the deployer account
    const [deployer, user1, user2, provider1, dao1] = await hre.ethers.getSigners();
    console.log("Deployer account:", deployer.address);
    console.log("User1 account:", user1.address);
    console.log("User2 account:", user2.address);
    console.log("Provider1 account:", provider1.address);
    console.log("DAO1 account:", dao1.address);

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

    console.log("\n📋 Loaded contract addresses:");
    console.log("NexusToken:", contracts.nexusToken);
    console.log("ProfileRegistry:", contracts.profileRegistry);
    console.log("UtilityPayment:", contracts.utilityPayment);
    console.log("ReputationSystem:", contracts.reputationSystem);

    try {
        // Get contract instances
        const NexusToken = await hre.ethers.getContractFactory("NexusToken");
        const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
        const UtilityPayment = await hre.ethers.getContractFactory("UtilityPayment");
        const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");

        const nexusToken = NexusToken.attach(contracts.nexusToken);
        const profileRegistry = ProfileRegistry.attach(contracts.profileRegistry);
        const utilityPayment = UtilityPayment.attach(contracts.utilityPayment);
        const reputationSystem = ReputationSystem.attach(contracts.reputationSystem);

        console.log("\n🚀 Setting up test environment...");

        // 1. Create test profiles
        console.log("\n👤 Creating test profiles...");
        
        // User1 creates profile
        const user1ProfileTx = await profileRegistry.connect(user1).createProfile(
            "Alice Johnson",
            "alice@example.com",
            "QmTestHash1"
        );
        await user1ProfileTx.wait();
        console.log("✅ User1 profile created");

        // User2 creates profile
        const user2ProfileTx = await profileRegistry.connect(user2).createProfile(
            "Bob Smith",
            "bob@example.com",
            "QmTestHash2"
        );
        await user2ProfileTx.wait();
        console.log("✅ User2 profile created");

        // 2. Approve profiles
        console.log("\n✅ Approving profiles...");
        const user1ProfileId = await profileRegistry.addressToProfileId(user1.address);
        const user2ProfileId = await profileRegistry.addressToProfileId(user2.address);
        
        await profileRegistry.approveProfile(user1ProfileId);
        await profileRegistry.approveProfile(user2ProfileId);
        console.log("✅ Profiles approved");

        // 3. Add provider
        console.log("\n🏢 Adding utility provider...");
        await utilityPayment.authorizeProvider(provider1.address);
        console.log("✅ Provider1 authorized");

        // 4. Create test bills
        console.log("\n📄 Creating test bills...");
        
        const currentTime = Math.floor(Date.now() / 1000);
        const dueDate1 = currentTime + (7 * 24 * 60 * 60); // 7 days from now
        const dueDate2 = currentTime + (14 * 24 * 60 * 60); // 14 days from now

        // Bill for User1
        const bill1Tx = await utilityPayment.connect(provider1).createBill(
            user1.address,
            0, // Electricity
            "PowerCorp",
            hre.ethers.parseEther("100"), // 100 ETH
            dueDate1,
            "Monthly electricity bill"
        );
        await bill1Tx.wait();
        console.log("✅ Bill1 created for User1");

        // Bill for User2
        const bill2Tx = await utilityPayment.connect(provider1).createBill(
            user2.address,
            1, // Water
            "AquaCorp",
            hre.ethers.parseEther("50"), // 50 ETH
            dueDate2,
            "Monthly water bill"
        );
        await bill2Tx.wait();
        console.log("✅ Bill2 created for User2");

        // 5. User1 pays bill
        console.log("\n💳 User1 paying bill...");
        const user1Bills = await utilityPayment.getUserBills(user1.address);
        const user1BillId = user1Bills[0];
        
        const paymentTx = await utilityPayment.connect(user1).payBill(user1BillId, {
            value: hre.ethers.parseEther("100")
        });
        await paymentTx.wait();
        console.log("✅ User1 payment completed");

        // 6. Update reputation metrics
        console.log("\n📊 Updating reputation metrics...");
        await reputationSystem.updateReputationMetrics(user1.address);
        await reputationSystem.updateReputationMetrics(user2.address);
        console.log("✅ Reputation metrics updated");

        // 7. Create a test proposal
        console.log("\n🗳️ Creating test proposal...");
        const proposalTx = await reputationSystem.connect(user1).createProposal(
            0, // Profile Approval
            user2.address,
            "Approve User2 profile",
            "Test proposal for profile approval"
        );
        await proposalTx.wait();
        console.log("✅ Test proposal created");

        // 8. Display test data
        console.log("\n📊 Test Environment Summary:");
        console.log("=============================");
        
        // Check profile status
        const user1Verified = await profileRegistry.isVerified(user1.address);
        const user2Verified = await profileRegistry.isVerified(user2.address);
        console.log("User1 verified:", user1Verified);
        console.log("User2 verified:", user2Verified);

        // Check payment history
        const user1History = await utilityPayment.getPaymentHistory(user1.address);
        console.log("User1 total payments:", user1History.totalPayments.toString());
        console.log("User1 on-time payments:", user1History.onTimePayments.toString());

        // Check reputation
        const user1Reputation = await reputationSystem.getReputationMetrics(user1.address);
        console.log("User1 reputation score:", user1Reputation.totalScore.toString());
        console.log("User1 reputation level:", user1Reputation.level.toString());

        // Check token balance
        const user1TokenBalance = await nexusToken.balanceOf(user1.address);
        console.log("User1 token balance:", hre.ethers.formatEther(user1TokenBalance), "NEX");

        console.log("=============================");
        console.log("\n✅ Test environment setup completed!");

        // Save test data
        const testData = {
            accounts: {
                deployer: deployer.address,
                user1: user1.address,
                user2: user2.address,
                provider1: provider1.address,
                dao1: dao1.address
            },
            contracts: contracts,
            testData: {
                user1ProfileId: user1ProfileId.toString(),
                user2ProfileId: user2ProfileId.toString(),
                user1BillId: user1BillId.toString(),
                user1Verified,
                user2Verified,
                user1Reputation: {
                    totalScore: user1Reputation.totalScore.toString(),
                    level: user1Reputation.level.toString()
                },
                user1TokenBalance: hre.ethers.formatEther(user1TokenBalance)
            },
            setupAt: new Date().toISOString()
        };

        const testDataPath = path.join(__dirname, '../test-data.json');
        fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));
        console.log("💾 Test data saved to test-data.json");

    } catch (error) {
        console.error("❌ Test environment setup failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
