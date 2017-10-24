pragma solidity ^0.4.11;

import "./BTLToken.sol";


/**
* @dev Main Bitcalve PreCAT token ERC20 contract
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
*/
contract CAToken is BTLToken {

    // Metadata
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint8 public constant decimals = 18;
    string public constant version = "1.0";

    // Destructor
    function kill() public onlyOwner {
        require(mintingFinished);
        selfdestruct(owner);
    }

}