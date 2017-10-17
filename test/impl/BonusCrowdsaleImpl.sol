pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "../../contracts/BonusCrowdsale.sol";


contract BonusCrowdsaleImpl is Crowdsale, BonusCrowdsale {

    function BonusCrowdsaleImpl(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
        BonusCrowdsale(10, 18) // $0.10, 18 decimals
    {
        BONUS_TIMES = [
            1 hours,
            1 days,
            7 days,
            30 days,
            45 days,
            60 days
        ];

        BONUS_TIMES_VALUES = [
            150,
            100,
            70,
            50,
            20,
            0
        ];

        BONUS_AMOUNTS = [
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

        BONUS_AMOUNTS_VALUES = [
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
    }

}
