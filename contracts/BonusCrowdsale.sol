pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


// Crowdsale which can be paused by owner at any time
contract BonusCrowdsale is Crowdsale, Ownable {

    uint[] public TIMES;
    uint[] public TIMES_BONUSES;
    uint[] public AMOUNTS;
    uint[] public AMOUNTS_BONUSES;
    uint public constant BONUS_KOEF = 1000;
    
    function BonusCrowdsale() {
        TIMES = [
            1 hours,
            1 days,
            7 days,
            30 days,
            45 days,
            60 days
        ];

        TIMES_BONUSES = [
            150,
            100,
            70,
            50,
            20,
            0
        ];

        AMOUNTS = [
            900000,
            600000,
            450000,
            300000,
            225000,
            150000,
            90000,
            60000,
            45000,
            30000,
            22500,
            15000,
            9000,
            6000,
            4500,
            3000,
            2100,
            1500,
            900,
            600,
            300
        ];

        AMOUNTS_BONUSES = [
            130,
            120,
            110,
            100,
            90,
            80,
            70,
            65,
            60,
            55,
            50,
            45,
            40,
            35,
            30,
            25,
            20,
            15,
            10,
            5,
            0
        ];

        require(TIMES.length == TIMES_BONUSES.length);
        require(AMOUNTS.length == AMOUNTS_BONUSES.length);
    }

    function buyTokens(address beneficiary) public payable {
        uint256 bonus = computeBonus(msg.value.mul(oldRate));

        uint256 oldRate = rate;
        rate = rate * BONUS_KOEF / (BONUS_KOEF + bonus);
        super.buyTokens(beneficiary);
        rate = oldRate;
    }

    function computeBonus(uint256 usdValue) public returns(uint256) {
        return computeAmountBonus(usdValue) + computeTimeBonus();
    }

    function computeTimeBonus() public returns(uint256) {
        require(now >= startTime);

        for (uint i = 0; i < TIMES.length; i++) {
            if (now - startTime <= TIMES[i]) {
                return TIMES_BONUSES[i];
            }
        }

        return 0;
    }

    function computeAmountBonus(uint256 usdValue) public returns(uint256) {
        for (uint i = 0; i < AMOUNTS.length; i++) {
            if (usdValue >= AMOUNTS[i]) {
                return AMOUNTS_BONUSES[i];
            }
        }

        return 0;
    }

}