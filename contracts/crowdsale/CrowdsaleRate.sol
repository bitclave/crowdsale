pragma solidity ^0.4.11;

import "./WhitelistedCrowdsale.sol";


contract CrowdsaleRate is WhitelistedCrowdsale {
    uint256 public constant DECIMALS = 18;

    // customize the rate for each whitelisted buyer
    mapping (address => uint256) public buyerRate;

    // price at which whitelisted buyers will be able to buy tokens
    uint256 public preferentialRate;

    // initial rate at which tokens are offered
    uint256 public initialRate;

    // end rate at which tokens are offered
    uint256 public endRate;

    // rate 1 eth to usd
    uint256 public ethRate;

    event PreferentialRateChange(address indexed buyer, uint256 rate);
    event InitialRateChange(uint256 rate);
    event EndRateChange(uint256 rate);
    event EthRateChange(uint256 rate);

    function CrowdsaleRate(
        uint256 _initialRate,
        uint256 _endRate,
        uint256 _preferentialRate,
        uint256 _ethRate
    ) {
        require(_initialRate > 0);
        require(_endRate > 0);
        require(_preferentialRate > 0);
        require(_ethRate > 0);

        initialRate = _initialRate;
        endRate = _endRate;
        preferentialRate = _preferentialRate;
        ethRate = _ethRate;
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

    function setEthRate(uint256 rate) onlyOwner public {
        require(rate != 0);
        require(ethRate != rate);

        ethRate = rate;

        EthRateChange(rate);
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

        uint256 tmp = rateRange.mul(elapsed).div(blockRange);
        return initialRate.sub(tmp).mul(ethRate);
    }

    function getRateFor1Eth() returns(uint256) {
        uint256 rate = getRate();
        uint256 decimals = 10**DECIMALS;
        return ethRate.div(rate).mul(decimals);
    }
}
