import { advanceToBlock, ether, EVMThrow } from '../utils'
import { expect }  from 'chai'

const CrowdsaleRate = artifacts.require('../helpers/CrowdsaleRateImpl.sol')
const MintableToken = artifacts.require('zeppelin-solidity/contracts/tokens/MintableToken')

const BigNumber = web3.BigNumber


contract('CrowdsaleRate', function ([_, wallet, wallet2, buyer, purchaser, buyer2, purchaser2]) {
    const initialRate = 1000
    const endRate = 2000
    const preferentialRate = 500

    beforeEach(async function () {
        this.startBlock = web3.eth.blockNumber + 10
        this.endBlock = this.startBlock + 10

        this.crowdsale = await CrowdsaleRate.new(
            this.startBlock,
            this.endBlock,
            initialRate,
            endRate,
            preferentialRate,
            wallet
        )
        this.token = MintableToken.at(await this.crowdsale.token())
    })

    describe('set buyer rate', function () {
        it('owner can set the price for a particular buyer', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            const { logs } = await this.crowdsale.setBuyerRate(buyer, 200)

            const event = logs.find(e => e.event === 'PreferentialRateChange')
            expect(event).to.exist
            event.args.buyer.should.equal(buyer)
            event.args.rate.toNumber().should.equal(200)

            const buyerRate = await this.crowdsale.buyerRate(buyer)
            buyerRate.toNumber().should.equal(200)
        })

        it('cannot set a custom rate before whitelisting a buyer', async function() {
            await this.crowdsale.setBuyerRate(buyer, 200).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a custom rate equal to zero', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            await this.crowdsale.setBuyerRate(buyer, 0).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a custom rate after crowdsale start', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            await advanceToBlock(this.startBlock - 1)
            await this.crowdsale.setBuyerRate(buyer, 200).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a custom rate equal to it', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            await this.crowdsale.setBuyerRate(buyer, 200)
            await this.crowdsale.setBuyerRate(buyer, 200).should.be.rejectedWith(EVMThrow)
        })

        it('only owner can set a custom rate', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            await this.crowdsale.setBuyerRate(buyer, 200, {from: buyer}).should.be.rejectedWith(EVMThrow)
        })
    })

    describe('set initial rate', function () {
        it('owner can set a initial rate', async function() {
            const { logs } = await this.crowdsale.setInitialRate(200)

            const event = logs.find(e => e.event === 'InitialRateChange')
            expect(event).to.exist
            event.args.rate.toNumber().should.equal(200)

            const initialRate = await this.crowdsale.initialRate()
            initialRate.toNumber().should.equal(200)
        })

        it('cannot set a initial rate equal to zero', async function() {
            await this.crowdsale.setInitialRate(0).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a initial rate after crowdsale start', async function() {
            await advanceToBlock(this.startBlock - 1)
            await this.crowdsale.setInitialRate(200).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a initial rate equal to it', async function() {
            await this.crowdsale.setInitialRate(initialRate).should.be.rejectedWith(EVMThrow)
        })

        it('only owner can set a initial rate', async function() {
            await this.crowdsale.setInitialRate(200, {from: buyer}).should.be.rejectedWith(EVMThrow)
        })
    })

    describe('set end rate', function () {
        it('owner can set a end rate', async function() {
            const { logs } = await this.crowdsale.setEndRate(200)

            const event = logs.find(e => e.event === 'EndRateChange')
            expect(event).to.exist
            event.args.rate.toNumber().should.equal(200)

            const endRate = await this.crowdsale.endRate()
            endRate.toNumber().should.equal(200)
        })

        it('cannot set a end rate equal to zero', async function() {
            await this.crowdsale.setEndRate(0).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a end rate after crowdsale start', async function() {
            await advanceToBlock(this.startBlock - 1)
            await this.crowdsale.setEndRate(200).should.be.rejectedWith(EVMThrow)
        })

        it('cannot set a end rate equal to it', async function() {
            await this.crowdsale.setEndRate(endRate).should.be.rejectedWith(EVMThrow)
        })

        it('only owner can set a end rate', async function() {
            await this.crowdsale.setEndRate(200, {from: buyer}).should.be.rejectedWith(EVMThrow)
        })
    })

    describe('get rate', function () {
        it('get preferential rate for a particular buyer', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            const preferentialRateForBuyer = 200
            await this.crowdsale.setBuyerRate(buyer, preferentialRateForBuyer)

            let rate = await this.crowdsale.getRate.call({from: buyer})
            rate.toNumber().should.equal(200)
        })

        it('get preferential rate for whitelisted buyer', async function() {
            await this.crowdsale.addToWhitelist(buyer)

            let rate = await this.crowdsale.getRate.call({from: buyer})
            rate.toNumber().should.equal(preferentialRate)
        })

        it('get rate for buyer', async function() {
            let rate = await this.crowdsale.getRate.call({from: buyer})
            rate.toNumber().should.equal(initialRate)
        })
    })
})
