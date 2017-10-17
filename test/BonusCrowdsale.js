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

const Crowdsale = artifacts.require('./impl/BonusCrowdsaleImpl.sol');
const Token = artifacts.require('zeppelin-solidity/contracts/token/MintableToken.sol');

contract('BonusCrowdsale', function ([_, wallet, wallet2, wallet3]) {

    it('should apply bonus depending on time', async function () {

        await advanceBlock();

        const startTime = latestTime() + duration.weeks(1);
        const endTime = startTime + duration.weeks(10);
        const afterEndTime = endTime + duration.seconds(1);

        const rate = 5000;
        const value = 30;
        const crowdsale = await Crowdsale.new(startTime, endTime, rate, wallet);

        await crowdsale.setBonusesForTimes(
        [ // Seconds
            duration.hours(1),
            duration.days(1),
            duration.days(7),
            duration.days(30),
            duration.days(45),
            duration.days(60)
        ],
        [ // 10x percents
            150,
            100,
            70,
            50,
            20,
            0
        ]);

        await crowdsale.setBonusesForAmounts(
        [ // USD
            900000,
            600000,
            450000,
            300000,
            225000,
            150000,
            90000,
            60000,
            45000,
            30000,
            22500,
            15000,
            9000,
            6000,
            4500,
            3000,
            2100,
            1500,
            900,
            600,
            300
        ],
        [ // 10x percents
            130,
            120,
            110,
            100,
            90,
            80,
            70,
            65,
            60,
            55,
            50,
            45,
            40,
            35,
            30,
            25,
            20,
            15,
            10,
            5,
            0
        ]);

        const token = Token.at(await crowdsale.token.call());
        const bonus_coef = (await crowdsale.BONUS_COEFF.call()).toNumber();
        const BONUS_TIMES_length = (await crowdsale.bonusesForTimesCount.call()).toNumber();

        for (var i = 1; i < BONUS_TIMES_length; i++) {
            await increaseTimeTo(startTime + ((await crowdsale.BONUS_TIMES.call(i)).toNumber() + (await crowdsale.BONUS_TIMES.call(i-1)).toNumber())/2);

            var balance = await token.balanceOf.call(wallet2);
            balance.should.be.bignumber.equal(0);

            const bonus = (await crowdsale.BONUS_TIMES_VALUES.call(i)).toNumber();
            await crowdsale.buyTokens(wallet2, {from: wallet2, value: value});
            balance = await token.balanceOf.call(wallet2);
            balance.should.be.bignumber.equal((value*rate*(bonus_coef + bonus))/bonus_coef);

            await token.transfer(wallet3, balance, {from: wallet2});
            balance = await token.balanceOf.call(wallet2);
            balance.should.be.bignumber.equal(0);
        }
    })

})
