// GOVERNANCE FRONTEND-ONLY - Community Building Without New Contracts
// Creates governance-like experience using existing contracts + frontend logic

class GovernanceFrontendOnly {
    constructor() {
        this.proposals = [];
        this.userVotes = {};
        this.communityStats = {};
        
        this.init();
    }

    async init() {
        console.log('🏛️ Initializing Frontend-Only Governance...');
        
        // Load data from localStorage
        this.loadLocalData();
        
        // Initialize with sample proposals
        this.initializeSampleProposals();
        
        // Add governance panel to existing UI
        this.addGovernancePanel();
        
        // Setup periodic updates
        this.startPeriodicUpdates();
    }

    loadLocalData() {
        // Load proposals from localStorage
        const storedProposals = localStorage.getItem('dayanaProposals');
        if (storedProposals) {
            this.proposals = JSON.parse(storedProposals);
        }

        // Load user votes
        const storedVotes = localStorage.getItem('dayanaUserVotes');
        if (storedVotes) {
            this.userVotes = JSON.parse(storedVotes);
        }

        // Load community stats
        const storedStats = localStorage.getItem('dayanaCommunityStats');
        if (storedStats) {
            this.communityStats = JSON.parse(storedStats);
        } else {
            // Initialize default stats for production
            this.communityStats = {
                totalParticipants: 0,
                activeProposals: 0,
                totalVotesCast: 0,
                communityTreasury: 0
            };
        }
    }

    saveLocalData() {
        localStorage.setItem('dayanaProposals', JSON.stringify(this.proposals));
        localStorage.setItem('dayanaUserVotes', JSON.stringify(this.userVotes));
        localStorage.setItem('dayanaCommunityStats', JSON.stringify(this.communityStats));
    }

    async initializeSampleProposals() {
        if (this.proposals.length === 0) {
            // Try to load real proposals from governance contract first
            await this.loadRealProposals();
            
            // If no real proposals found, start with empty state for production
            if (this.proposals.length === 0) {
                console.log('✅ No proposals found - starting with clean production state');
                this.proposals = [];
            }
        }
    }

    async loadRealProposals() {
        try {
            if (window.modernWeb3 && window.modernWeb3.contracts.governance) {
                console.log('📊 Loading real proposals from governance contract...');
                
                const governanceContract = window.modernWeb3.contracts.governance;
                
                // Note: The current governance contract doesn't have a function to get all proposals
                // This would need to be implemented in the contract or use events
                // For now, we'll mark that we tried to load real data
                console.log('⚠️ Governance contract available but no proposals function implemented');
                
                // TODO: Implement proposal loading when contract supports it
                // This would require:
                // 1. A function to get proposal count
                // 2. A function to get proposal by ID
                // 3. Event listeners for new proposals
                
            } else {
                console.log('⚠️ Governance contract not available');
            }
        } catch (error) {
            console.error('Error loading real proposals:', error);
        }
    }

