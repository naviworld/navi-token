const config = require('./deploy/config');

const infuraProvider = require('./scripts/LedgerProvider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // eslint-disable-line camelcase
    },
    rinkeby: {
      provider: infuraProvider(4,'rinkeby'),
      network_id: 4, // eslint-disable-line camelcase
      gasPrice: config.gasPrice
    },
    live: {
      provider: infuraProvider(1,'mainnet'),
      network_id: 1, // eslint-disable-line camelcase
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
