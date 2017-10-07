import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

// const Crowdsale = artifacts.require('CATCrowdsale')
const Crowdsale = artifacts.require('CATCrowdsale2')
// const MintableToken = artifacts.require('MintableToken')
const CAToken = artifacts.require('./CAToken.sol');

contract('Crowdsale', function ([_, investor, wallet, purchaser, bitClaveWallet, presaleWallet, wallet2, wallet3, wallet4]) {

  const rate = new BigNumber(1000)
  const value = ether(42)

  const tokenDecimals = 18;
  const tokensForOwner = 1 * (10**9);
  const tokensForPresale = 150 * (10**6);

  const expectedTokenAmount = rate.mul(value)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.crowdsale = await Crowdsale.new(this.startTime, this.endTime, rate, wallet, wallet4, bitClaveWallet, presaleWallet)
    //await this.crowdsale.setPaused(false);

    this.token = CAToken.at(await this.crowdsale.token())

    // let tknowner = await this.token.owner();
    // console.log("tknowner=", tknowner);
    // console.log("conrtact=", this.crowdsale.address);

    await this.crowdsale.pauseToken();

    let tknPaused = await this.token.paused();
    // console.log("tknPaused", tknPaused);
    tknPaused.should.equal(true);
  })

  describe('contract creation stress test', function () {
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
    it ('create contract', async function()
    {
        await this.crowdsale.setPaused(false);
        // console.log("here4");
    })
  })

  
  it('should be token owner', async function () {
    const owner = await this.token.owner()
    owner.should.equal(this.crowdsale.address)
  })

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded()
    ended.should.equal(false)
    await increaseTimeTo(this.afterEndTime)
    ended = await this.crowdsale.hasEnded()
    ended.should.equal(true)
  })

  it('creates 1 billion of tokens for its creator', async function () {

      let crowdsale = this.crowdsale;
      let token = this.token;
      
      await crowdsale.setPaused(false);
      // console.log("here4");
      

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
          else if (response.args.beneficiary == presaleWallet) {
              // Check event arguments
              response.args.amount.should.be.bignumber.equal(tokensForPresale * (10**tokenDecimals));

              // Check balace
              const balance = await token.balanceOf(presaleWallet);
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

      // console.log("here4a");
      let crowdsale = this.crowdsale;
      let token = this.token;

      await crowdsale.setPaused(false);
      // console.log("here4b");

      {
          await increaseTimeTo(this.startTime + duration.hours(5))

          // Create 700 CAT for wallet2
          let tx = await crowdsale.buyTokens(wallet2, {from: wallet2, value: web3.toWei('700', 'ether')/rate});
      // console.log("here4c");
      //     let tx = await crowdsale.buyTokens(investor, {from: purchaser, value: 700});
      // console.log("here4d");
          
          // console.log(tx);
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

      {
          // Create 800 CAT for wallet2
          // console.log('zzz')
          await crowdsale.buyTokens(wallet3, {from: wallet3, value: web3.toWei('800', 'ether')/rate});

          const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
          const promise = new Promise(resolve => event.watch(async function(error, response) {

              // Check event arguments
              response.args.beneficiary.should.equal(wallet3);
              response.args.amount.should.be.bignumber.equal(800 * (10**tokenDecimals));

              // Check balance
              const balance = await token.balanceOf(wallet3);
              balance.should.be.bignumber.equal(800 * (10**tokenDecimals));

              // Check supply
              const totalSupply = await token.totalSupply();
              totalSupply.should.be.bignumber.equal((tokensForOwner + tokensForPresale + 700 + 800) * (10**tokenDecimals));

              event.stopWatching();
              resolve();
          }));

          await promise;
      }
  })

  describe('minitng', function () {

    it('should accept minitng before start for preICO', async function () {
      await this.crowdsale.mintTokens(investor, 100).should.be.fulfilled
    })

    it('should accept minitng after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.mintTokens(investor, 100).should.be.fulfilled
    })

    it('should reject minitng after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.mintTokens(investor, 100).should.be.rejectedWith(EVMThrow)
    })
  })


  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments while paused', async function () {
      await increaseTimeTo(this.startTime + duration.hours(5))
      // await this.crowdsale.setPaused(true);

      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after unpaused', async function () {
      await increaseTimeTo(this.startTime + duration.hours(5))
      
      await this.crowdsale.setPaused(false);
      let p = await this.crowdsale.paused();
      // console.log("paused=", p);
      // let chk1 = await this.crowdsale.checkPurchase1();
      // console.log("chk1=", chk1);
      // let chk2 = await this.crowdsale.checkPurchase2();
      // console.log("chk2=", chk2);
      // let chk3 = await this.crowdsale.checkPurchase3();
      // console.log("chk3=", chk3);

      await this.crowdsale.sendTransaction({value: 123, from: investor}).should.be.fulfilled
      await this.crowdsale.buyTokens(investor, {value: 456, from: purchaser}).should.be.fulfilled
      let balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal((123+456)*rate);
      // console.log("balance after purchase", balance);

    })

    it('should reject transfer for paused token', async function () {
      await increaseTimeTo(this.startTime + duration.hours(5))
      await this.crowdsale.setPaused(false);
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.fulfilled
      
      // let balance = await this.token.balanceOf(investor);
      // console.log("balance", balance);
      await this.token.transfer(wallet3, 5, {from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should allow transfer for unpaused token', async function () {
      await increaseTimeTo(this.startTime + duration.hours(6))
      await this.crowdsale.setPaused(false);
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.fulfilled

      // let balance = await this.token.balanceOf(investor);
      // console.log("balance", balance);

      await this.crowdsale.unpauseToken();
      await this.token.transfer(wallet3, 5, {from: investor}).should.be.fulfilled
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.rejectedWith(EVMThrow)
    })

  })

  // describe('high-level purchase', function () {

  //   beforeEach(async function() {
  //     await increaseTimeTo(this.startTime)
  //   })

  //   it('should log purchase', async function () {
  //     const {logs} = await this.crowdsale.sendTransaction({value: value, from: investor})

  //     const event = logs.find(e => e.event === 'TokenPurchase')

  //     should.exist(event)
  //     event.args.purchaser.should.equal(investor)
  //     event.args.beneficiary.should.equal(investor)
  //     event.args.value.should.be.bignumber.equal(value)
  //     event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
  //   })

  //   it('should increase totalSupply', async function () {
  //     await this.crowdsale.send(value)
  //     const totalSupply = await this.token.totalSupply()
  //     totalSupply.should.be.bignumber.equal(expectedTokenAmount)
  //   })

  //   it('should assign tokens to sender', async function () {
  //     await this.crowdsale.sendTransaction({value: value, from: investor})
  //     let balance = await this.token.balanceOf(investor);
  //     balance.should.be.bignumber.equal(expectedTokenAmount)
  //   })

  //   it('should forward funds to wallet', async function () {
  //     const pre = web3.eth.getBalance(wallet)
  //     await this.crowdsale.sendTransaction({value, from: investor})
  //     const post = web3.eth.getBalance(wallet)
  //     post.minus(pre).should.be.bignumber.equal(value)
  //   })

  // })

