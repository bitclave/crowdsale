pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";


contract CAToken is MintableToken {
    
    // Metadata
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint256 public constant decimals = 18;
    string public constant version = "1.0";

}
