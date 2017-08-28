pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import './CrowdsaleRate.sol';


/**
 * @title CappedCrowdsale
 * @dev Extension of Crowsdale with a max amount of funds raised
 */
contract CappedCrowdsale is CrowdsaleRate {
    using SafeMath for uint256;

    uint256 public cap;

    function CappedCrowdsale(uint256 _cap) {
        require(_cap > 0);
        cap = _cap;
    }

    // overriding Crowdsale#validPurchase to add extra cap logic
    // @return true if investors can buy at the moment
    function validPurchase() internal constant returns (bool) {
        uint256 totalSupply = token.totalSupply();
        uint256 amountToken = getAmountToken(msg.value);
        uint256 updatedTotalSupply = totalSupply.add(amountToken);

        return super.validPurchase() && updatedTotalSupply <= cap;
    }

    // overriding Crowdsale#hasEnded to add cap logic
    // @return true if crowdsale event has ended
    function hasEnded() public constant returns (bool) {
        bool capReached = weiRaised >= cap;
        return super.hasEnded() || capReached;
    }

    function getAmountToken(uint256 weiAmount) internal returns(uint256) {
        uint256 rate = getRate();
        return weiAmount.mul(rate);
    }
}
