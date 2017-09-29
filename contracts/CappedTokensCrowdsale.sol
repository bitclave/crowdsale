pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";


// Crowdsale capped by number of minted tokens
contract CappedTokensCrowdsale is Crowdsale {

    uint256 public tokensCap;

    function CappedTokensCrowdsale(uint256 _tokensCap) {
        require(_tokensCap > 0);
        tokensCap = _tokensCap;
    }

    modifier validPurchaseModifier {
        _;
        require(validPurchase());
    }

    // overriding Crowdsale#buyTokens to add modifier validPurchaseModifier
    function buyTokens(address beneficiary) public payable validPurchaseModifier {
        super.buyTokens(beneficiary);
    }

    // overriding Crowdsale#validPurchase to add extra tokens cap logic
    // @return true if investors can buy at the moment
    function validPurchase() internal constant returns (bool) {
        bool withinCap = token.totalSupply() <= tokensCap;
        return super.validPurchase() && withinCap;
    }

    // overriding Crowdsale#hasEnded to add tokens cap logic
    // @return true if crowdsale event has ended
    function hasEnded() public constant returns (bool) {
        bool capReached = token.totalSupply() >= tokensCap;
        return super.hasEnded() || capReached;
    }

}