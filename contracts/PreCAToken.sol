pragma solidity ^0.4.11;

import "./CAToken.sol";


/**
* @dev Main Bitcalve PreCAT token ERC20 contract
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
*/
contract PreCAToken is CAToken {

    // Metadata
    string public constant version = "1.0";

    // Destructor
    function kill() public onlyOwner {
        require(mintingFinished);
        selfdestruct(owner);
    }

}