const path = require('path');
const fs = require('fs');
  

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const ACCOUNTSAMOUNTS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_input_accounts_amounts.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

const DEFROSTED_LOG_ROOT = path.resolve(__dirname) + '/DEFROSTED/'


// set parameters -------------------------------------------------
let urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
let ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
let contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('filePathAccountsAmounts = ' + ACCOUNTSAMOUNTS_FILEPATH)
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
let rightnow = naviContract.getBlockTimestamp();
console.log('------------------->>  rightnow = ' + rightnow)

let monthsElapsed = naviContract.elapsedMonthsFromICOStart();
console.log('------------------->>  elapsed months from ICO Start = ' + monthsElapsed)
let canDefrost = naviContract.canDefrostAdvisors();
console.log('------------------->>  canDefrost = ' + canDefrost)

let lagAdvisorsDefrost = naviContract.lagAdvisorsDefrost();
console.log('------------------->>  lagAdvisorsDefrost = ' + lagAdvisorsDefrost)


if(canDefrost == true)
{

    // unlock ethereum base account
    //web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
    console.log('unlockAccount OK')
    web3.eth.defaultAccount = web3.eth.accounts[0];

    // read account/amounts file to assign -------------------------------------------------
    vAccounts  = require('fs').readFileSync(ACCOUNTSAMOUNTS_FILEPATH).toString().split('\n')
    console.log('NUM ACCOUNTS = ' + vAccounts.length)


    let vaddr = []
    let vamounts = []
    let vclasses = []
    for(i=0;i<vAccounts.length;i++){
        let vv = vAccounts[i].split(",");
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
    //let defrostIntervalSec = parseInt(4)
    //console.log('intervalSec = ' + defrostIntervalSec)
    //defrostTimerId = setInterval(timerDefrostFunction, defrostIntervalSec * 1000);

    tryDefrostAdvisors();
}


function estimateGas(dataparam){

	let estimatedGas = web3.eth.estimateGas({data: dataparam})
    	gasLimit = web3.eth.getBlock("latest").gasLimit
	    gasOk=0 
    	if(estimatedGas  < gasLimit){
      		gasOk=estimatedGas;
    	}else{
      		gasOk=gasLimit;
    	}
	return gasOk;
}

function tryDefrostAdvisors() {

        console.log("into tryDefrostAdvisors()");
        // Advisors -------------------------------------
        dataparam = naviContract.defrostAdvisorsTokens.getData()
        //let gasOk = estimateGas(dataparam);

        naviContract.defrostAdvisorsTokens( { gas: 999000 },  function(error, result){
            if (!error) {
                console.log("defrostAdvisorsTokens OK:" + result);  // OK
                waitForBlock(result, false);
            } else {
                console.log("Error: calling defrostAdvisorsTokens => " + error); 
            }
        });   
}

// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function mySleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let waitdefrostIntervalSec = parseInt(5)

// We need to wait until any miner has included the transaction
// in a block to get the address of the contract
async function waitForBlock(txhash, isOwner) {
  while (true) {
    let receipt = web3.eth.getTransactionReceipt(txhash);
    if (receipt && receipt.blockNumber) {
        //console.log("Your defrostToken call has been mined in block " + receipt.blockNumber);
        //console.log("Note that it might take 30 - 90 seconds for the block to propagate before it's visible in etherscan.io");
        checkDefrostedAdvisors();
        waitdefrostTimerId = setInterval(timerWaitDefrostFunction, waitdefrostIntervalSec * 1000);
      	break;
    }
    //console.log("Waiting a mined block including your defrostToken call ... currently in block " + web3.eth.blockNumber);
    await mySleep(10000);
  }
}

// key.value js store
let vDefrostItems = new Object();
let cntToDefrost =0;
let cntDefrosted =0;
function checkDefrostedAdvisors() {

	let blockTimestamp = naviContract.getBlockTimestamp();
    let defrostedLogFile = DEFROSTED_LOG_ROOT + 'defrosted_advisors_' + blockTimestamp + '.txt'
    fs.appendFileSync(defrostedLogFile, blockTimestamp + '\n');

    for(i=0;i<vaddr.length;i++){
        let classInvestor = vclasses[i];
        if(classInvestor === 2){ // advisors
            let addr = vaddr[i];
            cntToDefrost++;
            naviContract.getAddressAndBalance(addr, function(error, result){
                if (!error) 
                {
		            icedaddr = result[0];
                    amount = result[1];
                    vDefrostItems[icedaddr] = amount;
                    cntDefrosted++;
                    console.log('ADVISORS => ' + icedaddr + " => amount defrosted: " + amount);     
		            let strlog = icedaddr + ";balance=" + amount;
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

        checkDefrosted_ADVISORS_TokenAmounts();

    }else{
        console.log('timerWaitDefrostFunction scheduler call ... WAITING for defrost END')
    }    
}    

let Decimals = 1000000000000000000
function checkDefrosted_ADVISORS_TokenAmounts() {
        
        for(i=0;i<vaddr.length;i++){
            let classInvestor = vclasses[i];
            if(classInvestor === 2){ // equity
                let icedaddr = vaddr[i];
                let amountToDefrost = vamounts[i];
                let amountDefrosted = Math.round(vDefrostItems[icedaddr] /  Decimals)
                if (Math.abs(amountDefrosted -  amountToDefrost) < 1) 
                {
                    console.log('ADVISORS OK => ' + icedaddr + " => amount to defrost: " + amountToDefrost + " => amount defrosted:" + amountDefrosted);     
                }
                else
                {
                    console.log('ADVISORS MISMATCH ERROR !!!!!!!!!!! => ' + icedaddr + " => amount to defrost: " + amountToDefrost + " => amount defrosted:" + amountDefrosted);     
                }
            }
        }
    }
    
