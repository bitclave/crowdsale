// @flow
'use strict'

const expect = require('chai').expect

const { advanceToBlock, ether, should, EVMThrow } = require('./utils')
const Crowdsale = artifacts.require('./TokensCappedCrowdsaleImpl.sol')
const Token = artifacts.require('./CAToken.sol')

const BigNumber = web3.BigNumber
const tokenDecimals = 18

contract('TokensCappedCrowdsale', function ([_, wallet, wallet2, wallet3]) {

    const startDate = web3.eth.getBlock('latest').timestamp;
    const endDate = startDate + 3600*1000;

    it('fails to create to many tokens', async function () {

        const crowdsale = await Crowdsale.new(startDate, endDate, 10**tokenDecimals, wallet, 1000 * (10**tokenDecimals));
        const token = Token.at(await crowdsale.token.call());

        // Fails to create too many tokens
        await crowdsale.buyTokens(wallet2, {from: wallet2, value: 1500}).should.be.rejectedWith(EVMThrow);
        const totalSupply = await token.totalSupply();
        totalSupply.should.be.bignumber.equal(0);
        const hasEnded = await crowdsale.hasEnded.call();
        hasEnded.should.be.false;

        // Create tokens to fill the cap
        await crowdsale.buyTokens2(wallet2, {from: wallet2, value: 1000});
        //const totalSupply = await token.totalSupply();
        //totalSupply.should.be.bignumber.equal(1000 * (10**tokenDecimals));
        //const hasEnded = await crowdsale.hasEnded.call();
        //hasEnded.should.be.bignumber.equal(true);

        // Fails to create one more token
        //await crowdsale.buyTokens(wallet2, {from: wallet2, value: 1}).should.be.rejectedWith(EVMThrow);

        // // Fails to overflow uint256 type
        // await token.createTokens(wallet2, new BigNumber(2)**256 - 1).should.be.rejectedWith(EVMThrow);
    })

})