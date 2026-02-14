// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureTimestampManager
 * @dev Protection against timestamp manipulation attacks
 * @author BASED DAYANA Security Team
 */
contract SecureTimestampManager {
    // Events
    event TimestampValidationFailed(uint256 blockTimestamp, uint256 expectedRange, string reason);
    event TimestampManipulationDetected(uint256 blockTimestamp, uint256 previousTimestamp, uint256 deviation);
    
    // Constants for timestamp validation
    uint256 public constant MAX_TIMESTAMP_DEVIATION = 15; // 15 seconds max deviation
    uint256 public constant MIN_BLOCK_INTERVAL = 12; // Minimum 12 seconds between blocks
    uint256 public constant MAX_BLOCK_INTERVAL = 30; // Maximum 30 seconds between blocks
    
    // State variables
    mapping(uint256 => uint256) public blockTimestamps;
    uint256 public lastValidatedBlock;
    uint256 public lastValidatedTimestamp;
    
    // Modifier to validate timestamps
    modifier validTimestamp() {
        _validateTimestamp();
        _;
    }
    
    /**
     * @dev Validates the current block timestamp against manipulation
     */
    function _validateTimestamp() internal {
        uint256 currentTimestamp = block.timestamp;
        uint256 currentBlock = block.number;
        
        // Store current block timestamp
        blockTimestamps[currentBlock] = currentTimestamp;
        
        // If this is not the first block, validate against previous
        if (lastValidatedBlock > 0) {
            uint256 blockInterval = currentBlock - lastValidatedBlock;
            uint256 timeInterval = currentTimestamp - lastValidatedTimestamp;
            
            // Check for reasonable block interval
            require(
                blockInterval >= 1 && blockInterval <= 10,
                "Invalid block interval"
            );
            
            // Check for reasonable time interval (considering 12-30 second blocks)
            uint256 minExpectedTime = blockInterval * MIN_BLOCK_INTERVAL;
            uint256 maxExpectedTime = blockInterval * MAX_BLOCK_INTERVAL;
            
            require(
                timeInterval >= minExpectedTime && timeInterval <= maxExpectedTime,
                "Timestamp manipulation detected"
            );
            
            // Check for excessive deviation from expected time
            uint256 expectedTime = lastValidatedTimestamp + (blockInterval * 15); // 15 seconds average
            uint256 deviation = timeInterval > expectedTime ? 
                timeInterval - expectedTime : expectedTime - timeInterval;
                
            if (deviation > MAX_TIMESTAMP_DEVIATION) {
                emit TimestampManipulationDetected(
                    currentTimestamp, 
                    lastValidatedTimestamp, 
                    deviation
                );
                // Don't revert, but log the issue
            }
        }
        
        // Update last validated values
        lastValidatedBlock = currentBlock;
        lastValidatedTimestamp = currentTimestamp;
    }
    
    /**
     * @dev Get a safe timestamp with validation
     * @return A validated timestamp
     */
    function getSafeTimestamp() external validTimestamp returns (uint256) {
        return block.timestamp;
    }
    
    /**
     * @dev Check if a timestamp is within safe range
     * @param _timestamp The timestamp to validate
     * @return True if timestamp is safe
     */
    function isTimestampSafe(uint256 _timestamp) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        uint256 deviation = _timestamp > currentTime ? 
            _timestamp - currentTime : currentTime - _timestamp;
        return deviation <= MAX_TIMESTAMP_DEVIATION;
    }
    
    /**
     * @dev Get timestamp with maximum deviation tolerance
     * @param _maxDeviation Maximum allowed deviation in seconds
     * @return Safe timestamp
     */
    function getTimestampWithTolerance(uint256 _maxDeviation) external view returns (uint256) {
        require(_maxDeviation <= MAX_TIMESTAMP_DEVIATION, "Deviation too high");
        return block.timestamp;
    }
    
    /**
     * @dev Calculate time remaining with timestamp protection
     * @param _endTime The end time to calculate against
     * @return Time remaining in seconds
     */
    function getTimeRemaining(uint256 _endTime) external validTimestamp returns (uint256) {
        uint256 currentTime = block.timestamp;
        if (currentTime >= _endTime) {
            return 0;
        }
        return _endTime - currentTime;
    }
    
    /**
     * @dev Check if a deadline has passed with timestamp validation
     * @param _deadline The deadline to check
     * @return True if deadline has passed
     */
    function isDeadlinePassed(uint256 _deadline) external validTimestamp returns (bool) {
        return block.timestamp > _deadline;
    }
    
    /**
     * @dev Get block timestamp history for analysis
     * @param _fromBlock Starting block number
     * @param _toBlock Ending block number
     * @return Array of timestamps
     */
    function getTimestampHistory(uint256 _fromBlock, uint256 _toBlock) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(_toBlock >= _fromBlock, "Invalid block range");
        require(_toBlock - _fromBlock <= 100, "Range too large");
        
        uint256[] memory timestamps = new uint256[](_toBlock - _fromBlock + 1);
        for (uint256 i = 0; i <= _toBlock - _fromBlock; i++) {
            timestamps[i] = blockTimestamps[_fromBlock + i];
        }
        return timestamps;
    }
}
