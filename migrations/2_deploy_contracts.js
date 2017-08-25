var CAToken = artifacts.require("./CAToken.sol");

module.exports = function(deployer) {
  	deployer.deploy(CAToken);
};
