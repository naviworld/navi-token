"use strict";

require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const config = require('./../deploy/config');

const HDWalletProvider = require('truffle-hdwallet-provider');

const accountId =  config.accountId;

const providerForLedger = (networkId, rpcEndpoint) =>
  HDWalletProvider.LedgerProvider(networkId, accountId, rpcEndpoint);

const infuraProvider = (networkId, network) => providerForLedger(
  networkId,
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

module.exports = infuraProvider;
