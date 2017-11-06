pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";
import "./TokensCappedCrowdsale.sol";
import "./PausableCrowdsale.sol";
import "./BonusCrowdsale.sol";
import "./PreCAToken.sol";


  /**
   * @dev Main BitCalve Crowdsale contract. 
   * Based on references from OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity
   * 
   */
contract CATCrowdsale is FinalizableCrowdsale, TokensCappedCrowdsale(CATCrowdsale.CAP), PausableCrowdsale(true), BonusCrowdsale(CATCrowdsale.TOKEN_USDCENT_PRICE) {

    // Constants
    uint256 public constant DECIMALS = 18;
    uint256 public constant CAP = 2 * (10**9) * (10**DECIMALS);              // 2B CAT
    uint256 public constant BITCLAVE_AMOUNT = 1 * (10**9) * (10**DECIMALS);  // 1B CAT
    uint256 public constant TOKEN_USDCENT_PRICE = 10;                        // $0.10

    // Variables
    address public remainingTokensWallet;
    address public presaleWallet;

    /**
    * @dev Sets CAT to Ether rate. Will be called multiple times durign the crowdsale to adjsut the rate
    * since CAT cost is fixed in USD, but USD/ETH rate is changing
    * @param _rate defines CAT/ETH rate: 1 ETH = _rate CATs
    */
    function setRate(uint256 _rate) external onlyOwner {
        require(_rate != 0x0);
        rate = _rate;
        RateChange(_rate);
    }

    /**
    * @dev Allows to adjust the crowdsale end time
    */
    function setEndTime(uint256 _endTime) external onlyOwner {
        require(!isFinalized);
        require(_endTime >= startTime);
        require(_endTime >= now);
        endTime = _endTime;
    }

    /**
    * @dev Sets the wallet to forward ETH collected funds
    */
    function setWallet(address _wallet) external onlyOwner {
        require(_wallet != 0x0);
        wallet = _wallet;
    }

    /**
    * @dev Sets the wallet to hold unsold tokens at the end of ICO
    */
    function setRemainingTokensWallet(address _remainingTokensWallet) external onlyOwner {
        require(_remainingTokensWallet != 0x0);
        remainingTokensWallet = _remainingTokensWallet;
    }

    // Events
    event RateChange(uint256 rate);

    /**
    * @dev Contructor
    * @param _startTime startTime of crowdsale
    * @param _endTime endTime of crowdsale
    * @param _rate CAT / ETH rate
    * @param _wallet wallet to forward the collected funds
    * @param _remainingTokensWallet wallet to hold the unsold tokens
    * @param _bitClaveWallet wallet to hold the initial 1B tokens of BitClave
    */
    function CATCrowdsale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet,
        address _remainingTokensWallet,
        address _bitClaveWallet
    ) public
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        remainingTokensWallet = _remainingTokensWallet;
        presaleWallet = this;

        // allocate tokens to BitClave
        mintTokens(_bitClaveWallet, BITCLAVE_AMOUNT);
    }

    // Overrided methods

    /**
    * @dev Creates token contract for ICO
    * @return ERC20 contract associated with the crowdsale
    */
    function createTokenContract() internal returns(MintableToken) {
        PreCAToken token = new PreCAToken();
        token.pause();
        return token;
    }

    /**
    * @dev Finalizes the crowdsale
    */
    function finalization() internal {
        super.finalization();

        // Mint tokens up to CAP
        if (token.totalSupply() < tokensCap) {
            uint tokens = tokensCap.sub(token.totalSupply());
            token.mint(remainingTokensWallet, tokens);
        }

        // disable minting of CATs
        token.finishMinting();

        // take onwership over CAToken contract
        token.transferOwnership(owner);
    }

    // Owner methods

    /**
    * @dev Helper to Pause CAToken
    */
    function pauseTokens() public onlyOwner {
        PreCAToken(token).pause();
    }

    /**
    * @dev Helper to UnPause CAToken
    */
    function unpauseTokens() public onlyOwner {
        PreCAToken(token).unpause();
    }

    /**
    * @dev Allocates tokens from preSale to a special wallet. Called once as part of crowdsale setup
    */
    function mintPresaleTokens(uint256 tokens) public onlyOwner {
        mintTokens(presaleWallet, tokens);
        presaleWallet = 0;
    }

    /**
    * @dev Transfer presaled tokens even on paused token contract
    */
    function transferPresaleTokens(address destination, uint256 amount) public onlyOwner {
        unpauseTokens();
        token.transfer(destination, amount);
        pauseTokens();
    }

    // 
    /**
    * @dev Allocates tokens for investors that contributed from website. These include
    * whitelisted investors and investors paying with BTC/QTUM/LTC
    */
    function mintTokens(address beneficiary, uint256 tokens) public onlyOwner {
        require(beneficiary != 0x0);
        require(tokens > 0);
        require(now <= endTime);                               // Crowdsale (without startTime check)
        require(!isFinalized);                                 // FinalizableCrowdsale
        require(token.totalSupply().add(tokens) <= tokensCap); // TokensCappedCrowdsale
        
        token.mint(beneficiary, tokens);
    }

}
