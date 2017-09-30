pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../contracts/TokensCappedCrowdsale.sol";
import "../../contracts/CAToken.sol";

// Crowdsale capped by number of minted tokens
contract TokensCappedCrowdsaleImpl is Crowdsale, TokensCappedCrowdsale {

    function TokensCappedCrowdsaleImpl(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet,
        uint256 _tokensCap
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
        TokensCappedCrowdsale(_tokensCap)
    {
    }

    function createTokenContract() internal returns(MintableToken) {
        return new CAToken();
    }

      // low level token purchase function
    function buyTokens2(address beneficiary) public payable {
        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 weiAmount = msg.value;

        // calculate token amount to be created
        uint256 tokens = weiAmount.mul(rate);

        // update state
        weiRaised = weiRaised.add(weiAmount);

        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

        forwardFunds();
    }

}