pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";



/**
* @dev Parent crowdsale contract with support for time-based and amount based bonuses 
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
* 
*/
contract BonusCrowdsale is Crowdsale, Ownable {

    // Constants
    // The following will be populated by main crowdsale contract
    uint[] public BONUS_TIMES;
    uint[] public BONUS_TIMES_VALUES;
    uint[] public BONUS_AMOUNTS;
    uint[] public BONUS_AMOUNTS_VALUES;
    uint public constant BONUS_COEFF = 1000; // Values should be 10x percents, values from 0 to 1000
    
    // Members
    uint public tokenPrice;
    uint public tokenDecimals;

    /**
    * @dev Contructor
    * @param _tokenPrice token price in USD cents. The price is fixed
    * @param _tokenDecimals number of digits after decimal point for CAT token
    */
    function BonusCrowdsale(uint256 _tokenPrice, uint256 _tokenDecimals) {
        tokenPrice = _tokenPrice;
        tokenDecimals = _tokenDecimals;
    }

    /**
    * @dev Overrided buyTokens method of parent Crowdsale contract  to provide bonus by changing and restoring rate variable
    * @param beneficiary walelt of investor to receive tokens
    */
    function buyTokens(address beneficiary) public payable {
        // Check constants consistency
        require(BONUS_TIMES.length > 0 || BONUS_AMOUNTS.length > 0);
        require(BONUS_TIMES.length == BONUS_TIMES_VALUES.length);
        require(BONUS_AMOUNTS.length == BONUS_AMOUNTS_VALUES.length);

        // Compute bonus
        uint256 usdValue = msg.value.mul(rate).mul(tokenPrice).div(100).div(10 ** tokenDecimals); 
        uint256 bonus = computeBonus(usdValue);

        // Apply bonus by adjusting and restoring rate member
        uint256 oldRate = rate;
        rate = rate.mul(BONUS_COEFF.add(bonus)).div(BONUS_COEFF);
        super.buyTokens(beneficiary);
        rate = oldRate;
    }

    /**
    * @dev Computes overall bonus based on time of contribution and amount of contribution. 
    * The total bonus is the sum of bonus by time and bonus by amount
    * @return bonus percentage scaled by 10
    */
    function computeBonus(uint256 usdValue) public constant returns(uint256) {
        return computeAmountBonus(usdValue).add(computeTimeBonus());
    }

    /**
    * @dev Computes bonus based on time of contribution relative to the beginning of crowdsale
    * @return bonus percentage scaled by 10
    */
    function computeTimeBonus() public constant returns(uint256) {
        require(now >= startTime);

        for (uint i = 0; i < BONUS_TIMES.length; i++) {
            if (now.sub(startTime) <= BONUS_TIMES[i]) {
                return BONUS_TIMES_VALUES[i];
            }
        }

        return 0;
    }

    /**
    * @dev Computes bonus based on amount of contribution
    * @return bonus percentage scaled by 10
    */
    function computeAmountBonus(uint256 usdValue) public constant returns(uint256) {
        for (uint i = 0; i < BONUS_AMOUNTS.length; i++) {
            if (usdValue >= BONUS_AMOUNTS[i]) {
                return BONUS_AMOUNTS_VALUES[i];
            }
        }

        return 0;
    }

}
