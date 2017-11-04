pragma solidity ^0.4.11;

//import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../contracts/BonusCrowdsale.sol";


contract BonusCrowdsaleImplToken is MintableToken {

    // Metadata
    string public constant symbol = "TMP";
    string public constant name = "Test token";
    uint8 public constant decimals = 18;
    string public constant version = "1.0";

}

contract BonusCrowdsaleImpl is Crowdsale, BonusCrowdsale {

    function BonusCrowdsaleImpl(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _rate,
        address _wallet
    )
        Crowdsale(_startTime, _endTime, _rate, _wallet)
        BonusCrowdsale(10) // $0.10
    {
    }

    function createTokenContract() internal returns(MintableToken) {
        return new BonusCrowdsaleImplToken();
    }

}
