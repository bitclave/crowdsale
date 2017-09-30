pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";


// Crowdsale which can be paused by owner at any time
contract PausableCrowdsale is Ownable, Crowdsale {

    bool public paused;

    event PausedChanged(bool _paused);

    function PausableCrowdsale(bool _paused) {
        paused = _paused;
    }

    function setPaused(bool _paused) public onlyOwner {
        require(paused != _paused);
        paused = _paused;
        PausedChanged(_paused);
    }

    // overriding Crowdsale#validPurchase to add extra paused logic
    // @return true if investors can buy at the moment
    function validPurchase() internal constant returns(bool) {
        return super.validPurchase() && !paused;
    }

}