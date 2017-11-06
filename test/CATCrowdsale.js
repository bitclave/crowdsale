// @flow
'use strict'

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import ether from './helpers/ether';
import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMThrow from './helpers/EVMThrow';

const Crowdsale = artifacts.require('./CATCrowdsale.sol');
const Token = artifacts.require('./PreCAToken.sol');

contract('CATCrowdsale', function ([_, wallet, remainingsWallet, bitClaveWallet, wallet2, remainingsWallet2]) {

    const decimals = 18;
    const rate = 3000;
    const rate2 = 3001;
    var startTime;
    var midTime;
    var endTime;
    var afterEndTime;

    var crowdsale;
    var token;

    // https://stackoverflow.com/questions/26107027/
    function makeSuite(name, tests) {
        describe(name, async function () {
            beforeEach(async function () {
                await advanceBlock();
                startTime = latestTime() + duration.weeks(1);
                endTime = startTime + duration.weeks(10);
                afterEndTime = endTime + duration.seconds(1);
                midTime = (startTime + endTime) / 2;

                crowdsale = await Crowdsale.new(startTime, endTime, rate, wallet, remainingsWallet, bitClaveWallet);
                token = Token.at(await crowdsale.token.call());
                await increaseTimeTo(startTime);
            });
            tests();
        });
    }

    makeSuite('mint failure', async function () {

        it('should failure to mint tokens to 0', async function () {
            await crowdsale.mintTokens(0, 1).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to mint 0 tokens', async function () {
            await crowdsale.mintTokens(wallet, 0).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to mint to many tokens', async function () {
            await crowdsale.mintTokens(wallet, (new BigNumber((10**9) * (10**decimals))).add(1)).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to mint after finalization', async function () {
            await increaseTimeTo(afterEndTime);
            await crowdsale.finalize();
            await crowdsale.mintTokens(wallet, 1).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to mint after early finalization', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9) * (10 ** decimals));
            await crowdsale.finalize();
            await crowdsale.mintTokens(wallet2, 1).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to mint after endTime', async function () {
            await increaseTimeTo(afterEndTime);
            await crowdsale.mintTokens(wallet, 1).should.be.rejectedWith(EVMThrow);
        })

    })

    makeSuite('setters failure', async function () {

        it('should failure to set 0 to rate', async function () {
            await crowdsale.setRate(0).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to set 0 to wallet', async function () {
            await crowdsale.setWallet(0).should.be.rejectedWith(EVMThrow);
        })

        it('should failure to set 0 to remainings wallet', async function () {
            await crowdsale.setRemainingTokensWallet(0).should.be.rejectedWith(EVMThrow);
        })

    })

    makeSuite('setters success', async function () {

        it('should set rate2 to rate', async function () {
            (await crowdsale.rate.call()).should.be.bignumber.equal(rate);
            await crowdsale.setRate(rate2);
            (await crowdsale.rate.call()).should.be.bignumber.equal(rate2);
        })

        it('should set wallet2 to wallet', async function () {
            (await crowdsale.wallet.call()).should.be.equal(wallet);
            await crowdsale.setWallet(wallet2);
            (await crowdsale.wallet.call()).should.be.equal(wallet2);
        })

        it('should set remainingsWallet2 to remainings wallet', async function () {
            (await crowdsale.remainingTokensWallet.call()).should.be.equal(remainingsWallet);
            await crowdsale.setRemainingTokensWallet(remainingsWallet2);
            (await crowdsale.remainingTokensWallet.call()).should.be.equal(remainingsWallet2);
        })

    })

    makeSuite('finalization all', async function () {

        it('should issue all tokens to remainings wallet', async function () {
            await increaseTimeTo(afterEndTime);
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal((10 ** 9)* (10 ** decimals));
        })

    })

    makeSuite('finalization half', async function () {

        it('should issue some tokens to remainings wallet', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9) * (10 ** decimals) / 2);
            await increaseTimeTo(afterEndTime);
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal((10 ** 9) * (10 ** decimals) / 2);
        })

    })

    makeSuite('finalization none', async function () {

        it('should issue none tokens to remainings wallet', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9) * (10 ** decimals));
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal(0);
        })

    })

    makeSuite('finalize paused tokens', async function () {

        it('should not unpause tokens', async function () {
            await increaseTimeTo(afterEndTime);
            (await token.paused.call()).should.be.true;
            await crowdsale.finalize();
            (await token.paused.call()).should.be.true;
        })

    })

    makeSuite('adjust end time', async function () {

        it('should not works after finalization', async function () {
            await increaseTimeTo(afterEndTime);
            await crowdsale.finalize();
            await crowdsale.setEndTime(afterEndTime + duration.days(1)).should.be.rejectedWith(EVMThrow);
        })

        it('should not be able to set before start time', async function () {
            await crowdsale.setEndTime(startTime - duration.seconds(1)).should.be.rejectedWith(EVMThrow);
        })

        it('should not be able to set present time', async function () {
            await increaseTimeTo(midTime);
            await crowdsale.setEndTime(midTime - duration.seconds(1)).should.be.rejectedWith(EVMThrow);
        })

        it('should be able to set end time', async function () {
            await increaseTimeTo(midTime);
            await crowdsale.setEndTime(midTime + duration.seconds(1));
            (await crowdsale.endTime.call()).should.be.bignumber.equal(midTime + duration.seconds(1));

            await crowdsale.setEndTime(endTime + duration.seconds(1));
            (await crowdsale.endTime.call()).should.be.bignumber.equal(endTime + duration.seconds(1));
        })

    })

    makeSuite('presale wallet transfer', async function () {

        beforeEach(async function() {
            crowdsale.mintPresaleTokens(1000);
        })

        it('should work over special method', async function () {
            (await token.balanceOf.call(wallet2)).should.be.bignumber.equal(0);
            (await token.balanceOf.call(crowdsale.address)).should.be.bignumber.equal(1000);

            await crowdsale.transferPresaleTokens(wallet2, 100);

            (await token.balanceOf.call(wallet2)).should.be.bignumber.equal(100);
            (await token.balanceOf.call(crowdsale.address)).should.be.bignumber.equal(900);
        })

    })

})
