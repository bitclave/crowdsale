var CAToken = artifacts.require("CAToken");

module.exports = function(deployer) {
	deployer.deploy(CAToken);
};
