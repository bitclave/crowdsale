pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./crowdsale/CappedCrowdsale.sol";
import "./CAToken.sol";


contract CATCrowdsale is FinalizableCrowdsale, CappedCrowdsale {
    uint256 public constant DECIMALS = 18;
    uint256 public constant CAP = 2 * (10**9) * 10**DECIMALS;  // 2MM CAT

    event WalletChange(address wallet);

    function CATCrowdsale(
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _initialRate,
        uint256 _endRate,
        uint256 _preferentialRate,
        address _wallet
    )
        CappedCrowdsale(CAP)
        WhitelistedCrowdsale()
        FinalizableCrowdsale()
        CrowdsaleRate(_initialRate, _endRate, _preferentialRate)
        Crowdsale(_startBlock, _endBlock, _initialRate, _wallet)
    {
        CAToken(token).pause();
    }

    function createTokenContract() internal returns(MintableToken) {
        return new CAToken();
    }

    // low level token purchase function
    function buyTokens(address beneficiary) payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;
        uint256 tokenAmount = getAmountToken(weiAmount);

        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, tokenAmount);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokenAmount);

        forwardFunds();
    }

    function setWallet(address _wallet) onlyOwner public {
        require(_wallet != 0x0);
        wallet = _wallet;
        WalletChange(_wallet);
    }

    function unpauseToken() onlyOwner {
        require(isFinalized);
        CAToken(token).unpause();
    }

    function pauseToken() onlyOwner {
        require(isFinalized);
        CAToken(token).pause();
    }
}
