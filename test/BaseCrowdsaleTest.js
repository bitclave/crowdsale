'use strict';

import {duration, increaseTimeTo} from "./helpers/increaseTime";
import latestTime from "./helpers/latestTime";
import EVMThrow from './helpers/EVMThrow';

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

const Crowdsale = artifacts.require('./CATCrowdsale.sol');
const Token = artifacts.require('./CAToken.sol');

const tokenDecimals = 18;
const rate = 10 ** tokenDecimals;

contract('Crowdsale: ', function ([_, wallet, bitClaveWallet, presaleWallet, wallet1, wallet2, wallet3]) {
    const startTime = latestTime() + duration.weeks(1);
    const endTime = startTime + duration.days(70);

    let crowdsale;
    let tokens;
    let usedTokensSupply = 0;
    let residueTokens = 0;

    it("initialize Crowdsale", async function () {
        crowdsale = await Crowdsale.new(startTime, endTime, 10 ** tokenDecimals, wallet,
            bitClaveWallet, presaleWallet);
        tokens = Token.at(await crowdsale.token.call());

        console.log(_, wallet, bitClaveWallet, presaleWallet, await crowdsale.token.call());
    });

    it("funds on wallets", async function () {
        let bitclaveWalletTokens = (await crowdsale.BITCLAVE_AMOUNT.call()).toNumber();
        let presaleWalletTokens = (await crowdsale.PRESALE_AMOUNT.call()).toNumber();
        await validateBalance(bitClaveWallet, bitclaveWalletTokens);
        await validateBalance(presaleWallet, presaleWalletTokens);
    });

    it("crowdsale state Paused", async function () {
        assert.ok(await crowdsale.paused.call(), "incorrect state of contract: not paused");
    });

    it("crowdsale state Not started", async function () {
        await crowdsale.setPaused(false);
        await buyTokens(wallet1, {from: wallet1, value: 1}).should
            .be
            .rejectedWith(EVMThrow);
        await crowdsale.setPaused(true);
    });

    it("crowdsale on pause (4 hours)", async function () {
        await mintTokens(wallet1, 1 * rate);
        await validateBalance(wallet1, 1 * rate);

        await buyTokens(wallet1, {from: wallet1, value: 1}).should
            .be
            .rejectedWith(EVMThrow);

        await increaseTimeTo(startTime);
        await crowdsale.setPaused(false);

        await buyTokens(wallet1, {from: wallet1, value: 1});
        await validateBalance(wallet1, 2 * rate);
    });

    it("mint token only owner", async function () {
        await mintTokens(wallet2, 5 * rate, {from: wallet1}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it("transfer tkn to address, which already buyed tkn via site payed BTC/QTUM", async function () {
        await mintTokens(wallet2, 5 * rate);
        await validateBalance(wallet2, 5 * rate);
    });

    it("start buying", async function () {
        await increaseTimeTo(startTime + duration.minutes(1));
        const crowdsaleStartTime = (await crowdsale.startTime()).toNumber();
        const hasEnded = await crowdsale.hasEnded();

        assert.ok(latestTime() > crowdsaleStartTime, "incorrect current time");
        assert(hasEnded === false, "incorrect state of contract");
    });

    //for every state of buying tokens, will be calculated personal bonus (but now, contract not have implementation)
    it("buy tokens in first hour", async function () {
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 10 * rate);
    });

    it("buy tokens in first day", async function () {
        await increaseTimeTo(startTime + duration.hours(5));
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 20 * rate); // 20 collect tokens with before actions.
    });

    it("buy tokens at 2 - 7 days", async function () {
        await increaseTimeTo(startTime + duration.days(3));
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 30 * rate); // 30 collect tokens with before actions.
    });

    it("buy tokens at 8 - 30 days", async function () {
        await increaseTimeTo(startTime + duration.days(15));
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 40 * rate); // 40 collect tokens with before actions.
    });

    it("buy tokens at 31 - 45 days", async function () {
        await increaseTimeTo(startTime + duration.days(37));
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 50 * rate); // 50 collect tokens with before actions.
    });

    it("buy tokens at 45 - 60 days", async function () {
        await increaseTimeTo(startTime + duration.days(55));
        await buyTokens(wallet3, {from: wallet3, value: 10});
        await validateBalance(wallet3, 60 * rate); // 60 collect tokens with before actions.
    });

    it("finish crowdsale by time", async function () {
        await increaseTimeTo(startTime + duration.days(75));
        await buyTokens(wallet3, {from: wallet3, value: 10}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it("change owner to Bitclave wallet", async function () {
        await mintTokens(wallet1, 1 * rate);
        await validateBalance(wallet1, 3 * rate); //3 - with last count of tokens.

        await crowdsale.transferOwnership(bitClaveWallet);

        await mintTokens(wallet1, 1 * rate).should
            .be
            .rejectedWith(EVMThrow);

        await mintTokens(wallet1, 1 * rate, {from: bitClaveWallet});
        await validateBalance(wallet1, 4 * rate); //4 - with last count of tokens.
    });

    it("validate totalSupply of tokens", async function () {
        const totalSupply = (await tokens.totalSupply.call()).toNumber();
        let bitclaveWalletTokens = (await crowdsale.BITCLAVE_AMOUNT.call()).toNumber();
        let presaleWalletTokens = (await crowdsale.PRESALE_AMOUNT.call()).toNumber();
        let fullSupply = usedTokensSupply + bitclaveWalletTokens + presaleWalletTokens;

        assert.ok(totalSupply === fullSupply, "incorrect totalSupply of tokens");
    });

    it("finalized crowdsale", async function () {
        const totalSupply = (await tokens.totalSupply.call()).toNumber();
        const cap = (await crowdsale.CAP.call()).toNumber();
        residueTokens = cap - totalSupply;

        await crowdsale.finalize().should
            .be
            .rejectedWith(EVMThrow);

        await crowdsale.finalize({from: bitClaveWallet});

        await mintTokens(wallet1, 1 * rate).should
            .be
            .rejectedWith(EVMThrow);

        await mintTokens(wallet1, 1 * rate, {from: bitClaveWallet}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it("validate returned funds to main wallet", async function () {
        validateBalance(wallet, residueTokens);
    });

    let validateBalance = async function (wallet, amount) {
        let balance = (await tokens.balanceOf(wallet)).toNumber();
        assert.equal(balance, amount, "incorrect balance");

        return balance;
    };

    let buyTokens = async function (wallet, params) {
        if (params.from === wallet || !params.from) {
            params.from = wallet;
            await crowdsale.sendTransaction(params);
        } else {
            await crowdsale.buyTokens(wallet, params);
        }

        usedTokensSupply += params.value * rate;
    };

    let mintTokens = async function (wallet, value, params) {
        await crowdsale.mintTokens(wallet, value, params);
        usedTokensSupply += value;
    };

});
