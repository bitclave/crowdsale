'use strict';

/**
 * This class will be use only for deploy!
 * Because: Web3ProviderEngine does not support synchronous requests.
 */
module.exports = Provider;

const NetworkModel = require('../helpers/NetworkModel');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const ProviderEngine = require('web3-provider-engine');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const Web3 = require('web3');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');

const NETWORK_INFURA_MAIN = 'https://mainnet.infura.io/';
const NETWORK_INFURA_ROPSTEN = 'https://ropsten.infura.io/';
const NETWORK_TESTRPC = 'http://localhost:8545';
const NETWORK_ID_MAIN = 1;
const NETWORK_ID_ROPSTEN = 3;
const NETWORK_ID_TESTRPC = '*';

Provider.createMainNetwork = function (mnemonic) {
    return new Provider(new NetworkModel(NETWORK_ID_MAIN), NETWORK_INFURA_MAIN, mnemonic);
};

Provider.createRopstenNetwork = function (mnemonic) {
    return new Provider(new NetworkModel(NETWORK_ID_ROPSTEN), NETWORK_INFURA_ROPSTEN, mnemonic);
};

Provider.createTestRpcNetwork = function (mnemonic) {
    return new Provider(new NetworkModel(NETWORK_ID_TESTRPC), NETWORK_TESTRPC, mnemonic);
};

function Provider(networkModel, networkUrl, mnemonic) {
    const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));

    const wallet_hdpath = "m/44'/60'/0'/0/";
    const wallet = hdwallet.derivePath(wallet_hdpath + '0').getWallet();
    const engine = new ProviderEngine();
    engine.addProvider(new FilterSubprovider());
    engine.addProvider(new WalletSubprovider(wallet, {}));
    engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(networkUrl)));
    networkModel.from = '0x' + wallet.getAddress().toString('hex');
    networkModel.provider = engine;
    this._network = networkModel;
}

Provider.prototype.getNetwork = function () {
    this._network.provider.start();
    return this._network;
};

Provider.prototype.stop = function () {
    this._network.provider.stop();
};
