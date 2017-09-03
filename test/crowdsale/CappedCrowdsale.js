import { ether, EVMThrow } from '../utils'

const CappedCrowdsale = artifacts.require('../helpers/CappedCrowdsaleImpl')
const CAToken = artifacts.require('../../contracts/CAToken')


contract('CappedCrowdsale', function ([_, owner, wallet, beneficiary, sender]) {
    const cap = 2e+27  // 2MM
    const rate = 0.05e+18  // $0.05
    const ethRate = 340e+18  // $340.00
    const amount = ether(0.5)

    beforeEach(async function () {
        let startBlock = web3.eth.blockNumber + 10
        let endBlock = startBlock + 10

        this.crowdsale = await CappedCrowdsale.new(
            startBlock,
            endBlock,
            rate,
            rate,
            rate,
            ethRate,
            cap,
            wallet
        )
        this.token = CAToken.at(await this.crowdsale.token())
    })

    it('CappedCrowdsale()', async function() {
        const cap = await this.crowdsale.cap()
        cap.toNumber().should.equal(2e+27)  // 2 MM
    })

    it('getAmountToken()', async function() {
        let amountToken = await this.crowdsale.getAmountTokenImpl.call(amount)
        amountToken.toNumber().should.equal(3400e+18)  // 3400 CAT
    })

    describe('hasEnded()', function () {
        it('crowdsale  is not over', async function() {
            let hasEnded = await this.crowdsale.hasEnded.call()
            hasEnded.should.equal(false)
        })

        it('the hard cap is finished', async function() {
            await this.crowdsale.addTokensImpl(beneficiary, cap)

            let hasEnded = await this.crowdsale.hasEnded.call()
            hasEnded.should.equal(true)
        })
    })

    describe('validPurchase()', function () {
        // todo title
        // it('success', async function () {
        //     await this.crowdsale.addToWhitelist(sender)
        //     await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).fulfilled
        // })

        // // todo title
        // it('hasEnded() error', async function () {
        //     await this.crowdsale.addToWhitelist(sender)
        //     await advanceToBlock(this.endBlock)

        //     await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).should.be.rejectedWith(EVMThrow)
        // })

        // it('!isWhitelisted() error', async function () {
        //     await this.crowdsale.buyTokens(beneficiary, {amount, from: sender}).should.be.rejectedWith(EVMThrow)
        // })
    })
})
