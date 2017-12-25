// @flow
'use strict';

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import EVMRevert from './helpers/EVMRevert';

const Token = artifacts.require('./PreCAToken.sol');

contract('CAToken', function ([_, wallet1, wallet2, wallet3]) {

    it('should be killable after minting finished with destructor', async function () {
        const token = await Token.new();

        await token.destroy().should.be.rejectedWith(EVMRevert);
        await token.finishMinting();
        await token.destroy().should.be.fulfilled;
    });

    it('should be killable after minting finished with destructor companion', async function () {
        const token = await Token.new();

        await token.destroyAndSend(wallet1).should.be.rejectedWith(EVMRevert);
        await token.finishMinting();
        await token.destroyAndSend(wallet1).should.be.fulfilled;
    });

    it('mint to array of addresses owner', async function () {
        const token = await Token.new();
        const tokenDecimals = new BigNumber(await token.decimals());
        const tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
        const oneToken = new BigNumber(1).mul(tokenDecimalsIncrease);

        const addresses = [wallet1, wallet2, wallet3];
        await token.mintToAddresses(addresses, oneToken);
        await token.mintToAddresses(addresses, oneToken, {from: wallet1})
            .should
            .be
            .rejectedWith(EVMRevert);
        let balance = await token.balanceOf(wallet1);
        balance.should.be.bignumber.equal(oneToken);

        balance = await token.balanceOf(wallet2);
        balance.should.be.bignumber.equal(oneToken);

        balance = await token.balanceOf(wallet3);
        balance.should.be.bignumber.equal(oneToken);
    });

    it('mint to array of addresses changed mintMaster', async function () {
        const token = await Token.new();
        await token.transferMintMaster(wallet3);
        const tokenDecimals = new BigNumber(await token.decimals());
        const tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
        const oneToken = new BigNumber(1).mul(tokenDecimalsIncrease);

        const addresses = [wallet1, wallet2];

        // wallet2 is not owner or mintMaster
        await token.mintToAddresses(addresses, oneToken, {from: wallet2})
            .should
            .be
            .rejectedWith(EVMRevert);

        await token.mintToAddresses(addresses, oneToken, {from: wallet3});

        let balance = await token.balanceOf(wallet1);
        balance.should.be.bignumber.equal(oneToken);

        balance = await token.balanceOf(wallet2);
        balance.should.be.bignumber.equal(oneToken);
    });

    it('mint to arrays of addresses and amounts owner', async function () {
        const token = await Token.new();
        const tokenDecimals = new BigNumber(await token.decimals());
        const tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
        const oneToken = new BigNumber(1).mul(tokenDecimalsIncrease);
        const twoTokens = new BigNumber(2).mul(tokenDecimalsIncrease);
        const threeTokens = new BigNumber(3).mul(tokenDecimalsIncrease);

        const addresses = [wallet1, wallet2, wallet3];
        const amounts = [oneToken, twoTokens, threeTokens];

        // wallet1 is not owner or mintMaster
        await token.mintToAddressesAndAmounts(addresses, amounts, {from: wallet1})
            .should
            .be
            .rejectedWith(EVMRevert);

        // arrays of different size
        await token.mintToAddressesAndAmounts(addresses, [oneToken])
            .should
            .be
            .rejectedWith(EVMRevert);
        await token.mintToAddressesAndAmounts(addresses, [oneToken, twoTokens])
            .should
            .be
            .rejectedWith(EVMRevert);

        await token.mintToAddressesAndAmounts(addresses, amounts);

        let balance = await token.balanceOf(wallet1);
        balance.should.be.bignumber.equal(oneToken);

        balance = await token.balanceOf(wallet2);
        balance.should.be.bignumber.equal(twoTokens);

        balance = await token.balanceOf(wallet3);
        balance.should.be.bignumber.equal(threeTokens);
    });

    it('mint to array of addresses and amounts changed mintMaster', async function () {
        const token = await Token.new();
        await token.transferMintMaster(wallet3);
        const tokenDecimals = new BigNumber(await token.decimals());
        const tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
        const oneToken = new BigNumber(1).mul(tokenDecimalsIncrease);
        const twoTokens = new BigNumber(2).mul(tokenDecimalsIncrease);
        const threeTokens = new BigNumber(3).mul(tokenDecimalsIncrease);

        const addresses = [wallet1, wallet2];
        const amounts = [oneToken, twoTokens];

        // wallet2 is not owner or mintMaster
        await token.mintToAddressesAndAmounts(addresses, amounts, {from: wallet2})
            .should
            .be
            .rejectedWith(EVMRevert);

        // arrays of different size
        await token.mintToAddressesAndAmounts(addresses, [oneToken], {from: wallet3})
            .should
            .be
            .rejectedWith(EVMRevert);
        await token.mintToAddressesAndAmounts(addresses, [oneToken, twoTokens, threeTokens], {from: wallet3})
            .should
            .be
            .rejectedWith(EVMRevert);

        await token.mintToAddressesAndAmounts(addresses, amounts, {from: wallet3});

        let balance = await token.balanceOf(wallet1);
        balance.should.be.bignumber.equal(oneToken);

        balance = await token.balanceOf(wallet2);
        balance.should.be.bignumber.equal(twoTokens);
    });

});
