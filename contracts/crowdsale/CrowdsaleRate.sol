pragma solidity ^0.4.11;

import "./WhitelistedCrowdsale.sol";


contract CrowdsaleRate is WhitelistedCrowdsale {
    // customize the rate for each whitelisted buyer
    mapping (address => uint256) public buyerRate;

    // price at which whitelisted buyers will be able to buy tokens
    uint256 public preferentialRate;

    // initial rate at which tokens are offered
    uint256 public initialRate;

    // end rate at which tokens are offered
    uint256 public endRate;

    event PreferentialRateChange(address indexed buyer, uint256 rate);
    event InitialRateChange(uint256 rate);
    event EndRateChange(uint256 rate);

    function CrowdsaleRate(
        uint256 _initialRate,
        uint256 _endRate,
        uint256 _preferentialRate
    ) {
        require(_initialRate > 0);
        require(_endRate > 0);
        require(_preferentialRate > 0);

        initialRate = _initialRate;
        endRate = _endRate;
        preferentialRate = _preferentialRate;
    }

    function setBuyerRate(address buyer, uint256 rate) onlyOwner public {
        require(block.number < startBlock);
        require(rate > 0);
        require(isWhitelisted(buyer));
        require(buyerRate[buyer] != rate);

        buyerRate[buyer] = rate;

        PreferentialRateChange(buyer, rate);
    }

    function setInitialRate(uint256 rate) onlyOwner public {
        require(block.number < startBlock);
        require(rate != 0);
        require(initialRate != rate);

        initialRate = rate;

        InitialRateChange(rate);
    }

    function setEndRate(uint256 rate) onlyOwner public {
        require(rate != 0);
        require(block.number < startBlock);
        require(endRate != rate);

        endRate = rate;

        EndRateChange(rate);
    }

    function getRate() returns(uint256) {
        // some early buyers are offered a discount on the crowdsale price
        if (buyerRate[msg.sender] != 0) {
            return buyerRate[msg.sender];
        }

        // whitelisted buyers can purchase at preferential price before crowdsale ends
        if (isWhitelisted(msg.sender)) {
            return preferentialRate;
        }

        // otherwise compute the price for the auction
        uint256 elapsed = block.number - startBlock;
        uint256 rateRange = initialRate - endRate;
        uint256 blockRange = endBlock - startBlock;

        return initialRate;

        return initialRate.sub(rateRange.mul(elapsed).div(blockRange));
    }
}
