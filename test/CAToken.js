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

const Token = artifacts.require('./CAToken.sol');

contract('CAToken', function ([_, wallet1, wallet2]) {

    it('should be killable after minting finished', async function() {
        const token = await Token.new();
        await token.kill().should.be.rejectedWith(EVMThrow);
        await token.finishMinting();
        await token.kill().should.be.fulfilled;
    })

})