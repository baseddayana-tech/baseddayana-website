// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AirdropStandalone is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    bytes32 public merkleRoot;
    uint256 public airdropEndTime;
    
    mapping(address => bool) public claimed;
    
    event AirdropCreated(bytes32 merkleRoot, uint256 endTime);
    event TokensClaimed(address indexed user, uint256 amount);
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function setAirdrop(bytes32 _merkleRoot, uint256 _duration) external onlyOwner {
        merkleRoot = _merkleRoot;
        airdropEndTime = block.timestamp + _duration;
        emit AirdropCreated(_merkleRoot, airdropEndTime);
    }
    
    function claim(
        uint256 _amount,
        bytes32[] calldata _merkleProof
    ) external nonReentrant {
        require(block.timestamp <= airdropEndTime, "Airdrop ended");
        require(!claimed[msg.sender], "Already claimed");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof");
        
        claimed[msg.sender] = true;
        token.transfer(msg.sender, _amount);
        
        emit TokensClaimed(msg.sender, _amount);
    }
    
    function isEligible(address _user, uint256 _amount, bytes32[] calldata _merkleProof) 
        external 
        view 
        returns (bool) 
    {
        if (claimed[_user] || block.timestamp > airdropEndTime) return false;
        
        bytes32 leaf = keccak256(abi.encodePacked(_user, _amount));
        return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
    }
    
    function withdrawUnclaimed() external onlyOwner {
        require(block.timestamp > airdropEndTime, "Airdrop still active");
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner(), balance);
    }
}