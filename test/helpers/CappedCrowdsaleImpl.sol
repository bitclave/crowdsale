pragma solidity ^0.4.11;

import '../../contracts/crowdsale/CappedCrowdsale.sol';


contract CappedCrowdsaleImpl is CappedCrowdsale {
    function CappedCrowdsaleImpl (
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _initialRate,
        uint256 _endRate,
        uint256 _preferentialRate,
        uint256 _ethRate,
        uint256 _cap,
        address _wallet
    )
        Crowdsale(_startBlock, _endBlock, _initialRate, _wallet)
        CrowdsaleRate(_initialRate, _endRate, _preferentialRate, _ethRate)
        CappedCrowdsale(_cap)
    {
    }

    function getAmountTokenImpl(uint256 weiAmount) returns(uint256) {
        return getAmountToken(weiAmount);
    }

    function addTokensImpl(address beneficiary, uint256 tokenAmount) {
        token.mint(beneficiary, tokenAmount);
    }
}
