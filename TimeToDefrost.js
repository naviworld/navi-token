const path = require('path');
const fs = require('fs');
  

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

const DEFROSTED_LOG_ROOT = path.resolve(__dirname) + '/DEFROSTED/'


// set parameters -------------------------------------------------
var urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
var ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
var contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('contractAddress = ' + contractAddress)



const NaviToken = require('./build/contracts/NaviToken.json');
const Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))

// PROGRAM VARIABLES (local)
var cntTimer = parseInt(0)
var defrostTimerId = -1
var naviContract;

// FROM FILES VARIABLES
var vAccounts;        // accounts/amounts from txt file

// init ethereum DRT smart contract ----------------------------------------------------------
naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);

//check we can defrost  (blockchain timestamp > )
var startico = naviContract.getStartIcoTimestamp();
console.log('------------------->>  startico = ' + startico)
var rightnow = naviContract.getNow();
console.log('------------------->>  rightnow = ' + rightnow)

var diff_minutes = (rightnow - startico)/60;
console.log('------------------->>  diff_minutes From ICO Start = ' + diff_minutes)
console.log('');
if(diff_minutes<0){
    console.log('------------------->>  CANNOT DEFROST BEFORE ICO LAUNCH !!! ')
}else{
    var monthsElapsed = naviContract.elapsedMonthsFromICOStart();
    console.log('------------------->>  monthsElapsed From ICO Start = ' + monthsElapsed)
    var canDefrostEquities = naviContract.canDefrostEquities();
    console.log('------------------->>  canDefrost Equities = ' + canDefrostEquities)
    var canDefrostTeamAndAdvisors = naviContract.canDefrostEquities();
    console.log('------------------->>  canDefrost TeamAndAdvisors = ' + canDefrostTeamAndAdvisors)
}


