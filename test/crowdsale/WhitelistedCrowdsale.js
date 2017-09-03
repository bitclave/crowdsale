import { advanceToBlock, ether, EVMThrow } from '../utils'

const WhitelistedCrowdsale = artifacts.require('../helpers/WhitelistedCrowdsaleImpl.sol')
const MintableToken = artifacts.require('zeppelin-solidity/contracts/tokens/MintableToken')


contract('WhitelistCrowdsale', function ([_, wallet, beneficiary, sender]) {
    const rate = 1000
    const amount = ether(1)

    beforeEach(async function () {
        this.startBlock = web3.eth.blockNumber + 10
        this.endBlock = this.startBlock + 10

        this.crowdsale = await WhitelistedCrowdsale.new(this.startBlock, this.endBlock, rate, wallet)
        this.token = MintableToken.at(await this.crowdsale.token())
    })

    describe('addToWhitelist()', function () {
        it('should add address to whitelist', async function () {
            await this.crowdsale.addToWhitelist(sender)

            const whitelisted = await this.crowdsale.whitelist(sender)
            whitelisted.should.equal(true)
        })

        // todo title
        it('require(_buyer != 0x0)', async function () {
            await this.crowdsale.addToWhitelist(0x0).should.be.rejectedWith(EVMThrow)
        })

        // todo title
        it('require(whitelist[_buyer] == false)', async function () {
            await this.crowdsale.addToWhitelist(sender)
            await this.crowdsale.addToWhitelist(sender).should.be.rejectedWith(EVMThrow)
        })

        it('only owner can add to whitelist', async function() {
            await this.crowdsale.addToWhitelist(sender, {from: sender}).should.be.rejectedWith(EVMThrow)
        })
    })

    describe('removeFromWhitelist()', function () {
        beforeEach(async function () {
            await this.crowdsale.addToWhitelist(sender)
        })

        it('should remove address from whitelist', async function () {
            await this.crowdsale.removeFromWhitelist(sender)

            const whitelisted = await this.crowdsale.whitelist(sender)
            whitelisted.should.equal(false)
        })

        // todo title
        it('require(_buyer != 0x0)', async function () {
            await this.crowdsale.removeFromWhitelist(0x0).should.be.rejectedWith(EVMThrow)
        })

        // todo title
        it('require(whitelist[_buyer] == false)', async function () {
            await this.crowdsale.removeFromWhitelist(sender)
            await this.crowdsale.removeFromWhitelist(sender).should.be.rejectedWith(EVMThrow)
        })

        it('only owner can add to whitelist', async function() {
            await this.crowdsale.removeFromWhitelist(sender, {from: sender}).should.be.rejectedWith(EVMThrow)
        })
    })

    describe('isWhitelisted()', function () {
        // todo title
        it('false', async function () {
            const whitelisted = await this.crowdsale.isWhitelisted(sender)
            whitelisted.should.equal(false)
        })

        // todo title
        it('true', async function () {
            await this.crowdsale.addToWhitelist(sender)

            const whitelisted = await this.crowdsale.isWhitelisted(sender)
            whitelisted.should.equal(true)
        })
    })

    describe('validPurchase()', function () {
        // todo title
        it('success', async function () {
            await this.crowdsale.addToWhitelist(sender)
            await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).fulfilled
        })

        // todo title
        it('hasEnded() error', async function () {
            await this.crowdsale.addToWhitelist(sender)
            await advanceToBlock(this.endBlock)

            await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).should.be.rejectedWith(EVMThrow)
        })

        it('!isWhitelisted() error', async function () {
            await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).should.be.rejectedWith(EVMThrow)
        })
    })
})
