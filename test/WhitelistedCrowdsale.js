import { ether, EVMThrow } from './utils'

const BigNumber = web3.BigNumber

const WhitelistedCrowdsale = artifacts.require('./helpers/WhitelistedCrowdsaleImpl.sol')
const MintableToken = artifacts.require('zeppelin-solidity/contracts/tokens/MintableToken')


contract('WhitelistCrowdsale', function ([_, owner, wallet, beneficiary, sender]) {
  	const rate = 1000
  	const amount = ether(1)

  	beforeEach(async function () {
    	let startBlock = web3.eth.blockNumber + 10
    	let endBlock = startBlock + 10

	    this.crowdsale = await WhitelistedCrowdsale.new(startBlock, endBlock, rate, wallet, {from: owner})
    	this.token = MintableToken.at(await this.crowdsale.token())
  	})

	it('should add address to whitelist', async function () {
      	let whitelisted = await this.crowdsale.isWhitelisted(sender)
	  	whitelisted.should.equal(false)

      	await this.crowdsale.addToWhitelist(sender, {from: owner})

      	whitelisted = await this.crowdsale.isWhitelisted(sender)
      	whitelisted.should.equal(true)
    })

	it('should remove address from whitelist', async function () {
		await this.crowdsale.addToWhitelist(sender, {from: owner})

		let whitelisted = await this.crowdsale.isWhitelisted(sender)
		whitelisted.should.equal(true)

		await this.crowdsale.removeFromWhitelist(sender, {from: owner})

		whitelisted = await this.crowdsale.isWhitelisted(sender)
		whitelisted.should.equal(false)
	})

    it('should reject non-whitelisted sender', async function () {
      	await this.crowdsale.buyTokens(beneficiary, {value: amount, from: sender}).should.be.rejectedWith(EVMThrow)
    })

    it('should sell to whitelisted address', async function () {
      	await this.crowdsale.addToWhitelist(sender, {from: owner})
      	await this.crowdsale.buyTokens(beneficiary, {value: amount, from: sender}).should.be.fulfilled
    })
})
