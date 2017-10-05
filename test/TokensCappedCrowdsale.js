// // @flow
// 'use strict'
//
// const BigNumber = web3.BigNumber;
// const expect = require('chai').expect;
// const should = require('chai')
//     .use(require('chai-as-promised'))
//     .use(require('chai-bignumber')(web3.BigNumber))
//     .should();
//
// import ether from './helpers/ether';
// import {advanceBlock} from './helpers/advanceToBlock';
// import {increaseTimeTo, duration} from './helpers/increaseTime';
// import latestTime from './helpers/latestTime';
// import EVMThrow from './helpers/EVMThrow';
//
// const Crowdsale = artifacts.require('./TokensCappedCrowdsaleImpl.sol');
// const Token = artifacts.require('./MintableToken.sol');
//
// const tokenDecimals = 18;
//
// contract('TokensCappedCrowdsale', function ([_, wallet, wallet2, wallet3]) {
//
//     const startTime = latestTime() + duration.weeks(1);
//     const endTime = startTime + duration.weeks(1);
//     const afterEndTime = endTime + duration.seconds(1);
//
//     it('fails to create to many tokens', async function () {
//
//         await increaseTimeTo(startTime);
//
//         const crowdsale = await Crowdsale.new(startTime, endTime, 10**tokenDecimals, wallet, 1000 * (10**tokenDecimals));
//         const token = Token.at(await crowdsale.token.call());
//
//         // Fails to create too many tokens
//         await crowdsale.buyTokens(wallet2, {from: wallet2, value: 1500}).should.be.rejectedWith(EVMThrow);
//         const totalSupply = await token.totalSupply();
//         totalSupply.should.be.bignumber.equal(0);
//         const hasEnded = await crowdsale.hasEnded.call();
//         hasEnded.should.be.false;
//
//         // Create tokens to fill the cap
//         //await crowdsale.buyTokens2(wallet2, {from: wallet2, value: 1000});
//         //const totalSupply = await token.totalSupply();
//         //totalSupply.should.be.bignumber.equal(1000 * (10**tokenDecimals));
//         //const hasEnded = await crowdsale.hasEnded.call();
//         //hasEnded.should.be.bignumber.equal(true);
//
//         // Fails to create one more token
//         //await crowdsale.buyTokens(wallet2, {from: wallet2, value: 1}).should.be.rejectedWith(EVMThrow);
//
//         // // Fails to overflow uint256 type
//         // await token.createTokens(wallet2, new BigNumber(2)**256 - 1).should.be.rejectedWith(EVMThrow);
//     })
//
// })
