pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./CAToken.sol";
import "./CATCrowdsale.sol";


/**
* @dev Main Bitcalve CAT token ERC20 contract
* Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
* 
*/
contract PreCAToken is CAToken {
    
    // Metadata
    string public constant symbol = "CAT";
    string public constant name = "Consumer Activity Token";
    uint8 public constant decimals = 18;
    string public constant version = "1.0";
    uint256 public constant cap = 2 * (10 ** 9) * (10 ** uint256(decimals));

    // Variables
    CAToken realToken;
    address[] holders;
    uint256 holdersMigrated;

    // Events
    event Migrated();

    // Constructor
    function PreCAToken() public {
        pause();
    }

    // Migration work after minting finished and tokens are still paused
    function migrateHolders(uint count) public onlyOwner {
        require(mintingFinished);
        require(holdersMigrated + count <= holders.length);

        // Create final token for migration
        if (realToken == address(0)) {
            realToken = new CAToken();
            realToken.pause();
        }

        for (uint i = 0; i < count; i++) {
            address holder = holders[holdersMigrated + i];
            realToken.mint(holder, balanceOf(holder));
        }
        holdersMigrated += count;

        if (holdersMigrated == holders.length) {
            realToken.finishMinting();
            realToken.unpause();
            realToken.transferOwnership(owner);
            Migrated();
            selfdestruct(owner);
        }
    }

    // Mint tokens
    function mint(address _to, uint256 _amount) onlyOwner canMint returns (bool) {
        require(_amount > 0);
        super.mint(_to, _amount);
        holders.push(_to);
    }

    // Deny unpause for pretokens
    function unpause() onlyOwner whenPaused public {
        // Do nothing
    }

}
