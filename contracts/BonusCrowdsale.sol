pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


// Crowdsale which can give time and amount bonuses
contract BonusCrowdsale is Crowdsale, Ownable {

    uint[] public BONUS_TIMES;
    uint[] public BONUS_TIMES_VALUES;
    uint[] public BONUS_AMOUNTS;
    uint[] public BONUS_AMOUNTS_VALUES;
    uint public constant BONUS_KOEF = 1000; // Values should be 10x percents, values from 0 to 1000

    bool public bonusesEnabled = false;
    uint256 public bonusStartTime;

    event BonusesEnabled();

    function setBonusesEnabled(bool _bonusesEnabled) public onlyOwner {
        require(bonusesEnabled != _bonusesEnabled);
        bonusesEnabled = _bonusesEnabled;
        if (bonusesEnabled) {
            BonusesEnabled();
        }
    }

    function setBonusStartTime(uint256 _bonusStartTime) public onlyOwner {
        bonusStartTime = _bonusStartTime;
    }
    
    function BonusCrowdsale(uint256 _bonusStartTime) {
        bonusStartTime = _bonusStartTime;
    }

    function buyTokens(address beneficiary) public payable {
        if (!bonusesEnabled) {
            super.buyTokens(beneficiary);
            return;
        }

        require(BONUS_TIMES.length > 0 || BONUS_AMOUNTS.length > 0);
        require(BONUS_TIMES.length == BONUS_TIMES_VALUES.length);
        require(BONUS_AMOUNTS.length == BONUS_AMOUNTS_VALUES.length);

        uint256 bonus = computeBonus(msg.value.mul(oldRate));

        uint256 oldRate = rate;
        rate = rate * BONUS_KOEF / (BONUS_KOEF + bonus);
        super.buyTokens(beneficiary);
        rate = oldRate;
    }

    function computeBonus(uint256 usdValue) public returns(uint256) {
        if (bonusesEnabled) {
            return computeAmountBonus(usdValue) + computeTimeBonus();
        }
        return 0;
    }

    function computeTimeBonus() public returns(uint256) {
        require(now >= bonusStartTime);

        if (bonusesEnabled) {
            for (uint i = 0; i < BONUS_TIMES.length; i++) {
                if (now - bonusStartTime <= BONUS_TIMES[i]) {
                    return BONUS_TIMES_VALUES[i];
                }
            }
        }

        return 0;
    }

    function computeAmountBonus(uint256 usdValue) public returns(uint256) {
        if (bonusesEnabled) {
            for (uint i = 0; i < BONUS_AMOUNTS.length; i++) {
                if (usdValue >= BONUS_AMOUNTS[i]) {
                    return BONUS_AMOUNTS_VALUES[i];
                }
            }
        }

        return 0;
    }

}