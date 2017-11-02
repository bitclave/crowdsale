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
    uint32[] public BONUS_TIMES;
    uint32[] public BONUS_TIMES_VALUES;
    uint32[] public BONUS_AMOUNTS;
    uint32[] public BONUS_AMOUNTS_VALUES;
    uint public constant BONUS_COEFF = 1000; // Values should be 10x percents, value 1000 = 100%
    
    // Members
    uint public tokenPriceInCents;

    /**
    * @dev Contructor
    * @param _tokenPriceInCents token price in USD cents. The price is fixed
    */
    function BonusCrowdsale(uint256 _tokenPriceInCents) public {
        tokenPriceInCents = _tokenPriceInCents;
    }

    /**
    * @dev Retrieve length of bonuses by time array
    * @return Bonuses by time array length
    */
    function bonusesForTimesCount() public constant returns(uint) {
        return BONUS_TIMES.length;
    }

    /**
    * @dev Sets bonuses for time
    */
    function setBonusesForTimes(uint32[] times, uint32[] values) public onlyOwner {
        require(times.length == values.length);
        for (uint i = 0; i + 1 < times.length; i++) {
            require(times[i] < times[i+1]);
        }

        BONUS_TIMES = times;
        BONUS_TIMES_VALUES = values;
    }

    /**
    * @dev Retrieve length of bonuses by amounts array
    * @return Bonuses by amounts array length
    */
    function bonusesForAmountsCount() public constant returns(uint) {
        return BONUS_AMOUNTS.length;
    }

    /**
    * @dev Sets bonuses for USD amounts
    */
    function setBonusesForAmounts(uint32[] amounts, uint32[] values) public onlyOwner {
        require(amounts.length == values.length);
        for (uint i = 0; i + 1 < amounts.length; i++) {
            require(amounts[i] > amounts[i+1]);
        }

        BONUS_AMOUNTS = amounts;
        BONUS_AMOUNTS_VALUES = values;
    }

    /**
    * @dev Overrided buyTokens method of parent Crowdsale contract  to provide bonus by changing and restoring rate variable
    * @param beneficiary walelt of investor to receive tokens
    */
    function buyTokens(address beneficiary) public payable {
        // Compute usd amount = wei * catsInEth * usdcentsInCat / usdcentsPerUsd / weisPerEth
        uint256 usdValue = msg.value.mul(rate).mul(tokenPriceInCents).div(100).div(1 ether); 
        
        // Compute time and amount bonus
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
