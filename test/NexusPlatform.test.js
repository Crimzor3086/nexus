const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nexus Platform", function () {
    let nexusToken, profileRegistry, utilityPayment, reputationSystem;
    let owner, user1, user2, provider1, dao1;
    let contractAddresses;

    beforeEach(async function () {
        [owner, user1, user2, provider1, dao1] = await ethers.getSigners();

        // Deploy NexusToken
        const NexusToken = await ethers.getContractFactory("NexusToken");
        nexusToken = await NexusToken.deploy();
        await nexusToken.waitForDeployment();

        // Deploy ProfileRegistry
        const ProfileRegistry = await ethers.getContractFactory("ProfileRegistry");
        profileRegistry = await ProfileRegistry.deploy();
        await profileRegistry.waitForDeployment();

        // Deploy UtilityPayment
        const UtilityPayment = await ethers.getContractFactory("UtilityPayment");
        utilityPayment = await UtilityPayment.deploy(
            await profileRegistry.getAddress(),
            await nexusToken.getAddress(),
            owner.address
        );
        await utilityPayment.waitForDeployment();

        // Deploy ReputationSystem
        const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
        reputationSystem = await ReputationSystem.deploy(
            await profileRegistry.getAddress(),
            await utilityPayment.getAddress()
        );
        await reputationSystem.waitForDeployment();

        // Setup contracts
        await nexusToken.addMinter(await utilityPayment.getAddress());
        await profileRegistry.addAdmin(owner.address);
        await reputationSystem.addDAO(owner.address);

        contractAddresses = {
            nexusToken: await nexusToken.getAddress(),
            profileRegistry: await profileRegistry.getAddress(),
            utilityPayment: await utilityPayment.getAddress(),
            reputationSystem: await reputationSystem.getAddress()
        };
    });

    describe("ProfileRegistry", function () {
        it("Should create a profile", async function () {
            const tx = await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );
            await tx.wait();

            const profileId = await profileRegistry.addressToProfileId(user1.address);
            expect(profileId).to.be.greaterThan(0);

            const profile = await profileRegistry.getProfileByAddress(user1.address);
            expect(profile.name).to.equal("Alice Johnson");
            expect(profile.email).to.equal("alice@example.com");
            expect(profile.status).to.equal(0); // Pending
        });

        it("Should approve a profile", async function () {
            // Create profile
            await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );

            const profileId = await profileRegistry.addressToProfileId(user1.address);
            
            // Approve profile
            await profileRegistry.approveProfile(profileId);

            const profile = await profileRegistry.getProfileByAddress(user1.address);
            expect(profile.status).to.equal(1); // Approved
            expect(profile.reputationScore).to.equal(100);
        });

        it("Should check verification status", async function () {
            // Create and approve profile
            await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );

            const profileId = await profileRegistry.addressToProfileId(user1.address);
            await profileRegistry.approveProfile(profileId);

            const isVerified = await profileRegistry.isVerified(user1.address);
            expect(isVerified).to.be.true;
        });
    });

    describe("UtilityPayment", function () {
        beforeEach(async function () {
            // Create and approve profiles
            await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );
            await profileRegistry.connect(user2).createProfile(
                "Bob Smith",
                "bob@example.com",
                "QmTestHash2"
            );

            const user1ProfileId = await profileRegistry.addressToProfileId(user1.address);
            const user2ProfileId = await profileRegistry.addressToProfileId(user2.address);
            
            await profileRegistry.approveProfile(user1ProfileId);
            await profileRegistry.approveProfile(user2ProfileId);

            // Authorize provider
            await utilityPayment.authorizeProvider(provider1.address);
        });

        it("Should create a utility bill", async function () {
            const currentTime = Math.floor(Date.now() / 1000);
            const dueDate = currentTime + (7 * 24 * 60 * 60); // 7 days from now

            const tx = await utilityPayment.connect(provider1).createBill(
                user1.address,
                0, // Electricity
                "PowerCorp",
                ethers.parseEther("100"),
                dueDate,
                "Monthly electricity bill"
            );
            await tx.wait();

            const userBills = await utilityPayment.getUserBills(user1.address);
            expect(userBills.length).to.equal(1);

            const bill = await utilityPayment.getBill(userBills[0]);
            expect(bill.user).to.equal(user1.address);
            expect(bill.billType).to.equal(0);
            expect(bill.provider).to.equal("PowerCorp");
            expect(bill.amount).to.equal(ethers.parseEther("100"));
        });

        it("Should pay a utility bill and earn rewards", async function () {
            // Create bill
            const currentTime = Math.floor(Date.now() / 1000);
            const dueDate = currentTime + (7 * 24 * 60 * 60);

            await utilityPayment.connect(provider1).createBill(
                user1.address,
                0,
                "PowerCorp",
                ethers.parseEther("100"),
                dueDate,
                "Monthly electricity bill"
            );

            const userBills = await utilityPayment.getUserBills(user1.address);
            const billId = userBills[0];

            // Pay bill
            const initialBalance = await nexusToken.balanceOf(user1.address);
            
            const tx = await utilityPayment.connect(user1).payBill(billId, {
                value: ethers.parseEther("100")
            });
            await tx.wait();

            // Check payment history
            const history = await utilityPayment.getPaymentHistory(user1.address);
            expect(history.totalPayments).to.equal(1);
            expect(history.onTimePayments).to.equal(1);

            // Check reward
            const finalBalance = await nexusToken.balanceOf(user1.address);
            expect(finalBalance).to.be.greaterThan(initialBalance);
        });

        it("Should calculate rewards correctly", async function () {
            const currentTime = Math.floor(Date.now() / 1000);
            const dueDate = currentTime + (7 * 24 * 60 * 60);

            await utilityPayment.connect(provider1).createBill(
                user1.address,
                0,
                "PowerCorp",
                ethers.parseEther("100"),
                dueDate,
                "Monthly electricity bill"
            );

            const userBills = await utilityPayment.getUserBills(user1.address);
            const billId = userBills[0];

            const reward = await utilityPayment.calculateReward(billId);
            expect(reward).to.be.greaterThan(0);
        });
    });

    describe("ReputationSystem", function () {
        beforeEach(async function () {
            // Create and approve profiles
            await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );
            await profileRegistry.connect(user2).createProfile(
                "Bob Smith",
                "bob@example.com",
                "QmTestHash2"
            );

            const user1ProfileId = await profileRegistry.addressToProfileId(user1.address);
            const user2ProfileId = await profileRegistry.addressToProfileId(user2.address);
            
            await profileRegistry.approveProfile(user1ProfileId);
            await profileRegistry.approveProfile(user2ProfileId);

            // Update reputation metrics
            await reputationSystem.updateReputationMetrics(user1.address);
            await reputationSystem.updateReputationMetrics(user2.address);
        });

        it("Should create a proposal", async function () {
            const tx = await reputationSystem.connect(user1).createProposal(
                0, // Profile Approval
                user2.address,
                "Approve User2 profile",
                "Test proposal"
            );
            await tx.wait();

            const totalProposals = await reputationSystem.getTotalProposals();
            expect(totalProposals).to.equal(1);
        });

        it("Should vote on a proposal", async function () {
            // Create proposal
            await reputationSystem.connect(user1).createProposal(
                0,
                user2.address,
                "Approve User2 profile",
                "Test proposal"
            );

            // Vote
            const tx = await reputationSystem.connect(user2).vote(1, true);
            await tx.wait();

            const proposal = await reputationSystem.getProposal(1);
            expect(proposal.votesFor).to.be.greaterThan(0);
        });

        it("Should calculate voting power", async function () {
            const votingPower = await reputationSystem.calculateVotingPower(user1.address);
            expect(votingPower).to.be.greaterThan(0);
        });

        it("Should update reputation metrics", async function () {
            const metrics = await reputationSystem.getReputationMetrics(user1.address);
            expect(metrics.totalScore).to.be.greaterThan(0);
            expect(metrics.level).to.be.greaterThan(0);
        });
    });

    describe("NexusToken", function () {
        it("Should mint tokens", async function () {
            const initialBalance = await nexusToken.balanceOf(user1.address);
            
            await nexusToken.mint(user1.address, ethers.parseEther("1000"));
            
            const finalBalance = await nexusToken.balanceOf(user1.address);
            expect(finalBalance).to.equal(initialBalance + ethers.parseEther("1000"));
        });

        it("Should transfer tokens", async function () {
            await nexusToken.mint(user1.address, ethers.parseEther("1000"));
            
            await nexusToken.connect(user1).transfer(user2.address, ethers.parseEther("100"));
            
            const user2Balance = await nexusToken.balanceOf(user2.address);
            expect(user2Balance).to.equal(ethers.parseEther("100"));
        });
    });

    describe("Integration Tests", function () {
        it("Should complete full user journey", async function () {
            // 1. Create profile
            await profileRegistry.connect(user1).createProfile(
                "Alice Johnson",
                "alice@example.com",
                "QmTestHash1"
            );

            // 2. Approve profile
            const profileId = await profileRegistry.addressToProfileId(user1.address);
            await profileRegistry.approveProfile(profileId);

            // 3. Create bill
            const currentTime = Math.floor(Date.now() / 1000);
            const dueDate = currentTime + (7 * 24 * 60 * 60);

            await utilityPayment.authorizeProvider(provider1.address);
            await utilityPayment.connect(provider1).createBill(
                user1.address,
                0,
                "PowerCorp",
                ethers.parseEther("100"),
                dueDate,
                "Monthly electricity bill"
            );

            // 4. Pay bill
            const userBills = await utilityPayment.getUserBills(user1.address);
            const billId = userBills[0];

            await utilityPayment.connect(user1).payBill(billId, {
                value: ethers.parseEther("100")
            });

            // 5. Update reputation
            await reputationSystem.updateReputationMetrics(user1.address);

            // 6. Create proposal
            await reputationSystem.connect(user1).createProposal(
                0,
                user2.address,
                "Approve User2",
                "Test proposal"
            );

            // Verify final state
            const isVerified = await profileRegistry.isVerified(user1.address);
            const history = await utilityPayment.getPaymentHistory(user1.address);
            const metrics = await reputationSystem.getReputationMetrics(user1.address);
            const tokenBalance = await nexusToken.balanceOf(user1.address);

            expect(isVerified).to.be.true;
            expect(history.totalPayments).to.equal(1);
            expect(metrics.totalScore).to.be.greaterThan(0);
            expect(tokenBalance).to.be.greaterThan(0);
        });
    });
});
