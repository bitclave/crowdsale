pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./TokensCappedCrowdsale.sol";
import "./PausibleCrowdsale.sol";
import "./CAToken.sol";


contract CATCrowdsale is Ownable, TokensCappedCrowdsale(CATCrowdsale.CAP), PausibleCrowdsale(true) {

    // Constants
    uint256 public constant DECIMALS = 18;
    uint256 public constant CAP = 2 * (10**9) * (10**DECIMALS);                // 2B CAT
    uint256 public constant BITCLAVE_AMOUNT = 1 * (10**9) * (10**DECIMALS);    // 1B CAT
    uint256 public constant PRESALED_AMOUNT = 150 * (10**6) * (10**DECIMALS);  // 150M CAT

    //uint256 public startTime;
    //uint256 public endTime;

    // Events
    event TokenMint(address indexed beneficiary, uint256 amount);
    event WalletChange(address wallet);
    event RateChange(uint256 rate);

    // Constructor
    function CATCrowdsale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet,
        address _bitClaveWallet,
        address _presaledWallet
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        mintTokens(_bitClaveWallet, BITCLAVE_AMOUNT);
        mintTokens(_presaledWallet, PRESALED_AMOUNT);
    }

    // Overrided methods

    function createTokenContract() internal returns(MintableToken) {
        return new CAToken();
    }

    // Owner methods

    function mintTokens(address beneficiary, uint256 tokens) public onlyOwner {
        require(beneficiary != 0x0);
        //TODO: uncomment
        //require(token.totalSupply() <= tokensCap);
        //require(now >= startTime && now <= endTime);

        token.mint(beneficiary, tokens);
        TokenMint(beneficiary, tokens);
    }

    function setWallet(address _wallet) external onlyOwner {
        require(_wallet != 0x0);
        wallet = _wallet;
        WalletChange(_wallet);
    }

    function setRate(uint256 _rate) external onlyOwner {
        require(_rate != 0x0);
        rate = _rate;
        RateChange(_rate);
    }

}
