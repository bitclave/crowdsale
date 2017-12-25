pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";


/**
 * @title MintableMasterToken token
 * @dev Simple ERC20 Token example, with mintable token creation
 * @dev Issue: * https://github.com/OpenZeppelin/zeppelin-solidity/issues/120
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */

contract MintableMasterToken is MintableToken {
    event MintMasterTransferred(address indexed previousMaster, address indexed newMaster);
    address public mintMaster;

    modifier onlyMintMasterOrOwner() {
        require(msg.sender == mintMaster || msg.sender == owner);
        _;
    }

    function MintableMasterToken() {
        mintMaster = msg.sender;
    }

    function transferMintMaster(address newMaster) onlyOwner public {
        require(newMaster != address(0));
        MintMasterTransferred(mintMaster, newMaster);
        mintMaster = newMaster;
    }

    /**
     * @dev Function to mint tokens
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _amount) onlyMintMasterOrOwner canMint public returns (bool) {
        address oldOwner = owner;
        owner = msg.sender;

        bool result = super.mint(_to, _amount);

        owner = oldOwner;

        return result;
    }

}
