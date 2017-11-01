pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";


/**
* @dev Parent crowdsale contract extended with support for pausable crowdsale, meaning crowdsale can be paused by owner at any time
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
* 
* While the contract is in paused state, the contributions will be rejected
* 
*/
contract PausableCrowdsale is Crowdsale, Pausable {

    function PausableCrowdsale(bool _paused) public {
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