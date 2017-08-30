pragma solidity ^0.4.11;

import '../../contracts/crowdsale/CrowdsaleRate.sol';


contract CrowdsaleRateImpl is CrowdsaleRate {
    function CrowdsaleRateImpl (
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _initialRate,
        uint256 _endRate,
        uint256 _preferentialRate,
        address _wallet
    )
        Crowdsale(_startBlock, _endBlock, _initialRate, _wallet)
        CrowdsaleRate(_initialRate, _endRate, _preferentialRate)
    {
    }
}
