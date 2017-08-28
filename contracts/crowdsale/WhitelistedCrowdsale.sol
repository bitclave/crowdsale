pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


/**
 * @title WhitelistedCrowdsale
 * @dev Extension of Crowsdale where an owner can whitelist addresses
 * which can buy in crowdsale before it opens to the public 
 */
contract WhitelistedCrowdsale is Crowdsale, Ownable {
    using SafeMath for uint256;

    // list of addresses that can purchase before crowdsale opens
    mapping (address => bool) public whitelist;

    function addToWhitelist(address _buyer) public onlyOwner {
        require(_buyer != 0x0);
        require(whitelist[_buyer] == false);

        whitelist[_buyer] = true;
    }

    function removeFromWhitelist(address _buyer) public onlyOwner {
        require(_buyer != 0x0);
        require(whitelist[_buyer] == true);

        delete whitelist[_buyer];
    }

    // @return true if buyer is whitelisted
    function isWhitelisted(address _buyer) public constant returns (bool) {
        return whitelist[_buyer];
    }

    // overriding Crowdsale#validPurchase to add whitelist logic
    // @return true if buyers can buy at the moment
    function validPurchase() internal constant returns (bool) {
        // [TODO] issue with overriding and associativity of logical operators
        return super.validPurchase() || (!hasEnded() && isWhitelisted(msg.sender)); 
    }
}
