'use strict';

import {duration, increaseTimeTo} from "./helpers/increaseTime";
import latestTime from "./helpers/latestTime";
import EVMThrow from './helpers/EVMThrow';

const BigNumber = web3.BigNumber;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

const Crowdsale = artifacts.require('./CATCrowdsale.sol');
const Token = artifacts.require('./CAToken.sol');

const tokenDecimals = 18;
const rate = new BigNumber(10).pow(tokenDecimals);

contract('Crowdsale: ', function ([_, wallet, bitClaveWallet, presaleWallet, wallet1, wallet2, wallet3]) {
    const startTime = latestTime() + duration.weeks(1);
    const endTime = startTime + duration.days(70);
    const afterWhitelistTime = startTime + duration.hours(4);

    let crowdsale;
    let tokens;
    let usedTokensSupply = new BigNumber(0);
    let residueTokens = new BigNumber(0);
    let bonusCoefficient = new BigNumber(0);

    it("initialize Crowdsale", async function () {
        //todo rate - 1(ETH) to 1(CAT)
        crowdsale = await Crowdsale.new(startTime, endTime, rate, wallet,
            bitClaveWallet, presaleWallet);
        tokens = Token.at(await crowdsale.token.call());
        bonusCoefficient = await crowdsale.BONUS_COEFF.call();

        console.log(_, wallet, bitClaveWallet, presaleWallet, await crowdsale.token.call());
    });

    it("funds on wallets", async function () {
        let bitclaveWalletTokens = await crowdsale.BITCLAVE_AMOUNT.call();
        let presaleWalletTokens = await crowdsale.PRESALE_AMOUNT.call();
        await validateBalance(bitClaveWallet, bitclaveWalletTokens);
        await validateBalance(presaleWallet, presaleWalletTokens);
    });

    it("crowdsale state Paused", async function () {
        assert.ok(await crowdsale.paused.call(), "incorrect state of contract: not paused");
    });

    it("mint token only owner", async function () {
        await mintTokens(wallet2, 5 * rate, {from: wallet1})
            .should
            .be
            .rejectedWith(EVMThrow);
        await mintTokens(wallet1, 1 * rate);
        await validateBalance(wallet1, 1 * rate);
    });

    it("crowdsale state Not started for regular clients", async function () {
        await crowdsale.setPaused(false);
        await buyTokens(wallet1, {from: wallet1, value: 1}).should
            .be
            .rejectedWith(EVMThrow);
        await crowdsale.setPaused(true);
    });

    it("crowdsale running for whitelist (start before at 4 hours)", async function () {
        await mintTokens(wallet1, 1 * rate);
        await validateBalance(wallet1, 2 * rate);

        await buyTokens(wallet1, {from: wallet1, value: 1}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it("crowdsale running for regular clients. (after 4 hours. without pause)", async function () {
        await increaseTimeTo(afterWhitelistTime);
        await crowdsale.setPaused(false);

        /**
         * first day = discount 10%
         * 5342 = bonus 3%
         */
        let value = 5342;
        let result = calculateTokensWithBonus(rate, value, 3, 10);
        let logs = await buyTokens(wallet1, {from: wallet1, value: value});

        const event = logs.find(e => e.event === 'TokenPurchase');
        should.exist(event);
        event.args.purchaser.should.equal(wallet1);
        event.args.beneficiary.should.equal(wallet1);
        event.args.value.should.be.bignumber.equal(value);
        event.args.amount.should.be.bignumber.equal(result);

        //await validateBalance(wallet1, result);
    });

    // it("transfer tkn to address, which already buyed tkn via site payed BTC/QTUM", async function () {
    //     await mintTokens(wallet2, 5 * rate);
    //     await validateBalance(wallet2, 5 * rate);
    // });
    //
    // it("start buying", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.minutes(1));
    //     const crowdsaleStartTime = (await crowdsale.startTime()).toNumber();
    //     const hasEnded = await crowdsale.hasEnded();
    //
    //     assert.ok(latestTime() > crowdsaleStartTime, "incorrect current time");
    //     assert(hasEnded === false, "incorrect state of contract");
    // });
    //
    // //for every state of buying tokens, will be calculated personal bonus (but now, contract not have implementation)
    // it("buy tokens in first hour", async function () {
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 10 * rate);
    // });
    //
    // it("buy tokens in first day", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.hours(5));
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 20 * rate); // 20 collect tokens with before actions.
    // });
    //
    // it("buy tokens at 2 - 7 days", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(3));
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 30 * rate); // 30 collect tokens with before actions.
    // });
    //
    // it("contract on a pause in the sales process", async function () {
    //     await crowdsale.setPaused(true);
    //     await buyTokens(wallet3, {from: wallet3, value: 10})
    //         .should
    //         .be
    //         .rejectedWith(EVMThrow);
    //     await crowdsale.setPaused(false);
    // });
    //
    // it("buy tokens at 8 - 30 days", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(15));
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 40 * rate); // 40 collect tokens with before actions.
    // });
    //
    // it("buy tokens at 31 - 45 days", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(37));
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 50 * rate); // 50 collect tokens with before actions.
    // });
    //
    // it("buy tokens at 45 - 60 days", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(55));
    //     await buyTokens(wallet3, {from: wallet3, value: 10});
    //     await validateBalance(wallet3, 60 * rate); // 60 collect tokens with before actions.
    // });
    //
    // it("buy tokens at 45 - 60 days. transfer to other wallet", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(56));
    //     await buyTokens(wallet1, {from: wallet3, value: 10});
    //     await validateBalance(wallet1, 12 * rate); // 12 (2 + 10) collect tokens with before actions.
    //     await validateBalance(wallet3, 60 * rate); // 60 collect tokens with before actions
    // });
    //
    // it("finish crowdsale by time", async function () {
    //     await increaseTimeTo(afterWhitelistTime + duration.days(75));
    //     await buyTokens(wallet3, {from: wallet3, value: 10})
    //         .should
    //         .be
    //         .rejectedWith(EVMThrow);
    // });
    //
    // it("change owner to Bitclave wallet", async function () {
    //     await mintTokens(wallet1, 1 * rate);
    //     await validateBalance(wallet1, 13 * rate); //13 (2 + 10 + 1) - with last count of tokens.
    //
    //     await crowdsale.transferOwnership(bitClaveWallet);
    //
    //     await mintTokens(wallet1, 1 * rate)
    //         .should
    //         .be
    //         .rejectedWith(EVMThrow);
    //
    //     await mintTokens(wallet1, 1 * rate, {from: bitClaveWallet});
    //     await validateBalance(wallet1, 14 * rate); //14 - with last count of tokens.
    // });
    //
    // it("validate totalSupply of tokens", async function () {
    //     const totalSupply = await tokens.totalSupply.call();
    //     let bitclaveWalletTokens = await crowdsale.BITCLAVE_AMOUNT.call();
    //     let presaleWalletTokens = await crowdsale.PRESALE_AMOUNT.call();
    //     let fullSupply = bitclaveWalletTokens.add(presaleWalletTokens)
    //         .add(usedTokensSupply);
    //
    //     totalSupply.should.be.bignumber.equal(fullSupply);
    // });
    //
    // it("finalize crowdsale", async function () {
    //     const totalSupply = await tokens.totalSupply.call();
    //     const cap = await crowdsale.CAP.call();
    //     residueTokens = cap.minus(totalSupply);
    //
    //     await crowdsale.finalize().should
    //         .be
    //         .rejectedWith(EVMThrow);
    //
    //     await crowdsale.finalize({from: bitClaveWallet});
    //
    //     await mintTokens(wallet1, 1 * rate).should
    //         .be
    //         .rejectedWith(EVMThrow);
    //
    //     await mintTokens(wallet1, 1 * rate, {from: bitClaveWallet}).should
    //         .be
    //         .rejectedWith(EVMThrow);
    // });
    //
    // it("validate returned funds to main wallet", async function () {
    //     validateBalance(wallet, residueTokens);
    // });

    let validateBalance = async function (wallet, amount) {
        let balance = await getBalance(wallet);
        balance.should.be.bignumber.equal(amount);

        return balance;
    };

    let getBalance = async function (wallet) {
        return await tokens.balanceOf(wallet);
    };

    let buyTokens = async function (wallet, params) {
        let result;
        if (params.from === wallet || !params.from) {
            params.from = wallet;
            const {logs} = await crowdsale.sendTransaction(params);
            result = logs;
        } else {
            const {logs} = await crowdsale.buyTokens(wallet, params);
            result = logs;
        }

        usedTokensSupply = usedTokensSupply.add(new BigNumber(params.value).mul(rate));

        return result;
    };

    let mintTokens = async function (wallet, value, params) {
        await crowdsale.mintTokens(wallet, value, params);
        usedTokensSupply = usedTokensSupply.add(value);
    };

    let calculateTokensWithBonus = function (rate, amount, bonus, discount) {
        let rateWithBonus = rate.mul(bonusCoefficient)
            .div(bonusCoefficient.add(bonus).add(discount));

        return new BigNumber(amount).mul(rateWithBonus);
    };

});
