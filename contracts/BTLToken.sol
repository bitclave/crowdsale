pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";


/**
* @dev Pre main Bitcalve BTL token ERC20 contract
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
* 
*/
contract BTLToken is MintableToken, PausableToken {
    
    // Metadata
    string public constant symbol = "BTL";
    string public constant name = "BitClave Token";
    uint8 public constant decimals = 18;
    string public constant version = "1.0";

    /**
    * @dev Override MintableTokenn.finishMinting() to add canMint modifier
    */
    function finishMinting() onlyOwner canMint public returns(bool) {
        return super.finishMinting();
    }

}
