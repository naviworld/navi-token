const path = require('path');
const fs = require('fs');


const NaviToken = require('./build/contracts/NaviToken.json');
const Web3 = require('web3');

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

// set parameters -------------------------------------------------
var urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
var ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
var contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('contractAddress = ' + contractAddress)

let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))
console.log('Web3 OK')

var naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);

//web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
console.log('unlockAccount OK')
web3.eth.defaultAccount = web3.eth.accounts[0];


var addressToRetrieveClass2 = '0xf17f52151ebef6c7334fad080c5704d77216b732';
var addressToRetrieveClass0 = '0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5';
var addressToRetrieveClass1 = '0x0d1d4e623d10f9fba5db95830f7d3839406c6af2';

naviContract.getAddressAndBalance.call(addressToRetrieveClass1, function(error, result){
    if (!error) {

        retAddress = result[0];
        retAmount = result[1];

        console.log("getAddressBalance called : " + retAmount + " tokens found for " + retAddress); 

    } else {
        console.log("ERROR: " +error);
    }
});
   
  