const path = require('path');
const fs = require('fs');
  

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const ACCOUNTSAMOUNTS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_input_accounts_amounts.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

const DEFROSTED_LOG_ROOT = path.resolve(__dirname) + '/DEFROSTED/'


// set parameters -------------------------------------------------
var urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
var ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
var contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('filePathAccountsAmounts = ' + ACCOUNTSAMOUNTS_FILEPATH)
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

var minElapsed = naviContract.elapsedMonthsFromICOStart();
console.log('------------------->>  minElapsed From ICO Start = ' + minElapsed)
var canDefrost = naviContract.canDefrostEquities();
console.log('------------------->>  canDefrost = ' + canDefrost)


// unlock ethereum base account
web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
console.log('unlockAccount OK')
web3.eth.defaultAccount = web3.eth.accounts[0];

// read account/amounts file to assign -------------------------------------------------
vAccounts  = require('fs').readFileSync(ACCOUNTSAMOUNTS_FILEPATH).toString().split('\n')
console.log('NUM ACCOUNTS = ' + vAccounts.length)


var vaddr = []
var vamounts = []
var vclasses = []
for(i=0;i<vAccounts.length;i++){
    var vv = vAccounts[i].split(",");
    if(vv.length == 3){
        vaddr.push(vv[0]);
        vamounts.push(parseInt(vv[1]));
        vclasses.push(parseInt(vv[2]));
    }
    else if(vAccounts[i].length>0){
        console.log('Fatal error: item size mismatch  !!!!!!!!!!!!!!!!!!!!!!! ' + vAccounts[i])
    }
}

console.log('_____________________________________________________________________________')
// launch assign timer  ----------------------------------------------------------------
var defrostIntervalSec = parseInt(30) 
console.log('intervalSec = ' + defrostIntervalSec)
defrostTimerId = setInterval(timerDefrostFunction, defrostIntervalSec * 1000);

var cntTimer = parseInt(0)
function timerDefrostFunction() {

        console.log('timerDefrostFunction scheduler call ........  cntTimer = ' + cntTimer)
 
        /*if( ENDofDEFROST ){
            console.log('timer stopped //////////////////////////////////');
            clearInterval(defrostTimerId);
        }*/

       
        //if(canDefrost){
            tryDefrostEquities();
            clearTimeout(defrostTimerId);
        //}else{
        //    console.log('cannot defrost equities yet...')
        //}
        cntTimer++;
        console.log('.......................................................................')
}

function estimateGas(dataparam){

	var estimatedGas = web3.eth.estimateGas({data: dataparam})
    	gasLimit = web3.eth.getBlock("latest").gasLimit
	    gasOk=0 
    	if(estimatedGas  < gasLimit){
      		gasOk=estimatedGas;
    	}else{
      		gasOk=gasLimit;
    	}
	return gasOk;
}

function tryDefrostEquities() {

        // ADVISORS -------------------------------------
        dataparam = naviContract.defrostEquitiesTokens.getData()
        var gasOk = estimateGas(dataparam);   			

        naviContract.defrostEquitiesTokens( { gas: gasOk },  function(error, result){
            if (!error) {
                console.log("defrostEquitiesTokens OK:" + result);  // OK
                waitForBlock(result, false);
            } else {
                console.log("Error: calling defrostEquitiesTokens => " + error); 
            }
        });   
}

// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function mySleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var waitdefrostIntervalSec = parseInt(5) 

// We need to wait until any miner has included the transaction
// in a block to get the address of the contract
async function waitForBlock(txhash, isOwner) {
  while (true) {
    let receipt = web3.eth.getTransactionReceipt(txhash);
    if (receipt && receipt.blockNumber) {
        //console.log("Your defrostToken call has been mined in block " + receipt.blockNumber);
        //console.log("Note that it might take 30 - 90 seconds for the block to propagate before it's visible in etherscan.io");
        checkDefrostedEquities();
        //checkDefrostedAdvisors();
        waitdefrostTimerId = setInterval(timerWaitDefrostFunction, waitdefrostIntervalSec * 1000);
      	break;
    }
    //console.log("Waiting a mined block including your defrostToken call ... currently in block " + web3.eth.blockNumber);
    await mySleep(10000);
  }
}

// key.value js store
var vDefrostItems = new Object();
var cntToDefrost =0;
var cntDefrosted =0;
function checkDefrostedEquities() {

	var blockTimestamp = naviContract.getBlockTimestamp();
    var defrostedLogFile = DEFROSTED_LOG_ROOT + 'defrosted_' + blockTimestamp + '.txt'
    fs.appendFileSync(defrostedLogFile, blockTimestamp + '\n');

    for(i=0;i<vaddr.length;i++){
        var classInvestor = vclasses[i];
        if(classInvestor === 1){ // equity
            var addr = vaddr[i];
            cntToDefrost++;
            naviContract.getAddressAndBalance(addr, function(error, result){
                if (!error) 
                {
		            icedaddr = result[0];
                    amount = result[1];
                    vDefrostItems[icedaddr] = amount;
                    cntDefrosted++;
                    console.log('EQUITY => ' + icedaddr + " => amount defrosted: " + amount);     
		            var strlog = icedaddr + ";balance=" + amount;
		            fs.appendFileSync(defrostedLogFile, strlog + '\n');
                }
                else
                {
                    console.log("Error: calling getIcedInfos => " + error); 
                }
            })
        }
    }
}


function timerWaitDefrostFunction() {
    
    if(cntToDefrost > 0 && cntToDefrost === cntDefrosted){
        clearTimeout(waitdefrostTimerId);
        console.log('Defrost END  Defrost END  Defrost END  Defrost END  --------------------------')

        checkDefrostedEquitiesTokenAmounts();

    }else{
        console.log('timerWaitDefrostFunction scheduler call ... WAITING for defrost END')
    }    
}    

var Decimals = 1000000000000000000
function checkDefrostedEquitiesTokenAmounts() {
        
        for(i=0;i<vaddr.length;i++){
            var classInvestor = vclasses[i];
            if(classInvestor === 1){ // equity
                var icedaddr = vaddr[i];
                var amountToDefrost = vamounts[i] ;
                var amountDefrosted = Math.round(vDefrostItems[icedaddr] /  Decimals)
                if (amountDefrosted ==  amountToDefrost) 
                {
                    console.log('EQUITY OK => ' + icedaddr + " => amount to defrost: " + amountToDefrost + " => amount defrosted:" + amountDefrosted);     
                }
                else
                {
                    console.log('EQUITY MISMATCH ERROR !!!!!!!!!!! => ' + icedaddr + " => amount to defrost: " + amountToDefrost + " => amount defrosted:" + amountDefrosted);     
                }
            }
        }
    }
    
