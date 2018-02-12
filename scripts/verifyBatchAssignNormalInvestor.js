const path = require('path');
const fs = require('fs');


const NaviToken = require('./build/contracts/NaviToken.json');
const Web3 = require('web3');

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const PWD_FILEPATH = path.resolve(__dirname) + '/PARAMS/owner_pwd.txt'
const ACCOUNTSAMOUNTS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_input_accounts_amounts.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/smart-contract-address.txt'

// set parameters -------------------------------------------------
let urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
let ownerPassword = require('fs').readFileSync(PWD_FILEPATH, 'utf-8')
let contractAddress = require('fs').readFileSync(CONTRACTADDRESS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('ownerPwd = ' + ownerPassword)
console.log('filePathAccountsAmounts = ' + ACCOUNTSAMOUNTS_FILEPATH)
console.log('contractAddress = ' + contractAddress)

let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))
console.log('Web3 OK')

let naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);

//web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
console.log('unlockAccount OK')
web3.eth.defaultAccount = web3.eth.accounts[0];

console.log('')

//let vaddr = []
//let vamounts = []
//let viced = []
let lines = require('fs').readFileSync(ACCOUNTSAMOUNTS_FILEPATH, 'utf-8').split('\n');

let vmatchOK = []
let vmatchErr = []
let totalAssigned = parseInt(0)

let dict = [];
let dictIced = [];
let multDecimals = 1000000000000000000

let vv = lines[10].split(",");

let vmatchOK = []
let vmatchErr = []
let totalAssignedOnFile = 0
let totalAssignedOnEth = 0
for (let i=0; i<lines.length; i++) {
  let vv = lines[i].split(",");
  if(vv.length == 3){   
    let userAddress = vv[0];
    let userAmount = vv[1] * multDecimals; // decimals = 18
    dict[userAddress] = userAmount;    
    let classInvestor = parseInt(vv[2]);

    console.log(userAddress  + " - classInvestor = " + classInvestor )

    if(classInvestor == 0){ // not iced
        
        totalAssignedOnFile += parseInt(vv[1]);
        naviContract.getAddressAndBalance.call(userAddress, function(error, result){

            if (!error) {

                retAddress = result[0];
                retAmount = result[1];

                console.log("getAddressBalance called : " + retAmount + " tokens found for " + retAddress+ " ----  good = " + dict[retAddress]); 

                if( retAmount == dict[retAddress] ){
                    totalAssignedOnEth += (retAmount / multDecimals)
                    let strOk = retAddress + "  -  AMOUNT MATCHING OK = " + retAmount + " ->  numTokensAssigned = " + totalAssigned;
                    vmatchOK.push(strOk)
                }else{
                    let strErr = "!!!!  INVESTOR INVESTOR ERROR ERROR ERROR:  " + dict[retAddress] + "  -  amount MISMATCH ERROR = " + retAmount;
                    console.log(strErr)
                    vmatchErr.push(strErr)
                }
            } else {
                console.log(error);
            }
        });
    } 
    else // iced
    {
        /*dictIced[userAddress] = userAmount;
        naviContract.getIcedInfos(userAddress, function(error, result){
            if (!error) {
                icedAddr = result[0];
		        balance = parseInt(result[1]);
                frosted = parseInt(result[2]);
                defrosted = parseInt(result[3]);
		        balanceAttendue = parseInt(dictIced[icedAddr]) * 20 / 100

		        //console.log("dictIced[icedAddr] = " + parseInt(dictIced[icedAddr]))
                console.log("getIcedInfos called => balanceAttendue: " + balanceAttendue + " - balance: " + balance + ", frosted: " + frosted + ", defrosted: " + defrosted); 
		
                if( balance === balanceAttendue ){
                    totalAssigned +=((frosted + defrosted)*multDecimals)
                    let strOk = icedAddr + "  -  AMOUNT MATCHING OK = " + balance + " ->  numTokensAssigned = " + totalAssigned;
                    vmatchOK.push(strOk)
                }else{
                    let strErr = "!!!!  ICED ICED ERROR ERROR ERROR:  " + userAddress+ "  - amount MISMATCH ERROR = " + balance + " attendue = " + balanceAttendue;
                    console.log(strErr)
                    vmatchErr.push(strErr)
                }
            } else {
                console.log(error);
            }
        });*/
    }
   
  }
}

const NUMTOKENSENT_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_number_of_tokens.txt'
let sentNumberOfToken = parseInt(require('fs').readFileSync(NUMTOKENSENT_FILEPATH, 'utf-8'))
sentNumberOfToken = sentNumberOfToken;

let cnt=0
let waitTimerID = setInterval(function() {
        if(cnt==0){console.log('')}
        if(totalAssignedOnFile === totalAssignedOnEth){
            
            console.log('')
            console.log('CHECK OK : all tokens were correctly assigned')
            vmatchOK.forEach(function(item) {
                console.log(item);
            });
            console.log('')
            console.log('CHECK NUMBER of TOKEN OK: SENT = ' + totalAssignedOnEth + ' - READ in blockchain = ' + totalAssignedOnFile );
            console.log('')
            console.log('END -----------------------------------------------')
            clearInterval(waitTimerID)
        }else{
            console.log('check in progress please wait... => ' + totalAssignedOnEth + ' of '+ totalAssignedOnFile);
        }        
        cnt++;
}, 2000);


