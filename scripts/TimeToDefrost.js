const path = require('path');
const fs = require('fs');
  

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

const DEFROSTED_LOG_ROOT = path.resolve(__dirname) + '/DEFROSTED/'


// set parameters -------------------------------------------------
let urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
let ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
let contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('contractAddress = ' + contractAddress)



const NaviToken = require('./build/contracts/NaviToken.json');
const Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))

// PROGRAM letIABLES (local)
let cntTimer = parseInt(0)
let defrostTimerId = -1
let naviContract;

// FROM FILES letIABLES
let vAccounts;        // accounts/amounts from txt file

// init ethereum DRT smart contract ----------------------------------------------------------
naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);

//check we can defrost  (blockchain timestamp > )
let startico = naviContract.getStartIcoTimestamp();
console.log('------------------->>  startico = ' + startico)
let rightnow = naviContract.getNow();
console.log('------------------->>  rightnow = ' + rightnow)

let diff_minutes = (rightnow - startico)/60;
console.log('------------------->>  diff_minutes From ICO Start = ' + diff_minutes)
console.log('');
if(diff_minutes<0){
    console.log('------------------->>  CANNOT DEFROST BEFORE ICO LAUNCH !!! ')
}else{
    let monthsElapsed = naviContract.elapsedMonthsFromICOStart();
    console.log('------------------->>  monthsElapsed From ICO Start = ' + monthsElapsed)
    let canDefrostEquities = naviContract.canDefrostEquities();
    console.log('------------------->>  canDefrost Equities = ' + canDefrostEquities)
    let canDefrostTeamAndAdvisors = naviContract.canDefrostEquities();
    console.log('------------------->>  canDefrost TeamAndAdvisors = ' + canDefrostTeamAndAdvisors)
}


