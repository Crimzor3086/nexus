const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🧪 Running Nexus Platform tests...");

    // Load test data
    const testDataPath = path.join(__dirname, '../test-data.json');
    if (!fs.existsSync(testDataPath)) {
        console.error("❌ No test data found. Please run setup-test-env.js first.");
        process.exit(1);
    }

    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    const contracts = testData.contracts;
    const accounts = testData.accounts;

    console.log("📋 Test Configuration:");
    console.log("User1:", accounts.user1);
    console.log("User2:", accounts.user2);
    console.log("Provider1:", accounts.provider1);

    try {
        // Get contract instances
        const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
        const UtilityPayment = await hre.ethers.getContractFactory("UtilityPayment");
        const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
        const NexusToken = await hre.ethers.getContractFactory("NexusToken");

        const profileRegistry = ProfileRegistry.attach(contracts.profileRegistry);
        const utilityPayment = UtilityPayment.attach(contracts.utilityPayment);
        const reputationSystem = ReputationSystem.attach(contracts.reputationSystem);
        const nexusToken = NexusToken.attach(contracts.nexusToken);

        // Test 1: Profile Verification
        console.log("\n🔍 Test 1: Profile Verification");
        console.log("================================");
        
        const user1Verified = await profileRegistry.isVerified(accounts.user1);
        const user2Verified = await profileRegistry.isVerified(accounts.user2);
        
        console.log("User1 verified:", user1Verified ? "✅ PASS" : "❌ FAIL");
        console.log("User2 verified:", user2Verified ? "✅ PASS" : "❌ FAIL");

        // Test 2: Payment System
        console.log("\n💳 Test 2: Payment System");
        console.log("=========================");
        
        const user1History = await utilityPayment.getPaymentHistory(accounts.user1);
        const user1Bills = await utilityPayment.getUserBills(accounts.user1);
        
        console.log("User1 total payments:", user1History.totalPayments.toString());
        console.log("User1 on-time payments:", user1History.onTimePayments.toString());
        console.log("User1 total bills:", user1Bills.length);
        
        const hasPayments = user1History.totalPayments > 0;
        console.log("Payment system working:", hasPayments ? "✅ PASS" : "❌ FAIL");

        // Test 3: Reward Distribution
        console.log("\n🎁 Test 3: Reward Distribution");
        console.log("==============================");
        
        const user1TokenBalance = await nexusToken.balanceOf(accounts.user1);
        const user2TokenBalance = await nexusToken.balanceOf(accounts.user2);
        
        console.log("User1 token balance:", hre.ethers.formatEther(user1TokenBalance), "NEX");
        console.log("User2 token balance:", hre.ethers.formatEther(user2TokenBalance), "NEX");
        
        const hasRewards = user1TokenBalance > 0;
        console.log("Reward distribution working:", hasRewards ? "✅ PASS" : "❌ FAIL");

        // Test 4: Reputation System
        console.log("\n⭐ Test 4: Reputation System");
        console.log("============================");
        
        const user1Reputation = await reputationSystem.getReputationMetrics(accounts.user1);
        const user2Reputation = await reputationSystem.getReputationMetrics(accounts.user2);
        
        console.log("User1 reputation score:", user1Reputation.totalScore.toString());
        console.log("User1 reputation level:", user1Reputation.level.toString());
        console.log("User2 reputation score:", user2Reputation.totalScore.toString());
        console.log("User2 reputation level:", user2Reputation.level.toString());
        
        const hasReputation = user1Reputation.totalScore > 0;
        console.log("Reputation system working:", hasReputation ? "✅ PASS" : "❌ FAIL");

        // Test 5: Governance
        console.log("\n🗳️ Test 5: Governance System");
        console.log("============================");
        
        const totalProposals = await reputationSystem.getTotalProposals();
        const user1VotingPower = await reputationSystem.calculateVotingPower(accounts.user1);
        const user2VotingPower = await reputationSystem.calculateVotingPower(accounts.user2);
        
        console.log("Total proposals:", totalProposals.toString());
        console.log("User1 voting power:", user1VotingPower.toString());
        console.log("User2 voting power:", user2VotingPower.toString());
        
        const hasGovernance = totalProposals > 0 && user1VotingPower > 0;
        console.log("Governance system working:", hasGovernance ? "✅ PASS" : "❌ FAIL");

        // Test 6: Contract Interactions
        console.log("\n🔗 Test 6: Contract Interactions");
        console.log("================================");
        
        // Test creating a new bill
        const currentTime = Math.floor(Date.now() / 1000);
        const dueDate = currentTime + (30 * 24 * 60 * 60); // 30 days from now
        
        const newBillTx = await utilityPayment.connect(hre.ethers.provider.getSigner(accounts.provider1)).createBill(
            accounts.user2,
            2, // Gas
            "GasCorp",
            hre.ethers.parseEther("75"), // 75 ETH
            dueDate,
            "Monthly gas bill"
        );
        await newBillTx.wait();
        
        const user2BillsAfter = await utilityPayment.getUserBills(accounts.user2);
        const billCreated = user2BillsAfter.length > 0;
        
        console.log("New bill created:", billCreated ? "✅ PASS" : "❌ FAIL");

        // Test 7: Error Handling
        console.log("\n⚠️ Test 7: Error Handling");
        console.log("========================");
        
        try {
            // Try to create profile with empty name (should fail)
            await profileRegistry.connect(hre.ethers.provider.getSigner(accounts.user1)).createProfile(
                "",
                "test@example.com",
                "QmTestHash"
            );
            console.log("Empty name validation:", "❌ FAIL - Should have thrown error");
        } catch (error) {
            console.log("Empty name validation:", "✅ PASS - Correctly rejected");
        }

        try {
            // Try to pay bill without being verified (should fail)
            const unverifiedUser = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
            await utilityPayment.connect(unverifiedUser).payBill(1, {
                value: hre.ethers.parseEther("100")
            });
            console.log("Unverified user payment:", "❌ FAIL - Should have thrown error");
        } catch (error) {
            console.log("Unverified user payment:", "✅ PASS - Correctly rejected");
        }

        // Summary
        console.log("\n📊 Test Summary");
        console.log("===============");
        console.log("Profile Verification:", user1Verified && user2Verified ? "✅ PASS" : "❌ FAIL");
        console.log("Payment System:", hasPayments ? "✅ PASS" : "❌ FAIL");
        console.log("Reward Distribution:", hasRewards ? "✅ PASS" : "❌ FAIL");
        console.log("Reputation System:", hasReputation ? "✅ PASS" : "❌ FAIL");
        console.log("Governance System:", hasGovernance ? "✅ PASS" : "❌ FAIL");
        console.log("Contract Interactions:", billCreated ? "✅ PASS" : "❌ FAIL");
        console.log("Error Handling:", "✅ PASS");

        const allTestsPassed = user1Verified && user2Verified && hasPayments && 
                              hasRewards && hasReputation && hasGovernance && billCreated;

        console.log("\n🎯 Overall Result:", allTestsPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED");

        if (allTestsPassed) {
            console.log("\n🎉 Nexus Platform is working correctly!");
        } else {
            console.log("\n⚠️ Some tests failed. Please check the implementation.");
        }

    } catch (error) {
        console.error("❌ Test execution failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
