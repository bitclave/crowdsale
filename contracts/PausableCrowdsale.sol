pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";


// Crowdsale which can be paused by owner at any time
contract PausableCrowdsale is Crowdsale, Pausable {

    function PausableCrowdsale(bool _paused) {
        if (_paused) {
            pause();
        }
    }

    // overriding Crowdsale#validPurchase to add extra paused logic
    // @return true if investors can buy at the moment
    function validPurchase() internal constant returns(bool) {
        return super.validPurchase() && !paused;
    }

}