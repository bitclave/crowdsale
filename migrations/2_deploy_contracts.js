const CATCrowdsale = artifacts.require("CATCrowdsale");

module.exports = function(deployer) {
    //constructor arguments only for demo! You should be used real data for deploy
	deployer.deploy(CATCrowdsale, 1571097600, 1671097600, 3000, '0x06E58BD5DeEC639d9a79c9cD3A653655EdBef820', '0x06E58BD5DeEC639d9a79c9cD3A653655EdBef820', '0x06E58BD5DeEC639d9a79c9cD3A653655EdBef820');
};