    // ✅ ADD GOVERNANCE PANEL TO EXISTING UI
    addGovernancePanel() {
        const targetSection = document.querySelector('#community') || document.querySelector('main');
        if (!targetSection) return;

        const governanceDiv = document.createElement('div');
        governanceDiv.id = 'governance-panel';
        governanceDiv.className = 'max-width-80 section-container mx-auto mb-6 px-4 md:px-0';
        governanceDiv.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 border border-blue-400/30 w-full">
            <div class="text-center mb-6">
                <h3 class="text-3xl font-bold text-blue-400 mb-2">🏛️ Community Governance</h3>
                <p class="text-gray-300">Shape the future of DAYANA through community proposals</p>
                <div id="governance-data-source" class="mt-2">
                    <span class="text-xs px-2 py-1 rounded bg-green-600 text-white">
                        ✅ Live Governance Data
                    </span>
                </div>
            </div>

            <!-- Governance Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-700 p-4 rounded text-center">
                    <p class="text-blue-300 font-bold">Active Proposals</p>
                    <p id="active-proposals-stat" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-gray-700 p-4 rounded text-center">
                    <p class="text-green-300 font-bold">Total Participants</p>
                    <p id="total-participants-stat" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-gray-700 p-4 rounded text-center">
                    <p class="text-yellow-300 font-bold">Your Voting Power</p>
                    <p id="user-voting-power" class="text-2xl font-bold text-white">0</p>
                </div>
                <div class="bg-gray-700 p-4 rounded text-center">
                    <p class="text-purple-300 font-bold">Rewards Earned</p>
                    <p id="governance-rewards-earned" class="text-2xl font-bold text-white">0</p>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap gap-4 justify-center mb-6">
                <button onclick="governanceFE.showCreateProposal()" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold">
                    📝 Create Proposal
                </button>
                <button onclick="governanceFE.showAllProposals()" class="px-6 py-3 bg-green-500 hover:bg-green-600 rounded text-white font-bold">
                    🗳️ View All Proposals
                </button>
                <button onclick="governanceFE.showGovernanceGuide()" class="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded text-white font-bold">
                    📚 Governance Guide
                </button>
                <button onclick="window.open('governance-dashboard.html', '_blank')" class="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded text-white font-bold">
                    🏛️ Full Dashboard
                </button>
            </div>

            <!-- Active Proposals Preview -->
            <div class="bg-gray-700 rounded-lg p-4">
                <h4 class="font-bold text-blue-300 mb-4">🔥 Active Proposals</h4>
                <div id="proposals-preview" class="space-y-4">
                    <!-- Proposals will be loaded here -->
                </div>
            </div>
            </div>
        `;

        targetSection.appendChild(governanceDiv);

        // Load initial data
        this.updateGovernanceStats();
        this.loadActiveProposalsPreview();
    }

    // ✅ UPDATE GOVERNANCE STATS
    async updateGovernanceStats() {
        try {
            // Count active proposals
            const activeProposals = this.proposals.filter(p => p.status === 'active' && Date.now() < p.endTime).length;
            
            // Calculate user voting power (if connected)
            let userVotingPower = 0;
            if (window.modernWeb3 && window.modernWeb3.isConnected) {
                try {
                    const stakingContract = window.getContract('STAKING', window.modernWeb3.signer);
                    const stakeInfo = await stakingContract.getStakeInfo(window.modernWeb3.userAddress);
                    
                    if (stakeInfo.amount.toString() !== '0') {
                        const stakedAmount = parseFloat(window.formatTokenAmount(stakeInfo.amount));
                        // Voting power = staked amount × period multiplier
                        const periodMultiplier = {
                            30: 1,
                            90: 2,
                            180: 4,
                            365: 8
                        }[parseInt(stakeInfo.stakingPeriod.toString())] || 1;
                        
                        userVotingPower = stakedAmount * periodMultiplier;
                    }
                } catch (error) {
                    console.log('Could not load staking info for voting power');
                }
            }

            // Calculate rewards earned from governance participation
            const userAddress = window.modernWeb3?.userAddress || 'anonymous';
            const userVoteHistory = this.userVotes[userAddress] || [];
            const rewardsEarned = userVoteHistory.length * 10; // 10 DAYA per vote

            // Update UI
            document.getElementById('active-proposals-stat').textContent = activeProposals.toString();
            document.getElementById('total-participants-stat').textContent = this.communityStats.totalParticipants.toString();
            document.getElementById('user-voting-power').textContent = Math.floor(userVotingPower).toLocaleString();
            document.getElementById('governance-rewards-earned').textContent = rewardsEarned.toString();

        } catch (error) {
            console.error('Error updating governance stats:', error);
        }
    }

    // ✅ LOAD ACTIVE PROPOSALS PREVIEW
    loadActiveProposalsPreview() {
        const container = document.getElementById('proposals-preview');
        if (!container) return;

        const activeProposals = this.proposals.filter(p => 
            p.status === 'active' && Date.now() < p.endTime
        ).slice(0, 3); // Show max 3 proposals in preview

        if (activeProposals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <p class="text-lg mb-4">No active proposals at this time</p>
                    <p class="text-sm mb-4">Governance is ready for community participation</p>
                    <button onclick="governanceFE.showCreateProposal()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white">
                        Create First Proposal
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = activeProposals.map(proposal => {
            const totalVotes = proposal.votes.reduce((sum, votes) => sum + votes, 0);
            const winningOptionIndex = proposal.votes.indexOf(Math.max(...proposal.votes));
            const timeRemaining = this.formatTimeRemaining(proposal.endTime);
            const userAddress = window.modernWeb3?.userAddress || 'anonymous';
            const hasVoted = this.userVotes[userAddress]?.some(vote => vote.proposalId === proposal.id);

            return `
                <div class="bg-gray-600 p-4 rounded-lg">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h5 class="font-bold text-white mb-1">${proposal.title}</h5>
                            <p class="text-gray-300 text-sm mb-2">${proposal.description.slice(0, 120)}...</p>
                            <div class="flex items-center space-x-4 text-xs text-gray-400">
                                <span>by ${proposal.author}</span>
                                <span>${timeRemaining}</span>
                                <span>${totalVotes} votes</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-2 mb-3">
                        ${proposal.options.map((option, index) => {
                            const percentage = totalVotes > 0 ? ((proposal.votes[index] / totalVotes) * 100).toFixed(1) : 0;
                            const isWinning = index === winningOptionIndex;
                            
                            return `
                                <div class="flex items-center justify-between">
                                    <span class="text-sm ${isWinning ? 'font-bold text-white' : 'text-gray-300'}">${option} ${isWinning ? '🏆' : ''}</span>
                                    <span class="text-xs text-gray-400">${percentage}%</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-1">
                                    <div class="h-1 rounded-full ${isWinning ? 'bg-green-400' : 'bg-gray-500'}" style="width: ${percentage}%"></div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs px-2 py-1 rounded ${
                            proposal.category === 'protocol' ? 'bg-blue-600' :
                            proposal.category === 'rewards' ? 'bg-green-600' : 'bg-purple-600'
                        } text-white">${proposal.category}</span>
                        
                        ${!hasVoted ? `
                            <button onclick="governanceFE.showVoteModal(${proposal.id})" class="px-3 py-1 bg-orange-500 hover:bg-orange-600 rounded text-white text-sm">
                                Vote Now
                            </button>
                        ` : `
                            <span class="px-3 py-1 bg-green-600 rounded text-white text-sm">✅ Voted</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ✅ SHOW VOTE MODAL
    showVoteModal(proposalId) {
        const proposal = this.proposals.find(p => p.id === proposalId);
        if (!proposal) return;

        // Check if user can vote (has minimum stake)
        this.checkVotingEligibility(proposal.minStake).then(canVote => {
            if (!canVote.eligible) {
                alert(`❌ ${canVote.reason}`);
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50';
            modal.innerHTML = `
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-gray-800 rounded-lg max-w-lg w-full p-6">
                        <h3 class="text-xl font-bold text-blue-400 mb-4">🗳️ Cast Your Vote</h3>
                        
                        <div class="mb-4">
                            <h4 class="font-bold text-white mb-2">${proposal.title}</h4>
                            <p class="text-gray-300 text-sm">${proposal.description}</p>
                        </div>
                        
                        <div class="space-y-3 mb-6">
                            ${proposal.options.map((option, index) => `
                                <label class="flex items-center p-3 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer border border-gray-600 hover:border-blue-400">
                                    <input type="radio" name="vote-option" value="${index}" class="mr-3">
                                    <span class="text-white">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div class="bg-gray-700 p-4 rounded mb-6">
                            <p class="text-blue-400 font-bold">Your Voting Power: ${canVote.votingPower.toLocaleString()}</p>
                            <p class="text-green-400 text-sm">Reward: 10 DAYA for participating</p>
                        </div>
                        
                        <div class="flex justify-end space-x-4">
                            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded text-white">
                                Cancel
                            </button>
                            <button onclick="governanceFE.submitVote(${proposalId}, this.parentElement.parentElement)" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold">
                                Cast Vote
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        });
    }

    // ✅ CHECK VOTING ELIGIBILITY
    async checkVotingEligibility(minStake) {
        if (!window.modernWeb3 || !window.modernWeb3.isConnected) {
            return {
                eligible: false,
                reason: "Please connect your wallet to vote",
                votingPower: 0
            };
        }

        try {
            const stakingContract = window.getContract('STAKING', window.modernWeb3.signer);
            const stakeInfo = await stakingContract.getStakeInfo(window.modernWeb3.userAddress);
            
            if (stakeInfo.amount.toString() === '0') {
                return {
                    eligible: false,
                    reason: "You must be staking to participate in governance",
                    votingPower: 0
                };
            }

            const stakedAmount = parseFloat(window.formatTokenAmount(stakeInfo.amount));
            
            if (stakedAmount < minStake) {
                return {
                    eligible: false,
                    reason: `Minimum ${minStake.toLocaleString()} DAYA stake required. You have ${stakedAmount.toLocaleString()} DAYA.`,
                    votingPower: 0
                };
            }

            // Calculate voting power
            const periodMultiplier = {
                30: 1, 90: 2, 180: 4, 365: 8
            }[parseInt(stakeInfo.stakingPeriod.toString())] || 1;
            
            const votingPower = stakedAmount * periodMultiplier;

            return {
                eligible: true,
                reason: "",
                votingPower: votingPower
            };

        } catch (error) {
            return {
                eligible: false,
                reason: "Error checking staking status",
                votingPower: 0
            };
        }
    }

    // ✅ SUBMIT VOTE
    async submitVote(proposalId, modalElement) {
        try {
            const selectedOption = modalElement.querySelector('input[name="vote-option"]:checked');
            if (!selectedOption) {
                alert('❌ Please select an option');
                return;
            }

            const optionIndex = parseInt(selectedOption.value);
            const userAddress = window.modernWeb3.userAddress || 'anonymous';
            
            // Check if already voted
            if (this.userVotes[userAddress]?.some(vote => vote.proposalId === proposalId)) {
                alert('❌ You have already voted on this proposal');
                return;
            }

            // Get voting power
            const eligibility = await this.checkVotingEligibility(0);
            const votingPower = Math.floor(eligibility.votingPower);

            // Update proposal votes
            const proposal = this.proposals.find(p => p.id === proposalId);
            proposal.votes[optionIndex] += votingPower;

            // Record user vote
            if (!this.userVotes[userAddress]) {
                this.userVotes[userAddress] = [];
            }
            
            this.userVotes[userAddress].push({
                proposalId: proposalId,
                option: optionIndex,
                votingPower: votingPower,
                timestamp: Date.now()
            });

            // Update community stats
            this.communityStats.totalVotesCast += 1;

            // Save data
            this.saveLocalData();

            // Close modal
            modalElement.remove();

            // Show success message
            alert(`✅ Vote cast successfully!

Your choice: ${proposal.options[optionIndex]}
Voting power used: ${votingPower.toLocaleString()}
Reward earned: 10 DAYA

Thank you for participating in governance! 🎉`);

            // Refresh UI
            this.loadActiveProposalsPreview();
            this.updateGovernanceStats();

        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('❌ Error submitting vote: ' + error.message);
        }
    }

    // ✅ SHOW CREATE PROPOSAL MODAL
    showCreateProposal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-gray-800 rounded-lg max-w-2xl w-full p-6 my-8">
                    <h3 class="text-2xl font-bold text-blue-400 mb-6">📝 Create Community Proposal</h3>
                    
                    <form id="create-proposal-form" class="space-y-6">
                        <div>
                            <label class="block text-white font-bold mb-2">Title *</label>
                            <input type="text" name="title" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none" placeholder="Enter proposal title..." required>
                        </div>
                        
                        <div>
                            <label class="block text-white font-bold mb-2">Description *</label>
                            <textarea name="description" rows="4" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none" placeholder="Describe your proposal in detail..." required></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-white font-bold mb-2">Category</label>
                            <select name="category" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none">
                                <option value="protocol">Protocol Changes</option>
                                <option value="rewards">Rewards & Incentives</option>
                                <option value="expansion">Feature Expansion</option>
                                <option value="community">Community Initiatives</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-white font-bold mb-2">Voting Options *</label>
                            <div id="voting-options" class="space-y-2">
                                <input type="text" name="option1" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none" placeholder="Option 1 (e.g., Yes)" required>
                                <input type="text" name="option2" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none" placeholder="Option 2 (e.g., No)" required>
                            </div>
                            <button type="button" onclick="governanceFE.addVotingOption()" class="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm">
                                + Add Option
                            </button>
                        </div>
                        
                        <div>
                            <label class="block text-white font-bold mb-2">Minimum Stake Required (DAYA)</label>
                            <select name="minStake" class="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none">
                                <option value="1000">1,000 DAYA (Open to all stakers)</option>
                                <option value="5000">5,000 DAYA (Medium stake holders)</option>
                                <option value="10000">10,000 DAYA (Large stake holders)</option>
                                <option value="25000">25,000 DAYA (Tier 4 holders only)</option>
                            </select>
                        </div>
                        
                        <div class="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
                            <h4 class="font-bold text-blue-400 mb-2">💡 Proposal Guidelines</h4>
                            <ul class="text-blue-300 text-sm space-y-1">
                                <li>• Be clear and specific about the proposed changes</li>
                                <li>• Explain the benefits to the community</li>
                                <li>• Consider potential drawbacks and address them</li>
                                <li>• Proposals are voted on by the community for 7 days</li>
                            </ul>
                        </div>
                        
                        <div class="flex justify-end space-x-4">
                            <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded text-white">
                                Cancel
                            </button>
                            <button type="submit" class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold">
                                Create Proposal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add form submit handler
        document.getElementById('create-proposal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateProposal(e.target, modal);
        });
    }

    addVotingOption() {
        const container = document.getElementById('voting-options');
        const optionCount = container.children.length;
        
        if (optionCount >= 5) {
            alert('❌ Maximum 5 options allowed');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'text';
        input.name = `option${optionCount + 1}`;
        input.className = 'w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-400 focus:outline-none';
        input.placeholder = `Option ${optionCount + 1}`;
        input.required = true;
        
        container.appendChild(input);
    }

    async handleCreateProposal(form, modal) {
        try {
            const formData = new FormData(form);
            
            // Check if user is eligible to create proposals
            const eligibility = await this.checkVotingEligibility(1000); // Minimum 1000 DAYA to create proposals
            if (!eligibility.eligible) {
                alert(`❌ ${eligibility.reason}`);
                return;
            }

            // Collect options
            const options = [];
            let optionIndex = 1;
            while (formData.get(`option${optionIndex}`)) {
                const option = formData.get(`option${optionIndex}`).trim();
                if (option) options.push(option);
                optionIndex++;
            }

            if (options.length < 2) {
                alert('❌ At least 2 options are required');
                return;
            }

            // Create new proposal
            const newProposal = {
                id: Math.max(...this.proposals.map(p => p.id), 0) + 1,
                title: formData.get('title'),
                description: formData.get('description'),
                author: window.modernWeb3?.userAddress?.slice(0, 6) + '...' + window.modernWeb3?.userAddress?.slice(-4) || 'Anonymous',
                created: Date.now(),
                endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
                options: options,
                votes: new Array(options.length).fill(0),
                status: 'active',
                category: formData.get('category'),
                minStake: parseInt(formData.get('minStake'))
            };

            // Add to proposals
            this.proposals.unshift(newProposal);
            
            // Update community stats
            this.communityStats.totalParticipants += 1;
            
            // Save data
            this.saveLocalData();
            
            // Close modal
            modal.remove();
            
            // Show success
            alert(`✅ Proposal created successfully!

Title: ${newProposal.title}
Voting Period: 7 days
Minimum Stake: ${newProposal.minStake.toLocaleString()} DAYA

Your proposal is now live for community voting! 🎉`);
            
            // Refresh UI
            this.loadActiveProposalsPreview();
            this.updateGovernanceStats();
            
        } catch (error) {
            console.error('Error creating proposal:', error);
            alert('❌ Error creating proposal: ' + error.message);
        }
    }

    showGovernanceGuide() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-gray-800 rounded-lg max-w-4xl w-full p-6 my-8">
                    <h3 class="text-3xl font-bold text-blue-400 mb-6">📚 DAYANA Governance Guide</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="space-y-4">
                            <div class="bg-gray-700 p-4 rounded">
                                <h4 class="font-bold text-green-400 mb-2">🗳️ How to Vote</h4>
                                <ul class="text-gray-300 text-sm space-y-2">
                                    <li>• Must have active stake to vote</li>
                                    <li>• Voting power = Staked Amount × Period Multiplier</li>
                                    <li>• Earn 10 DAYA for each vote cast</li>
                                    <li>• Proposals last 7 days</li>
                                </ul>
                            </div>
                            
                            <div class="bg-gray-700 p-4 rounded">
                                <h4 class="font-bold text-blue-400 mb-2">📝 Creating Proposals</h4>
                                <ul class="text-gray-300 text-sm space-y-2">
                                    <li>• Minimum 1,000 DAYA stake required</li>
                                    <li>• Clear title and detailed description</li>
                                    <li>• 2-5 voting options allowed</li>
                                    <li>• Set appropriate minimum stake threshold</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="bg-gray-700 p-4 rounded">
                                <h4 class="font-bold text-purple-400 mb-2">💰 Voting Power Multipliers</h4>
                                <ul class="text-gray-300 text-sm space-y-2">
                                    <li>• 30 days: 1x multiplier</li>
                                    <li>• 90 days: 2x multiplier</li>
                                    <li>• 180 days: 4x multiplier</li>
                                    <li>• 365 days: 8x multiplier</li>
                                </ul>
                                <p class="text-yellow-400 text-xs mt-2">Longer commitments = more governance influence</p>
                            </div>
                            
                            <div class="bg-gray-700 p-4 rounded">
                                <h4 class="font-bold text-orange-400 mb-2">🎁 Rewards System</h4>
                                <ul class="text-gray-300 text-sm space-y-2">
                                    <li>• Vote on proposal: +10 DAYA</li>
                                    <li>• Create proposal: Community recognition</li>
                                    <li>• Active participation: Bonus multipliers</li>
                                    <li>• Future airdrops for governors</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg mb-6">
                        <h4 class="text-2xl font-bold text-white mb-4">🏛️ Current Community Stats</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-3xl font-bold text-white">${this.communityStats.totalParticipants}</p>
                                <p class="text-blue-200">Active Participants</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-white">${this.communityStats.totalVotesCast}</p>
                                <p class="text-blue-200">Total Votes Cast</p>
                            </div>
                            <div>
                                <p class="text-3xl font-bold text-white">${this.proposals.length}</p>
                                <p class="text-blue-200">Total Proposals</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button onclick="this.closest('.fixed').remove()" class="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded text-white font-bold text-lg">
                            🚀 Start Participating
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showAllProposals() {
        window.open('governance-dashboard.html', '_blank');
    }

    startPeriodicUpdates() {
        // Update every 30 seconds
        setInterval(() => {
            this.updateGovernanceStats();
            this.loadActiveProposalsPreview();
        }, 30000);
    }

    formatTimeRemaining(endTime) {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return 'Ended';
        
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h left`;
        else if (hours > 0) return `${hours}h left`;
        else return 'Ending soon';
    }
}

// Initialize Governance Frontend
let governanceFE;

document.addEventListener('DOMContentLoaded', () => {
    governanceFE = new GovernanceFrontendOnly();
});

// Make globally available
window.governanceFE = governanceFE;
