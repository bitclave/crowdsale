pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/PausableToken.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";


contract CAToken is PausableToken, MintableToken {
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint256 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 2 * (10**9) * 10**decimals;  // 2MM CAT

    function CAToken() {
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }
}
