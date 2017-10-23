require('babel-register');
require('babel-polyfill');

const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const ProviderEngine = require("web3-provider-engine");
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
const Web3Subprovider = require("web3-provider-engine/subproviders/web3.js");
const Web3 = require("web3");
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');

// Get our mnemonic and create an hdwallet
const mnemonic = "couch solve unique spirit wine fine occur rhythm foot feature glory away";
const hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));

// Get the first account using the standard hd path.
const wallet_hdpath = "m/44'/60'/0'/0/";
const wallet = hdwallet.derivePath(wallet_hdpath + "0").getWallet();
const address = "0x" + wallet.getAddress().toString("hex");

const providerUrl = "https://ropsten.infura.io/";
const engine = new ProviderEngine();
// filters
engine.addProvider(new FilterSubprovider());

engine.addProvider(new WalletSubprovider(wallet, {}));
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl)));
engine.start(); // Required by the provider engine.

module.exports = {
    networks: {
        ropsten: {
            network_id: 3,
            provider: engine,
            from: address,
            gas: 6000000
        },
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*",
            gas: 6000000
        },
        coverage: {
            host: "localhost",
            port: 8555,
            network_id: "*",
            gas: 0xffffffff
        }
    }
};
