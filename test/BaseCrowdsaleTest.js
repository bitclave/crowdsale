'use strict';

import {duration, increaseTimeTo} from "./helpers/increaseTime";
import latestTime from "./helpers/latestTime";
import EVMThrow from './helpers/EVMThrow';
import {advanceBlock} from './helpers/advanceToBlock';
import ether from './helpers/ether';

const BigNumber = web3.BigNumber;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

const Crowdsale = artifacts.require('./CATCrowdsale.sol');
const Token = artifacts.require('./PreCAToken.sol');

const tokenDecimals = 18;
const tokenDecimalsIncrease = new BigNumber(10).pow(tokenDecimals);
const catForEth = new BigNumber(3000);
const rate = catForEth;  // rate - 1.000.000.000.000.000.000.000.000(one ETH) to 3000(CAT)
contract('Crowdsale: ', function ([_, wallet, bitClaveWallet, walletForMint, walletInvestorFirst, walletInvestorSecond, walletMetaMask]) {

    let startTime;
    let endTime;
    let afterWhitelistTime;
    let afterEndTime;

    let crowdsale;
    let tokens;
    let usedTokensSupply = new BigNumber(0);
    let residueTokens = new BigNumber(0);
    let bonusCoefficient = new BigNumber(0);
    let catToUsedPrice = new BigNumber(0);

    before(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock();
        const initialTime = latestTime();
        const diff = 0;//new Date("2017-10-25").getTime() - initialTime;

        await increaseTimeTo(initialTime + diff);

        startTime = latestTime() + duration.weeks(1);
        endTime = startTime + duration.days(60);
        afterWhitelistTime = startTime + duration.hours(4);
        afterEndTime = endTime + duration.seconds(1);

        crowdsale = await Crowdsale.new(startTime, endTime, rate, wallet, wallet, bitClaveWallet);
        tokens = Token.at(await crowdsale.token.call());
        bonusCoefficient = await crowdsale.BONUS_COEFF.call();
        catToUsedPrice = await crowdsale.TOKEN_USDCENT_PRICE.call();

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
    });

    it('funds on wallets', async function () {
        let bitclaveWalletTokens = await crowdsale.BITCLAVE_AMOUNT.call();
        await validateBalance(bitClaveWallet, bitclaveWalletTokens);
    });

    it('crowdsale state Paused', async function () {
        assert.ok(await crowdsale.paused.call(), "incorrect state of contract: not paused");
    });

    it('mint token only owner', async function () {
        await mintTokens(walletForMint, 5, {from: walletInvestorFirst}).should
            .be
            .rejectedWith(EVMThrow);
        await mintTokensWithValidateBalance(walletForMint, 5);
    });

    it('crowdsale state Not started for regular clients', async function () {
        await crowdsale.unpause();
        await buyTokens(walletInvestorFirst,
            {from: walletInvestorFirst, value: ether(1)}).should
            .be
            .rejectedWith(EVMThrow);
        await crowdsale.pause();
    });

    it('buy tokens for test count in wallet via MetaMask (via mintTokens)', async function () {
        await mintTokensWithValidateBalance(walletMetaMask, 1 * tokenDecimalsIncrease);
    });

    it('crowdsale running for whitelist (start before at 4 hours)', async function () {
        await mintTokensWithValidateBalance(walletForMint, 1);

        await buyTokens(walletInvestorFirst,
            {from: walletInvestorFirst, value: ether(1)}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('send tokens to investor from presale', async function () {
        await mintPresaleTokensWithValidateBalance(1000);
    });

    it('transfer tkn to address, which already buyed tkn via site payed BTC/QTUM', async function () {
        await mintTokensWithValidateBalance(walletForMint, 5);
    });

    it('start buying', async function () {
        await increaseTimeTo(afterWhitelistTime);
        const crowdsaleStartTime = (await crowdsale.startTime()).toNumber();
        const hasEnded = await crowdsale.hasEnded();

        assert.ok(latestTime() >= crowdsaleStartTime, "incorrect current time");
        assert(hasEnded === false, "incorrect state of contract");
    });

    it('crowdsale running for regular clients. (after 4 hours. without pause)', async function () {
        await crowdsale.unpause();
        /**
         * discount of one hour ignored. because regular investor buying tokens after four hours from start.
         * first day = discount 10%
         *
         * 8 ~ 2400$ - bonus 2%
         * 301 ~ 90300$ - bonus 7%
         * 2.5 ~ 750$ - bonus 0.5%
         *
         */
        await regularInvestorBuyTokens(walletInvestorFirst, duration.hours(1),
            [ether(8), ether(301), ether(2.5)], [20, 70, 5], [100, 100, 100]);
    });

    it('send tokens to investor from presale (transfer already disabled)', async function () {
        await mintPresaleTokensWithValidateBalance(1000).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('try transfer tokens from investor wallet', async function () {
        await tokens.transfer(walletInvestorSecond, 1, {from: walletInvestorFirst}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('unpause tokens and try transfer tokens from investor wallet', async function () {
        await crowdsale.unpauseTokens();

        await tokens.transfer(walletInvestorSecond, 1, {from: walletInvestorFirst});

        await crowdsale.pauseTokens();

        await tokens.transfer(walletInvestorSecond, 1, {from: walletInvestorFirst}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('buy tokens at 2 - 7 days', async function () {
        await increaseTimeTo(afterWhitelistTime + duration.days(1));
        /*
         * between 2 and 7 days = discount 7%
         *
         * 550 ~ 165000$ - bonus 8%
         * 3300 ~ 990000$ - bonus 13%
         * 8 ~ 2400$ - bonus 2%
         *
         */
        await regularInvestorBuyTokens(walletInvestorFirst, duration.days(1),
            [ether(550), ether(3300), ether(8)], [80, 130, 20], [70, 70, 70]);
    });

    it('contract on a pause in the sales process', async function () {
        await crowdsale.pause();
        await buyTokens(walletInvestorFirst,
            {from: walletInvestorFirst, value: tokenDecimalsIncrease.mul(10)}).should
            .be
            .rejectedWith(EVMThrow);
        await crowdsale.unpause();
    });

    it('buy tokens at 8 - 30 days', async function () {
        await increaseTimeTo(afterWhitelistTime + duration.days(8));
        /*
         * between 8 and 30 days = discount 5%
         *
         * 43 ~ 9.000$ - bonus 4%
         * 73 ~ 15.000$ - bonus 4.5%
         * 287 ~ 60.000$ - bonus 6.5%
         *
         */
        await regularInvestorBuyTokens(walletInvestorFirst, duration.days(5),
            [ether(43), ether(73), ether(287)], [40, 45, 65], [50, 50, 50]);
    });

    it('buy tokens at 31 - 45 days', async function () {
        await increaseTimeTo(afterWhitelistTime + duration.days(31));
        /*
         * between 31 and 45 days = discount 2%
         *
         * 1 ~ 300$ - bonus 0%
         * 1000 ~ 300.000$ - bonus 10%
         * 5 ~ 1.500$ - bonus 1.5%
         *
         */
        await regularInvestorBuyTokens(walletInvestorFirst, duration.days(4),
            [ether(1), ether(1000), ether(5)], [0, 100, 15], [20, 20, 20]);
    });

    it('buy tokens at 45 - 60 days', async function () {
        await increaseTimeTo(afterWhitelistTime + duration.days(44));
        /*
         * between 45 and 60 days = discount 0%
         *
         * 1500 ~ 450135$ - bonus 11%
         * 2 ~ 600$ - bonus 0.5%
         * 3 ~ 900$ - bonus 1%
         *
         */
        await regularInvestorBuyTokens(walletInvestorFirst, duration.days(5),
            [ether(1500), ether(2), ether(3)], [110, 5, 10], [0, 0, 0]);
    });

    it('buy tokens for test count in wallet via MetaMask (via buyTokens)', async function () {
        const initialWalletMMBalance = await getBalance(walletMetaMask);

        await buyTokens(walletMetaMask,
            {from: walletMetaMask, value: tokenDecimalsIncrease.mul(1)});
        await validateBalance(walletMetaMask, initialWalletMMBalance.add(new BigNumber(catForEth)
            .mul(tokenDecimalsIncrease))); // wallet will be show 3001 tokens
    });

    it('buy tokens at 45 - 60 days. transfer to other wallet', async function () {
        /*
         * between 45 and 60 days = discount 0%
         *
         * 10eth - bonus 0%
         */
        const investorBalance = await getBalance(walletInvestorSecond);
        const initialWalletMintBalance = await getBalance(walletForMint);
        await buyTokens(walletForMint,
            {from: walletInvestorSecond, value: tokenDecimalsIncrease.mul(1)});
        await validateBalance(walletForMint, initialWalletMintBalance.add(new BigNumber(catForEth)
            .mul(tokenDecimalsIncrease)));

        await validateBalance(walletInvestorSecond, investorBalance);
    });

    it('change owner to Bitclave wallet', async function () {
        await mintTokensWithValidateBalance(walletForMint, 1);

        const owner = await tokens.owner();
        owner.should.equal(crowdsale.address);

        await crowdsale.transferOwnership(bitClaveWallet);

        await mintTokens(walletForMint, 1).should
            .be
            .rejectedWith(EVMThrow);

        await mintTokensWithValidateBalance(walletForMint, 1, {from: bitClaveWallet});
    });

    it('finish crowdsale by time', async function () {
        await increaseTimeTo(afterEndTime);
        await buyTokens(walletInvestorSecond,
            {from: walletInvestorSecond, value: tokenDecimalsIncrease.mul(10)}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('validate totalSupply of tokens', async function () {
        const totalSupply = await tokens.totalSupply.call();
        let bitclaveWalletTokens = await crowdsale.BITCLAVE_AMOUNT.call();
        let fullSupply = bitclaveWalletTokens.add(usedTokensSupply);

        totalSupply.should.be.bignumber.equal(fullSupply);
    });

    it('finalize crowdsale', async function () {
        const totalSupply = await tokens.totalSupply.call();
        const cap = await crowdsale.CAP.call();
        residueTokens = cap.minus(totalSupply);

        await crowdsale.finalize({from: bitClaveWallet});

        await mintTokens(walletForMint, 1,  {from: bitClaveWallet}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('validate returned funds to main wallet', async function () {
        validateBalance(wallet, residueTokens);
    });

    it('try transfer tokens from investor wallet. after finalized crowdsale', async function () {
        await tokens.transfer(walletInvestorSecond, 1, {from: walletInvestorFirst}).should
            .be
            .rejectedWith(EVMThrow);
    });

    it('is bitClaveWallet owner of CATToken', async function () {
        const owner = await tokens.owner();
        owner.should.equal(bitClaveWallet);
    });

    let regularInvestorBuyTokens = async function (wallet, timeStep, etherValues, bonuses, discount) {
        let walletInitialValue = await getBalance(wallet);
        let collectedAmount = new BigNumber(0);
        const size = etherValues.length;

        for (let i = 0; i < size; i++) {
            await increaseTimeTo(latestTime() + timeStep);

            let etherAmount = etherValues[i];
            let result = calculateTokensWithBonus(rate, etherAmount, new BigNumber(bonuses[i]),
                new BigNumber(discount[i]));
            let amount = await buyTokens(wallet, {from: wallet, value: etherAmount});

            assert.equal(amount.toNumber(), result.toNumber());

            collectedAmount = collectedAmount.add(amount);
        }

        await validateBalance(wallet, walletInitialValue.add(collectedAmount));
    };

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

        const event = result.find(e => e.event === 'TokenPurchase');

        should.exist(event);

        event.args.purchaser.should.equal(params.from);
        event.args.beneficiary.should.equal(wallet);
        event.args.value.should.be.bignumber.equal(params.value);

        usedTokensSupply = usedTokensSupply.add(event.args.amount);

        return event.args.amount;
    };

    let mintTokensWithValidateBalance = async function (wallet, amount, params) {
        const initialBalance = await getBalance(wallet);
        await mintTokens(wallet, amount, params);
        const updatedBalance = await getBalance(wallet);
        updatedBalance.should.be.bignumber.equal(initialBalance.add(amount));
    };

    let mintPresaleTokensWithValidateBalance = async function (amount, params) {
        const initialBalance = await getBalance(crowdsale.address);
        await crowdsale.mintPresaleTokens(amount, params);
        usedTokensSupply = usedTokensSupply.add(amount);
        const updatedBalance = await getBalance(crowdsale.address);
        updatedBalance.should.be.bignumber.equal(initialBalance.add(amount));
    };

    let mintTokens = async function (wallet, value, params) {
        await crowdsale.mintTokens(wallet, value, params);
        usedTokensSupply = usedTokensSupply.add(value);
    };

    let calculateTokensWithBonus = function (rate, amount, bonus, discount) {
        let rateWithBonus = rate.mul(bonusCoefficient.add(bonus).add(discount))
            .div(bonusCoefficient);

        return amount.mul(rateWithBonus);
    };

});
