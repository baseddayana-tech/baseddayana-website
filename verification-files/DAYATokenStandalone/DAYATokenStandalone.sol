// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract DAYATokenStandalone is ERC20, Ownable, ERC20Permit, ERC20Votes {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant AUTO_RENOUNCE_DELAY = 365 days; // 1 year
    
    uint256 public immutable deploymentTime;
    bool private _ownershipAutoRenounced = false;
    
    event OwnershipAutoRenounced();
    
    constructor() 
        ERC20("Dayana Token", "DAYA") 
        ERC20Permit("Dayana Token")
        ERC20Votes()
    {
        deploymentTime = block.timestamp;
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    function isOwnershipAutoRenounced() public view returns (bool) {
        return _ownershipAutoRenounced || 
               (block.timestamp >= deploymentTime + AUTO_RENOUNCE_DELAY);
    }
    
    function getTimeUntilAutoRenounce() external view returns (uint256) {
        if (isOwnershipAutoRenounced()) return 0;
        uint256 renounceTime = deploymentTime + AUTO_RENOUNCE_DELAY;
        if (block.timestamp >= renounceTime) return 0;
        return renounceTime - block.timestamp;
    }
    
    function renounceOwnership() public override onlyOwner {
        require(!isOwnershipAutoRenounced(), "Ownership already auto-renounced");
        _ownershipAutoRenounced = true;
        emit OwnershipAutoRenounced();
        super.renounceOwnership();
    }
    
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
    
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}