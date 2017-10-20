pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../contracts/PausableCrowdsale.sol";


contract PausableCrowdsaleImplUnpaused is Crowdsale, PausableCrowdsale(false) {

    function PausableCrowdsaleImplUnpaused(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
    }

}