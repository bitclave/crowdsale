require('babel-register');
require('babel-polyfill');
const Provider = require('./helpers/Provider');
const ProviderRopsten = Provider.createRopstenNetwork('couch solve unique spirit wine fine occur rhythm foot feature glory away');

module.exports = {
    networks: {
        ropsten: ProviderRopsten.getNetwork(),
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
