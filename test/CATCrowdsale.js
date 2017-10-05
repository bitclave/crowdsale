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
//
// import ether from './helpers/ether';
// import {advanceBlock} from './helpers/advanceToBlock';
// import {increaseTimeTo, duration} from './helpers/increaseTime';
// import latestTime from './helpers/latestTime';
// import EVMThrow from './helpers/EVMThrow';
//
// const Crowdsale = artifacts.require('./CATCrowdsale.sol');
// const Token = artifacts.require('./CAToken.sol');
//
// const tokenDecimals = 18;
// const tokensForOwner = 1 * (10**9);
// const tokensForPresale = 150 * (10**6);
//
// contract('CATCrowdsale', function ([_, wallet, bitClaveWallet, presaleWallet, wallet2, wallet3]) {
//
//     before(async function() {
//         //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
//         await advanceBlock()
//     })
//
//     beforeEach(async function () {
//         this.startTime = latestTime() + duration.weeks(1);
//         this.endTime =   this.startTime + duration.weeks(1);
//         this.afterEndTime = this.endTime + duration.seconds(1)
//     })
//
//     it('creates 1 billion of tokens for its creator', async function () {
//
//         const crowdsale = await Crowdsale.new(this.startTime, this.endTime, 10**tokenDecimals, wallet, bitClaveWallet, presaleWallet);
//         const token = Token.at(await crowdsale.token.call());
//         await crowdsale.setPaused(false);
//
//         const event = crowdsale.TokenMint({_from:web3.eth.coinbase}, {fromBlock: 0});
//         const promise = new Promise(resolve => event.watch(async function(error, response) {
//
//             // Check supply
//             const totalSupply = await token.totalSupply();
//             totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale) * (10**tokenDecimals));
//
//             if (response.args.beneficiary == bitClaveWallet) {
//                 // Check event arguments
//                 response.args.amount.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));
//
//                 // Check balace
//                 const balance = await token.balanceOf(bitClaveWallet);
//                 balance.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));
//             }
//             else if (response.args.beneficiary == presaleWallet) {
//                 // Check event arguments
//                 response.args.amount.should.be.bignumber.equal(tokensForPresale * (10**tokenDecimals));
//
//                 // Check balace
//                 const balance = await token.balanceOf(presaleWallet);
//                 balance.should.be.bignumber.equal(tokensForPresale * (10**tokenDecimals));
//
//                 event.stopWatching();
//                 resolve();
//             }
//             else {
//                 assert(false);
//             }
//
//         }));
//
//         await promise;
//     })
//
//     it('creates tokens when creator asks', async function () {
//
//         const crowdsale = await Crowdsale.new(this.startTime, this.endTime, 10**tokenDecimals, wallet, bitClaveWallet, presaleWallet);
//         const token = Token.at(await crowdsale.token.call());
//         await crowdsale.setPaused(false);
//
//         {
//             // Create 700 CAT for wallet2
//             await crowdsale.buyTokens(wallet2, {from: wallet2, value: 700});
//
//             const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
//             const promise = new Promise(resolve => event.watch(async function(error, response) {
//
//                 // Check event arguments
//                 response.args.beneficiary.should.equal(wallet2);
//                 response.args.amount.should.be.bignumber.equal(700 * (10**tokenDecimals));
//
//                 // Check balance
//                 const balance = await token.balanceOf(wallet2);
//                 balance.should.be.bignumber.equal(700 * (10**tokenDecimals));
//
//                 // Check supply
//                 const totalSupply = await token.totalSupply();
//                 totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale + 700) * (10**tokenDecimals));
//
//                 event.stopWatching();
//                 resolve();
//             }));
//
//             await promise;
//         }
//
//         {
//             // Create 800 CAT for wallet2
//             await crowdsale.buyTokens(wallet3, {from: wallet3, value: 800});
//
//             const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
//             const promise = new Promise(resolve => event.watch(async function(error, response) {
//
//                 // Check event arguments
//                 response.args.beneficiary.should.equal(wallet3);
//                 response.args.amount.should.be.bignumber.equal(800 * (10**tokenDecimals));
//
//                 // Check balance
//                 const balance = await token.balanceOf(wallet3);
//                 balance.should.be.bignumber.equal(800 * (10**tokenDecimals));
//
//                 // Check supply
//                 const totalSupply = await token.totalSupply();
//                 totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale + 700 + 800) * (10**tokenDecimals));
//
//                 event.stopWatching();
//                 resolve();
//             }));
//
//             await promise;
//         }
//     })
//
// })
