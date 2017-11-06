pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";


/**
* @dev Pre main Bitcalve CAT token ERC20 contract
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
*/
contract CAToken is MintableToken, PausableToken {
    
    // Metadata
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint8 public constant decimals = 18;
    string public constant version = "2.0";

    /**
    * @dev Override MintableTokenn.finishMinting() to add canMint modifier
    */
    function finishMinting() onlyOwner canMint public returns(bool) {
        return super.finishMinting();
    }

}
