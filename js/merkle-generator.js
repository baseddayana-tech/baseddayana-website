// BASED DAYANA ($DAYA) - Merkle Tree Generator
// Utility for generating Merkle trees for airdrops

// Prevent redeclaration
if (typeof MerkleTreeGenerator === 'undefined') {
    let MerkleTreeGenerator;
    
MerkleTreeGenerator = class {
    constructor() {
        this.leaves = [];
        this.tree = [];
        this.root = null;
    }

    // Simple hash function (for demo - use proper crypto in production)
    hash(data) {
        // This is a simplified hash for demo purposes
        // In production, use a proper cryptographic hash like keccak256
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    // Add a claim to the tree
    addClaim(address, amount) {
        // Create leaf hash from address and amount
        const leaf = this.hash(address.toLowerCase() + amount.toString());
        this.leaves.push({
            address: address.toLowerCase(),
            amount: amount,
            hash: leaf
        });
    }

    // Generate the Merkle tree
    generateTree() {
        if (this.leaves.length === 0) {
            throw new Error('No claims added');
        }

        // Sort leaves by hash for deterministic tree
        this.leaves.sort((a, b) => a.hash.localeCompare(b.hash));

        // Initialize tree with leaves
        this.tree = [this.leaves.map(leaf => leaf.hash)];

        // Build tree levels
        let currentLevel = 0;
        while (this.tree[currentLevel].length > 1) {
            const nextLevel = [];
            const currentHashes = this.tree[currentLevel];

            for (let i = 0; i < currentHashes.length; i += 2) {
                const left = currentHashes[i];
                const right = i + 1 < currentHashes.length ? currentHashes[i + 1] : left;
                const combined = left < right ? left + right : right + left;
                nextLevel.push(this.hash(combined));
            }

            this.tree.push(nextLevel);
            currentLevel++;
        }

        this.root = this.tree[this.tree.length - 1][0];
        return this.root;
    }

    // Get Merkle proof for an address
    getProof(address, amount) {
        const targetLeaf = this.hash(address.toLowerCase() + amount.toString());
        const proof = [];

        // Find leaf index
        let leafIndex = -1;
        for (let i = 0; i < this.leaves.length; i++) {
            if (this.leaves[i].hash === targetLeaf) {
                leafIndex = i;
                break;
            }
        }

        if (leafIndex === -1) {
            throw new Error('Address not found in tree');
        }

        let currentIndex = leafIndex;
        
        // Generate proof by traversing up the tree
        for (let level = 0; level < this.tree.length - 1; level++) {
            const currentLevelHashes = this.tree[level];
            const isEven = currentIndex % 2 === 0;
            const siblingIndex = isEven ? currentIndex + 1 : currentIndex - 1;

            if (siblingIndex < currentLevelHashes.length) {
                proof.push('0x' + currentLevelHashes[siblingIndex]);
            }

            currentIndex = Math.floor(currentIndex / 2);
        }

        return proof;
    }

    // Verify a proof
    verifyProof(address, amount, proof) {
        let hash = this.hash(address.toLowerCase() + amount.toString());

        for (const proofElement of proof) {
            const proofHash = proofElement.replace('0x', '');
            const combined = hash < proofHash ? hash + proofHash : proofHash + hash;
            hash = this.hash(combined);
        }

        return '0x' + hash === '0x' + this.root;
    }

    // Export tree data
    exportTreeData() {
        if (!this.root) {
            throw new Error('Tree not generated yet');
        }

        const claims = {};
        let totalAmount = '0';

        for (const leaf of this.leaves) {
            const proof = this.getProof(leaf.address, leaf.amount);
            claims[leaf.address] = {
                amount: leaf.amount,
                proof: proof
            };
            
            // Add to total (simple string addition for demo)
            totalAmount = (BigInt(totalAmount) + BigInt(leaf.amount)).toString();
        }

        return {
            merkleRoot: '0x' + this.root,
            totalAmount: totalAmount,
            eligibleAddresses: this.leaves.length,
            claims: claims
        };
    }

    // Generate sample airdrop data
    static generateSampleData() {
        const generator = new MerkleTreeGenerator();

        // Sample addresses and amounts
        const sampleData = [
            { address: '0x742d35Cc6635C0532925a3b8D400d2Af9b1C2b6d', amount: '1000000000000000000000' }, // 1000 DAYA
            { address: '0x8ba1f109551bD432803012645Hac136c26C4b0B4', amount: '500000000000000000000' },  // 500 DAYA
            { address: '0x1234567890123456789012345678901234567890', amount: '750000000000000000000' },  // 750 DAYA
            { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '250000000000000000000' },  // 250 DAYA
            { address: '0x9876543210987654321098765432109876543210', amount: '100000000000000000000' },  // 100 DAYA
        ];

        // Add claims to generator
        for (const data of sampleData) {
            generator.addClaim(data.address, data.amount);
        }

        // Generate tree
        generator.generateTree();

        return generator.exportTreeData();
    }
}

// Utility functions for the frontend
window.MerkleTreeGenerator = MerkleTreeGenerator;

// Function to load sample Merkle data
window.loadSampleMerkleData = function() {
    return MerkleTreeGenerator.generateSampleData();
};

// Function to verify if user is in sample data
window.checkSampleEligibility = function(userAddress) {
    const sampleData = MerkleTreeGenerator.generateSampleData();
    const addressLower = userAddress.toLowerCase();
    
    if (sampleData.claims[addressLower]) {
        return {
            isEligible: true,
            amount: sampleData.claims[addressLower].amount,
            proof: sampleData.claims[addressLower].proof,
            formattedAmount: window.formatTokenAmount ? 
                window.formatTokenAmount(sampleData.claims[addressLower].amount) : 
                sampleData.claims[addressLower].amount
        };
    }
    
    return {
        isEligible: false,
        amount: '0',
        proof: [],
        formattedAmount: '0'
    };
};

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerkleTreeGenerator;
}

    // Global instance (only if in browser)
    if (typeof window !== 'undefined') {
        window.merkleGenerator = new MerkleTreeGenerator();
        window.MerkleTreeGenerator = MerkleTreeGenerator;
        console.log('🌳 Merkle Tree Generator loaded');
    }
} else {
    console.log('🌳 MerkleTreeGenerator already loaded, skipping');
}






