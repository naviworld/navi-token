const config = require('./deploy/config');

const infuraProvider = require('./scripts/LedgerProvider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    main: {
      provider: infuraProvider(config.networkId, config.networkName),
      network_id: config.networkId, // eslint-disable-line camelcase
      gasPrice: config.gasPrice
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
