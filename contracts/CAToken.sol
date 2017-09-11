pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/StandardToken.sol";


contract CAToken is StandardToken, Ownable {
    
    // Metadata
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint256 public constant decimals = 18;
    string public constant version = "1.0";

    // Crowdsale parameters
    uint256 public constant catForBitClave = 1000 * (10**6) * 10**decimals; // 1 billion CAT reserved for BitClave use
    uint256 public constant catCreationCap = 2000 * (10**6) * 10**decimals; // 2 billion CAT total limit

    // Events
    event CreateCAT(address indexed receiver, uint256 value);

    // Constructor
    function CAToken(address catBitClaveDeposit) {
        createTokens(catBitClaveDeposit, catForBitClave);
    }

    function createTokens(address receiver, uint256 tokens) onlyOwner {
        totalSupply = SafeMath.add(totalSupply, tokens);
        require(totalSupply <= catCreationCap);

        balances[receiver] += tokens; 
        CreateCAT(receiver, tokens); 
    }
}