//   describe('low-level purchase', function () {

//     beforeEach(async function() {
//       await increaseTimeTo(this.startTime)
//     })

//     it('should log purchase', async function () {
//       const {logs} = await this.crowdsale.buyTokens(investor, {value: value, from: purchaser})

//       const event = logs.find(e => e.event === 'TokenPurchase')

//       should.exist(event)
//       event.args.purchaser.should.equal(purchaser)
//       event.args.beneficiary.should.equal(investor)
//       event.args.value.should.be.bignumber.equal(value)
//       event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
//     })

//     it('should increase totalSupply', async function () {
//       await this.crowdsale.buyTokens(investor, {value, from: purchaser})
//       const totalSupply = await this.token.totalSupply()
//       totalSupply.should.be.bignumber.equal(expectedTokenAmount)
//     })

//     it('should assign tokens to beneficiary', async function () {
//       await this.crowdsale.buyTokens(investor, {value, from: purchaser})
//       const balance = await this.token.balanceOf(investor)
//       balance.should.be.bignumber.equal(expectedTokenAmount)
//     })

//     it('should forward funds to wallet', async function () {
//       const pre = web3.eth.getBalance(wallet)
//       await this.crowdsale.buyTokens(investor, {value, from: purchaser})
//       const post = web3.eth.getBalance(wallet)
//       post.minus(pre).should.be.bignumber.equal(value)
//     })

//   })

})
