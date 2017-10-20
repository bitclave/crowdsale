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
const Token = artifacts.require('./CAToken.sol');

contract('CATCrowdsale', function ([_, wallet, remainingsWallet, bitClaveWallet, presaleWallet]) {

    const decimals = 18;
    const rate = 3000;
    var startTime;
    var endTime;
    var afterEndTime;

    var crowdsale;
    var token;

    // https://stackoverflow.com/questions/26107027/
    function makeSuite(name, tests) {
        describe(name, async function () {
            before(async function () {
                await advanceBlock();
                startTime = latestTime() + duration.weeks(1);
                endTime = startTime + duration.weeks(10);
                afterEndTime = endTime + duration.seconds(1)

                crowdsale = await Crowdsale.new(startTime, endTime, rate, wallet, remainingsWallet, bitClaveWallet,
                    presaleWallet);
                token = Token.at(await crowdsale.token.call());
                await increaseTimeTo(startTime);
            });
            tests();
        });
    }

    makeSuite('failures', async function () {

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

    makeSuite('finalization all', async function () {

        it('should issue all tokens to remainings wallet', async function () {
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal((10 ** 9)* (10 ** decimals));
        })

    })

    makeSuite('finalization half', async function () {

        it('should issue some tokens to remainings wallet', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9) * (10 ** decimals) / 2);
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal((10 ** 9) * (10 ** decimals) / 2);
        })

    })

    makeSuite('finalization none', async function () {

        it('should issue none tokens to remainings wallet', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9)* (10 ** decimals));
            await crowdsale.finalize();
            const balance = await token.balanceOf.call(remainingsWallet);
            balance.should.be.bignumber.equal(0);
        })

    })

    makeSuite('finalize paused tokens', async function () {

        it('should unpause tokens', async function () {
            (await token.paused.call()).should.be.true;
            await crowdsale.finalize();
            (await token.paused.call()).should.be.false;
        })

    })

    makeSuite('finalize unpaused tokens', async function () {

        it('should not unpause tokens', async function () {
            (await token.paused.call()).should.be.true;
            await crowdsale.unpauseTokens();
            (await token.paused.call()).should.be.false;
            await crowdsale.pauseTokens();
            (await token.paused.call()).should.be.true;
            await crowdsale.unpauseTokens();
            (await token.paused.call()).should.be.false;
            await crowdsale.finalize();
            (await token.paused.call()).should.be.false;
        })

    })

    makeSuite('after finalization', async function () {

        before(async function () {
            await crowdsale.finalize();
        })

        it('should fail to mint', async function () {
            await crowdsale.mintTokens(wallet, (10 ** 9)* (10 ** decimals)).should.be.rejectedWith(EVMThrow);
        })

        it('should fail to buy', async function () {
            await crowdsale.buyTokens(wallet, {value: web3.toWei(100)}).should.be.rejectedWith(EVMThrow);
        })

    })

})
