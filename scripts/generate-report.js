const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("📊 Generating Nexus Platform report...");

    // Load deployed contracts and test data
    const addressesPath = path.join(__dirname, '../deployed-contracts.json');
    const testDataPath = path.join(__dirname, '../test-data.json');
    
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

    let testData = null;
    if (fs.existsSync(testDataPath)) {
        testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    }

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

        console.log("\n📋 NEXUS PLATFORM REPORT");
        console.log("=========================");
        console.log("Generated at:", new Date().toISOString());
        console.log("Network:", networkName);
        console.log("Deployer:", contracts.deployer);

        // Contract Information
        console.log("\n🏗️ CONTRACT INFORMATION");
        console.log("=======================");
        console.log("NexusToken:", contracts.nexusToken);
        console.log("ProfileRegistry:", contracts.profileRegistry);
        console.log("UtilityPayment:", contracts.utilityPayment);
        console.log("ReputationSystem:", contracts.reputationSystem);

        // Platform Statistics
        console.log("\n📊 PLATFORM STATISTICS");
        console.log("=======================");
        
        const totalProfiles = await profileRegistry.getTotalProfiles();
        const totalBills = await utilityPayment.getTotalBills();
        const totalPayments = await utilityPayment.getTotalPayments();
        const totalProposals = await reputationSystem.getTotalProposals();
        const totalSupply = await nexusToken.totalSupply();

        console.log("Total Profiles:", totalProfiles.toString());
        console.log("Total Bills:", totalBills.toString());
        console.log("Total Payments:", totalPayments.toString());
        console.log("Total Proposals:", totalProposals.toString());
        console.log("Total NEX Supply:", hre.ethers.formatEther(totalSupply));

        // Token Distribution
        console.log("\n💰 TOKEN DISTRIBUTION");
        console.log("=====================");
        
        if (testData && testData.testData) {
            const accounts = testData.accounts;
            
            for (const [role, address] of Object.entries(accounts)) {
                if (address !== contracts.deployer) {
                    const balance = await nexusToken.balanceOf(address);
                    console.log(`${role}:`, hre.ethers.formatEther(balance), "NEX");
                }
            }
        }

        // Reputation Metrics
        console.log("\n⭐ REPUTATION METRICS");
        console.log("====================");
        
        if (testData && testData.testData) {
            const accounts = testData.accounts;
            
            for (const [role, address] of Object.entries(accounts)) {
                if (role.includes('user')) {
                    try {
                        const reputation = await reputationSystem.getReputationMetrics(address);
                        const votingPower = await reputationSystem.calculateVotingPower(address);
                        console.log(`${role}:`);
                        console.log(`  Reputation Score: ${reputation.totalScore.toString()}`);
                        console.log(`  Reputation Level: ${reputation.level.toString()}`);
                        console.log(`  Voting Power: ${votingPower.toString()}`);
                    } catch (error) {
                        console.log(`${role}: No reputation data`);
                    }
                }
            }
        }

        // Payment Statistics
        console.log("\n💳 PAYMENT STATISTICS");
        console.log("====================");
        
        if (testData && testData.testData) {
            const accounts = testData.accounts;
            
            for (const [role, address] of Object.entries(accounts)) {
                if (role.includes('user')) {
                    try {
                        const history = await utilityPayment.getPaymentHistory(address);
                        const bills = await utilityPayment.getUserBills(address);
                        console.log(`${role}:`);
                        console.log(`  Total Payments: ${history.totalPayments.toString()}`);
                        console.log(`  On-time Payments: ${history.onTimePayments.toString()}`);
                        console.log(`  Overdue Payments: ${history.overduePayments.toString()}`);
                        console.log(`  Total Rewards: ${hre.ethers.formatEther(history.totalRewardsEarned)} NEX`);
                        console.log(`  Total Bills: ${bills.length}`);
                    } catch (error) {
                        console.log(`${role}: No payment data`);
                    }
                }
            }
        }

        // Contract Configuration
        console.log("\n⚙️ CONTRACT CONFIGURATION");
        console.log("==========================");
        
        const onTimeRewardRate = await utilityPayment.onTimeRewardRate();
        const earlyPaymentBonus = await utilityPayment.earlyPaymentBonus();
        const platformFeeRate = await utilityPayment.platformFeeRate();
        const minProposalThreshold = await reputationSystem.MIN_PROPOSAL_THRESHOLD();
        const quorumThreshold = await reputationSystem.QUORUM_THRESHOLD();
        const approvalThreshold = await reputationSystem.APPROVAL_THRESHOLD();

        console.log("Payment Configuration:");
        console.log(`  On-time Reward Rate: ${onTimeRewardRate.toString()}%`);
        console.log(`  Early Payment Bonus: ${earlyPaymentBonus.toString()}%`);
        console.log(`  Platform Fee Rate: ${platformFeeRate.toString()}%`);
        
        console.log("Governance Configuration:");
        console.log(`  Min Proposal Threshold: ${minProposalThreshold.toString()}`);
        console.log(`  Quorum Threshold: ${quorumThreshold.toString()}%`);
        console.log(`  Approval Threshold: ${approvalThreshold.toString()}%`);

        // Network Information
        console.log("\n🌐 NETWORK INFORMATION");
        console.log("======================");
        
        const blockNumber = await hre.ethers.provider.getBlockNumber();
        const gasPrice = await hre.ethers.provider.getGasPrice();
        const network = await hre.ethers.provider.getNetwork();
        
        console.log("Current Block:", blockNumber);
        console.log("Gas Price:", hre.ethers.formatUnits(gasPrice, "gwei"), "Gwei");
        console.log("Chain ID:", network.chainId.toString());
        console.log("Network Name:", network.name);

        // Generate HTML Report
        const htmlReport = generateHTMLReport({
            networkName,
            contracts,
            totalProfiles: totalProfiles.toString(),
            totalBills: totalBills.toString(),
            totalPayments: totalPayments.toString(),
            totalProposals: totalProposals.toString(),
            totalSupply: hre.ethers.formatEther(totalSupply),
            blockNumber,
            gasPrice: hre.ethers.formatUnits(gasPrice, "gwei"),
            chainId: network.chainId.toString(),
            generatedAt: new Date().toISOString()
        });

        const reportPath = path.join(__dirname, '../nexus-platform-report.html');
        fs.writeFileSync(reportPath, htmlReport);
        console.log("\n📄 HTML report generated: nexus-platform-report.html");

        console.log("\n✅ Report generation completed!");

    } catch (error) {
        console.error("❌ Report generation failed:", error);
        process.exit(1);
    }
}

function generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Platform Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .contract-address { background: #ecf0f1; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
        .stat { display: inline-block; margin: 10px 20px 10px 0; padding: 10px; background: #3498db; color: white; border-radius: 5px; }
        .metric { background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #27ae60; }
        .warning { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .error { background: #f8d7da; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Nexus Platform Report</h1>
        
        <div class="section">
            <h2>📋 Platform Overview</h2>
            <p><strong>Generated:</strong> ${data.generatedAt}</p>
            <p><strong>Network:</strong> ${data.networkName}</p>
            <p><strong>Chain ID:</strong> ${data.chainId}</p>
            <p><strong>Current Block:</strong> ${data.blockNumber}</p>
            <p><strong>Gas Price:</strong> ${data.gasPrice} Gwei</p>
        </div>

        <div class="section">
            <h2>🏗️ Contract Addresses</h2>
            <div class="contract-address">
                <strong>NexusToken:</strong> ${data.contracts.nexusToken}
            </div>
            <div class="contract-address">
                <strong>ProfileRegistry:</strong> ${data.contracts.profileRegistry}
            </div>
            <div class="contract-address">
                <strong>UtilityPayment:</strong> ${data.contracts.utilityPayment}
            </div>
            <div class="contract-address">
                <strong>ReputationSystem:</strong> ${data.contracts.reputationSystem}
            </div>
        </div>

        <div class="section">
            <h2>📊 Platform Statistics</h2>
            <div class="stat">Total Profiles: ${data.totalProfiles}</div>
            <div class="stat">Total Bills: ${data.totalBills}</div>
            <div class="stat">Total Payments: ${data.totalPayments}</div>
            <div class="stat">Total Proposals: ${data.totalProposals}</div>
            <div class="stat">Total NEX Supply: ${data.totalSupply}</div>
        </div>

        <div class="section">
            <h2>🎯 Platform Features</h2>
            <div class="metric">
                <h3>✅ Profile Verification</h3>
                <p>Users can create verified on-chain profiles with document verification and admin/DAO approval.</p>
            </div>
            <div class="metric">
                <h3>💳 Utility Payments</h3>
                <p>Users can pay utility bills and earn rewards for timely payments, with automatic reward distribution.</p>
            </div>
            <div class="metric">
                <h3>⭐ Reputation System</h3>
                <p>Transparent reputation scoring based on payment history, profile verification, and community participation.</p>
            </div>
            <div class="metric">
                <h3>🗳️ DAO Governance</h3>
                <p>Community-driven governance with proposal creation, voting, and execution for platform decisions.</p>
            </div>
        </div>

        <div class="section">
            <h2>🔧 Technical Details</h2>
            <p><strong>Smart Contract Framework:</strong> Hardhat</p>
            <p><strong>Blockchain:</strong> Ethereum-compatible / Polkadot</p>
            <p><strong>Token Standard:</strong> ERC-20</p>
            <p><strong>Governance:</strong> On-chain voting with reputation-based voting power</p>
            <p><strong>Reward System:</strong> Automatic token distribution for timely payments</p>
        </div>

        <div class="footer">
            <p>Generated by Nexus Platform Deployment Script</p>
            <p>For more information, visit the project repository</p>
        </div>
    </div>
</body>
</html>
    `;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
