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

const Crowdsale = artifacts.require('./CATCrowdsale.sol')
const CAToken = artifacts.require('./PreCAToken.sol');

contract('Crowdsale random tests', function ([_, investor, wallet, purchaser, bitClaveWallet, wallet2, wallet3, wallet4]) {

  const rateCatInOneEth = 3000;
  const rateUsdInOneCat = 0.10;
  const rate = new BigNumber(rateCatInOneEth);
  const value = ether(42);

  const tokenDecimals = 18;
  const tokensForOwner = new BigNumber(1 * (10**9));
  const tokensForPresale = new BigNumber(150 * (10**6));

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.days(60);
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.crowdsale = await Crowdsale.new(this.startTime, this.endTime, rate, wallet, wallet4, bitClaveWallet)

    await this.crowdsale.setBonusesForTimes(
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

    await this.crowdsale.setBonusesForAmounts(
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

    //await this.crowdsale.unpause();

    this.token = CAToken.at(await this.crowdsale.token())

    await this.crowdsale.mintPresaleTokens(tokensForPresale * (10**tokenDecimals));
    // console.log("after mintPresaleTokens");

    // let tknowner = await this.token.owner();
    // console.log("tknowner=", tknowner);
    // console.log("conrtact=", this.crowdsale.address);

    let tknPaused = await this.token.paused();
    // console.log("tknPaused", tknPaused);
    if (!tknPaused)
    {
      await this.crowdsale.pauseTokens();

    }
    tknPaused = await this.token.paused();
    tknPaused.should.equal(true);
  })

  describe('contract creation stress test', function () {
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
    })
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
    })
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
    })
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
    })
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
    })
    it ('create contract', async function()
    {
        await this.crowdsale.unpause();
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
      
      await crowdsale.unpause();

      const event = token.Mint({_from:web3.eth.coinbase}, {fromBlock: 0});
      const promise = new Promise(resolve => event.watch(async function(error, response) {

          // Check supply
          const totalSupply = await token.totalSupply();
          totalSupply.should.be.bignumber.equal((tokensForOwner.add(tokensForPresale)).mul(10**tokenDecimals));

          if (response.args.to == bitClaveWallet) {
              // Check event arguments
              response.args.amount.should.be.bignumber.equal(tokensForOwner.mul(10**tokenDecimals));

              // Check balace
              const balance = await token.balanceOf(bitClaveWallet);
              balance.should.be.bignumber.equal(tokensForOwner.mul(10**tokenDecimals));
          }
          else if (response.args.to == crowdsale.address) {
              // Check event arguments
              response.args.amount.should.be.bignumber.equal(tokensForPresale.mul(10**tokenDecimals));

              // Check balace
              const balance = await token.balanceOf(crowdsale.address);
              balance.should.be.bignumber.equal(tokensForPresale.mul(10**tokenDecimals));

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

      let crowdsale = this.crowdsale;
      let token = this.token;

      await crowdsale.unpause();
      await increaseTimeTo(this.startTime + duration.hours(25))

      {
          let contribInEth = new BigNumber(0.25);
          let contribInWei = web3.toWei(contribInEth, 'ether');
          let contribInUsd = contribInEth.mul(rateCatInOneEth).mul(rateUsdInOneCat);

          let tx = await crowdsale.buyTokens(wallet2, {from: wallet2, value: contribInWei});
          // console.log(tx);

          const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
          const promise = new Promise(resolve => event.watch(async function(error, response) {

            let bonusCoefficient = await crowdsale.BONUS_COEFF.call();
            let bonus = await crowdsale.computeBonus(contribInUsd);
            let rateWithBonus = rate.mul(bonusCoefficient.add(bonus)).div(bonusCoefficient);
            let expectedTokenAmount = new BigNumber(contribInWei.mul(rateWithBonus));

            let expectedTokenAmountWith_NO_Bonus = contribInWei.mul(rate);
            let expectedTokenAmountWithBonus = contribInWei.mul(rate).mul(bonusCoefficient.add(bonus)).div(bonusCoefficient);
            // console.log("1: bonus", bonus);
            // console.log("1: rate", rate);
            // console.log("1: rateWithBonus", rateWithBonus);
            // console.log("1: expectedTokenAmount", expectedTokenAmount);
            // console.log("1: expectedTokenAmountWithBonus", expectedTokenAmountWithBonus);
            // console.log("1: expectedTokenAmountWith_NO_Bonus", expectedTokenAmountWith_NO_Bonus);

              // Check event arguments
              response.args.beneficiary.should.equal(wallet2);
              response.args.amount.should.be.bignumber.equal(expectedTokenAmount);

              // Check balance
              const balance = await token.balanceOf(wallet2);
              balance.should.be.bignumber.equal(expectedTokenAmount);

              // Check supply
              const totalSupply = await token.totalSupply();
              totalSupply.should.be.bignumber.equal(
                ((tokensForOwner.add(tokensForPresale)).mul(10**tokenDecimals)).add(expectedTokenAmount)
              );

              event.stopWatching();
              resolve();
          }));

          await promise;
      }

      {
          let contribInEth = new BigNumber(30);
          let contribInWei = web3.toWei(contribInEth, 'ether');
          let contribInUsd = contribInEth.mul(rateCatInOneEth).mul(rateUsdInOneCat);
          // console.log("contribInUsd", contribInUsd)

          let curSupply = await token.totalSupply();

          await crowdsale.buyTokens(wallet3, {from: wallet3, value: contribInWei});

          const event = crowdsale.TokenPurchase({_from:web3.eth.coinbase}, {fromBlock: 'latest'});
          const promise = new Promise(resolve => event.watch(async function(error, response) {
            let bonusCoefficient = await crowdsale.BONUS_COEFF.call();
            let bonus = await crowdsale.computeBonus(contribInUsd);
            let rateWithBonus = rate.mul(bonusCoefficient.add(bonus)).div(bonusCoefficient);
            let expectedTokenAmount = new BigNumber(contribInWei.mul(rateWithBonus));

            let expectedTokenAmountWith_NO_Bonus = contribInWei.mul(rate);
            let expectedTokenAmountWithBonus = contribInWei.mul(rate).mul(bonusCoefficient.add(bonus)).div(bonusCoefficient);
              

            // console.log("2: bonus", bonus);
            // console.log("2: rate", rate);
            // console.log("2: rateWithBonus", rateWithBonus);
            // console.log("2: expectedTokenAmount", expectedTokenAmount);
            // console.log("2: expectedTokenAmountWithBonus", expectedTokenAmountWithBonus);
            // console.log("2: expectedTokenAmountWith_NO_Bonus", expectedTokenAmountWith_NO_Bonus);
              

              // Check event arguments
              response.args.beneficiary.should.equal(wallet3);
              response.args.amount.should.be.bignumber.equal(expectedTokenAmount);

              // Check balance
              const balance = await token.balanceOf(wallet3);
              balance.should.be.bignumber.equal(expectedTokenAmount, "checking expectedTokenAmount");

              // Check supply
              const totalSupply = await token.totalSupply();
              
              totalSupply.should.be.bignumber.equal(curSupply.add(expectedTokenAmount), "checking total supply");

              event.stopWatching();
              resolve();
          }));

          await promise;
      }
  })

  describe('minting', function () {

    it('should accept minting before start for preICO', async function () {
      await this.crowdsale.mintTokens(investor, 100).should.be.fulfilled
    })

    it('should accept minting after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.mintTokens(investor, 100).should.be.fulfilled
    })

    it('should not accept minting after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.mintTokens(investor, 100).should.be.rejectedWith(EVMThrow)
    })

    it('should reject minting after finalized', async function () {
      await increaseTimeTo(this.afterEndTime);
      await this.crowdsale.finalize()
      await this.crowdsale.mintTokens(investor, 100).should.be.rejectedWith(EVMThrow)
      await this.token.finishMinting().should.be.rejectedWith(EVMThrow);
      await this.token.mint(investor, 100).should.be.rejectedWith(EVMThrow)
      // await this.token.mint(investor, 1000000000*10**18)
      // const totalSupply = await this.token.totalSupply();
      // console.log("totalSupply", totalSupply);
    })
    
  })


  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments while paused', async function () {
      await increaseTimeTo(this.startTime + duration.hours(5))
      // await this.crowdsale.pause();

      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {from: purchaser, value: value}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after unpaused', async function () {
      await increaseTimeTo(this.startTime + duration.days(50))
      
      await this.crowdsale.unpause();
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
      await this.crowdsale.unpause();
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.fulfilled
      
      // let balance = await this.token.balanceOf(investor);
      // console.log("balance", balance);
      await this.token.transfer(wallet3, 5, {from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should allow transfer for unpaused token', async function () {
      await increaseTimeTo(this.startTime + duration.hours(6))
      await this.crowdsale.unpause();
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.fulfilled

      // let balance = await this.token.balanceOf(investor);
      // console.log("balance", balance);

      await this.crowdsale.unpauseTokens();
      await this.token.transfer(wallet3, 5, {from: investor}).should.be.fulfilled
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.send(value).should.be.rejectedWith(EVMThrow)
      await this.crowdsale.buyTokens(investor, {value: value, from: purchaser}).should.be.rejectedWith(EVMThrow)
    })

  })
})
