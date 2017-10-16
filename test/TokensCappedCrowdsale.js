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

const Crowdsale = artifacts.require('./impl/TokensCappedCrowdsaleImpl.sol');
const Token = artifacts.require('zeppelin-solidity/contracts/token/MintableToken.sol');

contract('TokensCappedCrowdsale', function ([_, wallet, wallet2, wallet3, wallet4]) {

    it('fails to create too many tokens', async function () {

        await advanceBlock();

        const startTime = latestTime() + duration.weeks(1);
        const endTime = startTime + duration.weeks(1);
        const afterEndTime = endTime + duration.seconds(1);

        const crowdsale = await Crowdsale.new(startTime, endTime, 1, wallet, 1000);
        const token = Token.at(await crowdsale.token.call());

        await increaseTimeTo(startTime);

        {
            // Fails to create too many tokens
            await crowdsale.buyTokens(wallet2, {from: wallet2, value: 1500}).should.be.rejectedWith(EVMThrow);
            const totalSupply = await token.totalSupply.call();
            totalSupply.should.be.bignumber.equal(0);
            const hasEnded = await crowdsale.hasEnded.call();
            hasEnded.should.be.false;
        }

        {
            // Create 700 tokens
            await crowdsale.buyTokens(wallet2, {from: wallet2, value: 700});
            const totalSupply = await token.totalSupply.call();
            totalSupply.should.be.bignumber.equal(700);
            const hasEnded = await crowdsale.hasEnded.call();
            hasEnded.should.be.false;
        }

        {
            // Create 300 tokens to fill the cap
            await crowdsale.buyTokens(wallet3, {from: wallet3, value: 300});
            const totalSupply = await token.totalSupply.call();
            totalSupply.should.be.bignumber.equal(1000);
            const hasEnded = await crowdsale.hasEnded.call();
            hasEnded.should.be.true;
        }

        // Fails to create one more token
        await crowdsale.buyTokens(wallet4, {from: wallet4, value: 1}).should.be.rejectedWith(EVMThrow);
    })

})
