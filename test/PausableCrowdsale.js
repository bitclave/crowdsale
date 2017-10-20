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

const PausedCrowdsale = artifacts.require('./impl/PausableCrowdsaleImplPaused.sol');
const UnpausedCrowdsale = artifacts.require('./impl/PausableCrowdsaleImplUnpaused.sol');

contract('PausableCrowdsale', function ([_, wallet, wallet2, wallet3]) {

    var pausedCrowdsale;
    var unpausedCrowdsale;

    before(async function() {
        await advanceBlock();
        var startTime = latestTime() + duration.weeks(1);
        var endTime = startTime + duration.weeks(10);
        var afterEndTime = endTime + duration.seconds(1);

        pausedCrowdsale = await PausedCrowdsale.new(startTime, endTime, 1, wallet);
        unpausedCrowdsale = await UnpausedCrowdsale.new(startTime, endTime, 1, wallet);
    })

    it('should be created paused', async function() {
        (await pausedCrowdsale.paused.call()).should.be.true;
    })

    it('should be created unpaused', async function() {
        (await unpausedCrowdsale.paused.call()).should.be.false;
    })

})