// @flow
'use strict'

const expect = require('chai').expect

const { advanceToBlock, ether, should, EVMThrow } = require('./utils')
const CAToken = artifacts.require('./CAToken.sol')

const BigNumber = web3.BigNumber
const tokenDecimals = 18
const tokensForOwner = 1000 * (10**6)

contract('CAToken', function ([_, wallet, wallet2, wallet3]) {

    it('creates 1 billion of tokens for its creator', async function () {
        const token = await CAToken.new(wallet);

        const event = token.CreateCAT({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
        const promise = new Promise(resolve => event.watch(async function(error, response) {
            event.stopWatching();

            // Check event arguments
            response.args.receiver.should.equal(wallet);
            response.args.value.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));

            // Check balace
            const balance = await token.balanceOf(wallet);
            balance.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));
            
            // Check supply
            const totalSupply = await token.totalSupply();
            totalSupply.should.be.bignumber.equal(tokensForOwner * (10**tokenDecimals));
            
            resolve();
        }));

        await promise;
    })

    it('creates tokens when creator asks', async function () {
        const token = await CAToken.new(wallet);

        {
            // Create 700 CAT for wallet2
            await token.createTokens(wallet2, 700 * (10**tokenDecimals));
            
            const event = token.CreateCAT({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
            const promise = new Promise(resolve => event.watch(async function(error, response) {
                
                // Check event arguments
                response.args.receiver.should.equal(wallet2);
                response.args.value.should.be.bignumber.equal(700 * (10**tokenDecimals));

                // Check balance
                const balance = await token.balanceOf(wallet2);
                balance.should.be.bignumber.equal(700 * (10**tokenDecimals));
                
                // Check supply
                const totalSupply = await token.totalSupply();
                totalSupply.should.be.bignumber.equal((tokensForOwner + 700) * (10**tokenDecimals));
                
                event.stopWatching();
                resolve();
            }));

            await promise;
        }

        {
            // Create 800 CAT for wallet3
            await token.createTokens(wallet3, 800 * (10**tokenDecimals));
            
            const event = token.CreateCAT({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
            const promise = new Promise(resolve => event.watch(async function(error, response) {
                
                // Check event arguments
                response.args.receiver.should.equal(wallet3);
                response.args.value.should.be.bignumber.equal(800 * (10**tokenDecimals));

                // Check balance
                const balance = await token.balanceOf(wallet3);
                balance.should.be.bignumber.equal(800 * (10**tokenDecimals));
                
                // Check supply
                const totalSupply = await token.totalSupply();
                totalSupply.should.be.bignumber.equal((tokensForOwner + 700 + 800) * (10**tokenDecimals));
                
                event.stopWatching();
                resolve();
            }));

            await promise;
        }
    })

    it('fails users to create tokens', async function () {
        var token = await CAToken.new(wallet);

        // Fails to create token for themselves
        await token.createTokens(wallet2, 700 * (10**tokenDecimals), {from: wallet2}).should.be.rejectedWith(EVMThrow);

        // Fails to create token for different users
        await token.createTokens(wallet2, 700 * (10**tokenDecimals), {from: wallet3}).should.be.rejectedWith(EVMThrow);
    })

    it('fails to create to many tokens', async function () {
        var token = await CAToken.new(wallet);

        // Fails to create too many tokens
        await token.createTokens(wallet2, 1500 * (10**6) * (10**tokenDecimals)).should.be.rejectedWith(EVMThrow);

        // Create tokens to fill the cap
        await token.createTokens(wallet2, 1000 * (10**6) * (10**tokenDecimals));
        const totalSupply = await token.totalSupply();
        totalSupply.should.be.bignumber.equal(2000 * (10**6) * (10**tokenDecimals));
        
        // Fails to create one more token
        await token.createTokens(wallet2, 1).should.be.rejectedWith(EVMThrow);

        // Fails to overflow uint256 type
        await token.createTokens(wallet2, new BigNumber(2)**256 - 1).should.be.rejectedWith(EVMThrow);
    })

})
