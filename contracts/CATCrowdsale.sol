pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./CAToken.sol";


contract CATCrowdsale is CappedCrowdsale, Ownable {

    // Constants
    uint256 public constant DECIMALS = 18;
    uint256 public constant CAP = 2 * (10**9) * 10**DECIMALS;                // 2MM CAT
    uint256 public constant BITCLAVE_AMOUNT = 1 * (10**9) * 10**DECIMALS;    // 1MM CAT
    uint256 public constant PRESALED_AMOUNT = 150 * (10**6) * 10**DECIMALS;  // 150M CAT

    // amount of raised money in BTC
    uint256 public btcRaised;
    // amount of raised money in QTUM
    uint256 public qtumRaised;

    // Events
    event TokenPurchaseBTC(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event TokenPurchaseQTUM(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
    event WalletChange(address wallet);
    event RateUpdate(uint256 rate);

    // Constructor
    function CATCrowdsale(
        address _wallet,
        address _bitClaveWallet,
        address _presaledWallet,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate
    )
        CappedCrowdsale(CAP)
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        mintTokens(_bitClaveWallet, BITCLAVE_AMOUNT);
        mintTokens(_presaledWallet, PRESALED_AMOUNT);
    }

    // Overrided methods

    function createTokenContract() internal returns(MintableToken) {
        return new CAToken();
    }

    // Added methods

    function mintTokens(address beneficiary, uint256 tokens) internal onlyOwner {
        require(beneficiary != 0x0);
        token.mint(beneficiary, tokens);
    }

    function mintTokensForBTC(address beneficiary, uint256 value, uint256 tokens) external onlyOwner {
        btcRaised += value;
        mintTokens(beneficiary, tokens);
        TokenPurchaseBTC(
            msg.sender,
            beneficiary,
            value,
            tokens
        );
    }

    function mintTokensForQTUM(address beneficiary, uint256 value, uint256 tokens) external onlyOwner {
        qtumRaised += value;
        mintTokens(beneficiary, tokens);
        TokenPurchaseQTUM(
            msg.sender,
            beneficiary,
            value,
            tokens
        );
    }

    function setWallet(address _wallet) external onlyOwner {
        require(_wallet != 0x0);
        wallet = _wallet;
        WalletChange(_wallet);
    }

    function setRate(uint256 _rate) external onlyOwner {
        require(_rate != 0x0);
        rate = _rate;
        RateUpdate(_rate);
    }

}
