pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "../../contracts/TokensCappedCrowdsale.sol";


contract TokensCappedCrowdsaleImpl is Crowdsale, TokensCappedCrowdsale {

    function TokensCappedCrowdsaleImpl(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet,
        uint256 _tokensCap
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
        TokensCappedCrowdsale(_tokensCap)
    {
    }

}
