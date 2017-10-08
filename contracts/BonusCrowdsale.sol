pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


// Crowdsale which can give time and amount bonuses
contract BonusCrowdsale is Crowdsale, Ownable {

    // Constants (some kind of)
    uint[] public BONUS_TIMES;
    uint[] public BONUS_TIMES_VALUES;
    uint[] public BONUS_AMOUNTS;
    uint[] public BONUS_AMOUNTS_VALUES;
    uint public constant BONUS_COEFF = 1000; // Values should be 10x percents, values from 0 to 1000
    
    // Members
    uint public tokenPrice;
    uint public tokenDecimals;

    // Constructor
    function BonusCrowdsale(uint256 _tokenPrice, uint256 _tokenDecimals) {
        tokenPrice = _tokenPrice;
        tokenDecimals = _tokenDecimals;
    }

    // Overrided buyTokens method to provide bonus by changing and restoring rate variable
    function buyTokens(address beneficiary) public payable {
        require(BONUS_TIMES.length > 0 || BONUS_AMOUNTS.length > 0);
        require(BONUS_TIMES.length == BONUS_TIMES_VALUES.length);
        require(BONUS_AMOUNTS.length == BONUS_AMOUNTS_VALUES.length);

        uint256 usdValue = msg.value.mul(rate).mul(tokenPrice).div(100).div(10 ** tokenDecimals); 
        uint256 bonus = computeBonus(usdValue);

        uint256 oldRate = rate;
        rate = rate.mul(BONUS_COEFF.add(bonus)).div(BONUS_COEFF);
        super.buyTokens(beneficiary);
        rate = oldRate;
    }

    function computeBonus(uint256 usdValue) public constant returns(uint256) {
        return computeAmountBonus(usdValue).add(computeTimeBonus());
    }

    function computeTimeBonus() public constant returns(uint256) {
        require(now >= startTime);

        for (uint i = 0; i < BONUS_TIMES.length; i++) {
            if (now.sub(startTime) <= BONUS_TIMES[i]) {
                return BONUS_TIMES_VALUES[i];
            }
        }

        return 0;
    }

    function computeAmountBonus(uint256 usdValue) public constant returns(uint256) {
        for (uint i = 0; i < BONUS_AMOUNTS.length; i++) {
            if (usdValue >= BONUS_AMOUNTS[i]) {
                return BONUS_AMOUNTS_VALUES[i];
            }
        }

        return 0;
    }

}
