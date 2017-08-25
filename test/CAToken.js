const { EVMThrow } = require('./utils')
const CAToken = artifacts.require('./CAToken.sol')

const BigNumber = web3.BigNumber


contract('CAToken', function ([owner, holder]) {
  beforeEach(async function () {
    this.token = await CAToken.new()
  })

  it('should put 2MM CAT in total supply', async function () {
    let totalSupply = await this.token.totalSupply.call()
    assert.equal(totalSupply.toNumber(), 2e+27, "2MM wasn't in totalSupply")
  })

  it('should put 2MM CAT in the owner account', async function () {
    let balance = await this.token.balanceOf(owner)
    assert.equal(balance.toNumber(), 2e+27, "2MM wasn't in the owner balance")
  })
})
