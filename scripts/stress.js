// @flow
'use strict';

const ownerPrivateKey = '';
const contractAddress = '';
const gasToContract = 90000; // Should be at least 1000 greater than needed
const gasPrice = 21 * 10**9; // 21 Gwei
const accCount = 10;
const txCount = 10;

const Web3 = require('web3');
var readlineSync = require('readline-sync');
const BigNumber = Web3.BigNumber;

(async function () {    
    const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    const everyAccountBalance = gasPrice * gasToContract * txCount;
    console.log('Going to spend ' + everyAccountBalance * accCount / (10**18) + ' ETH on stress');

    if (ownerPrivateKey.length != 66) {
        console.log('ownerPrivateKey should be of length 66');
        return;
    }
    if (contractAddress.length != 42) {
        console.log('contractAddress should be of length 42');
        return;
    }
    const ownerAccount = web3.eth.accounts.privateKeyToAccount(ownerPrivateKey);
    web3.eth.defaultAccount = ownerAccount.address;
    console.log(ownerAccount);

    var nonce = await web3.eth.getTransactionCount(ownerAccount.address);
    console.log('Nonce = ' + nonce);

    // Create and print wallets with private keys

    const offset = web3.eth.accounts.wallet.length + 1;
    web3.eth.accounts.wallet.add(ownerAccount);
    web3.eth.accounts.wallet.create(accCount);
    for (var i = offset; i <= accCount; i++) {
        console.log('Wallet #' + i + ': ' + JSON.stringify(web3.eth.accounts.wallet[i]));
    }

    // Send money to wallets

    var promises = [];
    for (var i = 0; i < accCount; i++) {
        const account = web3.eth.accounts.wallet[offset + i];
        promises.push(web3.eth.sendTransaction({
            from: ownerAccount.address,
            to: account.address,
            value: everyAccountBalance,
            gasPrice: gasPrice,
            gasLimit: 21000,
            nonce: nonce++,
        }));
    }
    console.log('Waiting for ' + promises.length + ' accounts filling ...');
    try {
        await Promise.all(promises);
    } catch (e) {
        console.log(e);
        readlineSync.question('Press ENTER when mined ... ');
    }
    console.log('Done');

    // Send money to contract

    var transactions = [];
    for (var i = offset; i < web3.eth.accounts.wallet.length; i++) {
        const account = web3.eth.accounts.wallet[i];
        const rawTx = {
            from: account.address,
            to: contractAddress,
            value: everyAccountBalance / txCount - (gasToContract - 1000) * gasPrice, // About
            gasPrice: gasPrice,
            gas: (gasToContract - 1000),
        };

        rawTx.gas = await web3.eth.estimateGas(rawTx);
        rawTx.value = everyAccountBalance / txCount - rawTx.gas * rawTx.gasPrice;

        console.log('From ' + account.address + ':');
        for (var j = 0; j < txCount; j++) {
            rawTx.from = account.address;
            rawTx.nonce = j;
            console.log('Tx #' + j + ' = ' + JSON.stringify(rawTx));
            transactions.push(web3.eth.sendTransaction(rawTx));
        }
    }
    console.log('Waiting for ' + transactions.length + ' transactions mining ...');
    await Promise.all(transactions);
    console.log('Done');

    // Perform cashbacks

    // var cashbacks = [];
    // for (var i = offset; i < web3.eth.accounts.wallet.length; i++) {
    //     const account = web3.eth.accounts.wallet[i];
    //     const balance = await web3.eth.getBalance(account.address);
    //     if (balance > 21000 * gasPrice) {
    //         cashbacks.push(web3.eth.sendTransaction({
    //             from: account.address,
    //             to: ownerAccount.address,
    //             value: balance - 21000*gasPrice,
    //             gasPrice: gasPrice,
    //             gasLimit: 21000,
    //             nonce: txCount,
    //         }));
    //     }
    // }
    // console.log('Waiting for ' + cashbacks.length + ' cashbacks mining ...');
    // await Promise.all(cashbacks);
    // console.log('Done');

})();
