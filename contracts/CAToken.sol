pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/PausableToken.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";


contract CAToken is PausableToken, MintableToken {
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint256 public constant decimals = 18;
}
