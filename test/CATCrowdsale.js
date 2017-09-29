// @flow
'use strict'

const expect = require('chai').expect

const { advanceToBlock, ether, should, EVMThrow } = require('./utils')
const CATCrowdsale = artifacts.require('./CATCrowdsale.sol')
const CAToken = artifacts.require('./CAToken.sol')

const BigNumber = web3.BigNumber
const tokenDecimals = 18
const tokensForOwner = 1 * (10**9)
const tokensForPresale = 150 * (10**6)

contract('CATCrowdsale', function ([_, wallet, bitClaveWallet, presaledWallet, wallet2]) {

    const startDate = web3.eth.getBlock('latest').timestamp;
    const endDate = startDate + 3600*1000;

    it('creates 1 billion of tokens for its creator', async function () {

        const crowdsale = await CATCrowdsale.new(startDate, endDate, 10**tokenDecimals, wallet, bitClaveWallet, presaledWallet);
        const token = CAToken.at(await crowdsale.token.call());
        await crowdsale.setPaused(false);

        const event = crowdsale.TokenMint({_from:web3.eth.coinbase}, {fromBlock: 0});
        const promise = new Promise(resolve => event.watch(async function(error, response) {

            // Check supply
            const totalSupply = await token.totalSupply();
            totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale) * (10**tokenDecimals));

            if (response.args.beneficiary == bitClaveWallet) {
                // Check event arguments
                response.args.amount.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));

                // Check balace
                const balance = await token.balanceOf(bitClaveWallet);
                balance.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));
            }
            else if (response.args.beneficiary == presaledWallet) {
                // Check event arguments
                response.args.amount.should.be.bignumber.equal(tokensForPresale * (10**tokenDecimals));

                // Check balace
                const balance = await token.balanceOf(presaledWallet);
                balance.should.be.bignumber.equal(tokensForPresale * (10**tokenDecimals));

                event.stopWatching();
                resolve();
            }
            else {
                assert(false);
            }

        }));

        await promise;
    })

    it('creates tokens when creator asks', async function () {

        const crowdsale = await CATCrowdsale.new(startDate, endDate, 10**tokenDecimals, wallet, bitClaveWallet, presaledWallet);
        const token = CAToken.at(await crowdsale.token.call());
        await crowdsale.setPaused(false);

        {
            // Create 700 CAT for wallet2
            await crowdsale.buyTokens(wallet2, {from: wallet2, value: 700});
            //await web3.eth.sendTransaction({from: wallet2, to: crowdsale.address, value: 700});

            const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
            const promise = new Promise(resolve => event.watch(async function(error, response) {

                // Check event arguments
                response.args.beneficiary.should.equal(wallet2);
                response.args.amount.should.be.bignumber.equal(700 * (10**tokenDecimals));

                // Check balance
                const balance = await token.balanceOf(wallet2);
                balance.should.be.bignumber.equal(700 * (10**tokenDecimals));

                // Check supply
                const totalSupply = await token.totalSupply();
                totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale + 700) * (10**tokenDecimals));

                event.stopWatching();
                resolve();
            }));

            await promise;
        }

    //     {
    //         // Create 800 CAT for wallet3
    //         await token.createTokens(wallet3, 800 * (10**tokenDecimals));
            
    //         const event = token.CreateCAT({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
    //         const promise = new Promise(resolve => event.watch(async function(error, response) {
                
    //             // Check event arguments
    //             response.args.beneficiary.should.equal(wallet3);
    //             response.args.amount.should.be.bignumber.equal(800 * (10**tokenDecimals));

    //             // Check balance
    //             const balance = await token.balanceOf(wallet3);
    //             balance.should.be.bignumber.equal(800 * (10**tokenDecimals));
                
    //             // Check supply
    //             const totalSupply = await token.totalSupply();
    //             totalSupply.should.be.bignumber.equal((tokensForOwner + 700 + 800) * (10**tokenDecimals));
                
    //             event.stopWatching();
    //             resolve();
    //         }));

    //         await promise;
    //     }
    })

    // it('fails users to create tokens', async function () {
    //     var token = await CAToken.new(wallet);

    //     // Fails to create token for themselves
    //     await token.createTokens(wallet2, 700 * (10**tokenDecimals), {from: wallet2}).should.be.rejectedWith(EVMThrow);

    //     // Fails to create token for different users
    //     await token.createTokens(wallet2, 700 * (10**tokenDecimals), {from: wallet3}).should.be.rejectedWith(EVMThrow);
    // })

    // it('fails to create to many tokens', async function () {
    //     var token = await CAToken.new(wallet);

    //     // Fails to create too many tokens
    //     await token.createTokens(wallet2, 1500 * (10**6) * (10**tokenDecimals)).should.be.rejectedWith(EVMThrow);

    //     // Create tokens to fill the cap
    //     await token.createTokens(wallet2, 1000 * (10**6) * (10**tokenDecimals));
    //     const totalSupply = await token.totalSupply();
    //     totalSupply.should.be.bignumber.equal(2000 * (10**6) * (10**tokenDecimals));
        
    //     // Fails to create one more token
    //     await token.createTokens(wallet2, 1).should.be.rejectedWith(EVMThrow);

    //     // Fails to overflow uint256 type
    //     await token.createTokens(wallet2, new BigNumber(2)**256 - 1).should.be.rejectedWith(EVMThrow);
    // })

})
