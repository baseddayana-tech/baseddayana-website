// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract AirdropStandalone {
    IERC20 public immutable dayaToken;
    address public owner;
    
    bytes32 public merkleRoot;
    uint256 public claimDeadline;
    mapping(address => bool) public hasClaimed;
    
    event AirdropStarted(bytes32 indexed merkleRoot, uint256 claimDeadline);
    event TokensClaimed(address indexed claimant, uint256 amount);
    event TokensRecovered(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _dayaTokenAddress) {
        dayaToken = IERC20(_dayaTokenAddress);
        owner = msg.sender;
    }
    
    function startAirdrop(bytes32 _merkleRoot, uint256 _claimDeadline) external onlyOwner {
        require(merkleRoot == bytes32(0), "Airdrop already started");
        require(_claimDeadline > block.timestamp, "Deadline must be in the future");
        
        merkleRoot = _merkleRoot;
        claimDeadline = _claimDeadline;
        
        emit AirdropStarted(_merkleRoot, _claimDeadline);
    }
    
    function claim(uint256 _amount, bytes32[] calldata _merkleProof) external {
        require(block.timestamp <= claimDeadline, "Claim period ended");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));
        require(verify(_merkleProof, merkleRoot, leaf), "Invalid proof");
        
        hasClaimed[msg.sender] = true;
        dayaToken.transfer(msg.sender, _amount);
        
        emit TokensClaimed(msg.sender, _amount);
    }
    
    function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
    
    function recoverTokens() external onlyOwner {
        require(block.timestamp > claimDeadline, "Claim period not ended");
        
        uint256 balance = dayaToken.balanceOf(address(this));
        dayaToken.transfer(owner, balance);
        
        emit TokensRecovered(balance);
    }
}