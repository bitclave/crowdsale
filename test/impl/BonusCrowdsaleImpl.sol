pragma solidity ^0.4.11;

//import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
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
    }

}
