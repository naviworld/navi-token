const fs = require('fs');
const path = require('path');

String.prototype.isEmpty = function() {
  return (this.length === 0 || !this.trim());
};

const config = require('./../deploy/config');

const ACCOUNTSAMOUNTS_FILEPATH = path.resolve(__dirname) + '/../deploy/contributors.csv';

const CHUNKSIZE_FILEPATH = path.resolve(__dirname) + '/../deploy/PARAMS/chunk_size.txt'
const INTERVALSEC_FILEPATH = path.resolve(__dirname) + '/../deploy/PARAMS/assign_interval_sec.txt'
const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/../deploy/OUTPUTS/smart-contract-address.txt'

let chunkSize = fs.readFileSync(CHUNKSIZE_FILEPATH, 'utf-8');
let assignIntervalSec = parseInt(1000 * fs.readFileSync(INTERVALSEC_FILEPATH, 'utf-8'));
let contractAddress  = fs.readFileSync(CONTRACTADDRESS_FILEPATH).toString();

console.log('-----------------------------------------------------')
console.log('chunkSize = ' + chunkSize)
console.log('filePathAccountsAmounts = ' + ACCOUNTSAMOUNTS_FILEPATH)
console.log('assignIntervalSec = ' + assignIntervalSec)
console.log('contractAddress = ' + contractAddress)
console.log('-----------------------------------------------------');

console.log('contractAddress =  ' + contractAddress );

const NaviToken = require('./../build/contracts/NaviToken.json');
const Web3 = require('web3');

const provider = require('./LedgerProvider')(config.networkId, config.networkName);
const web3 = new Web3(provider);

const BigNumber = web3.BigNumber;
const decimals = 18;

const makeTokens = amount => new BigNumber(amount).mul(10 ** decimals).floor();

const fixAddressPrefix = address => address.indexOf('0x') === -1 ? '0x' + address : address;

naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);

web3.eth.getAccounts( (error, result) => {
  console.log("getAccounts", error, result);

  const defaultAccount = result[0];

  web3.eth.defaultAccount = defaultAccount;

  naviContract.balanceOf( defaultAccount, function(error, result){
    if (!error) {
      console.log("getAddressBalance for owner: " + result);
    } else {
      console.log(error);
    }

    // read account/amounts file to assign -------------------------------------------------
    let accounts  = fs.readFileSync(ACCOUNTSAMOUNTS_FILEPATH).toString().split('\n');

    accounts.shift(); // remove cvs headers

    console.log('Processing contributors number = ' + accounts.length);

    // launch assign timer  ----------------------------------------------------------------
    console.log('intervalSec = ' + assignIntervalSec);
    assignTimerId = setInterval(timerAssignFunction, assignIntervalSec);

    let cntTimer = parseInt(0);
    function timerAssignFunction() {

      console.log('timerAssignFunction scheduler call ............................. cntTimer = ' + cntTimer)
      let numToSend = parseInt(0);
      let from = parseInt(cntTimer * chunkSize)
      let to = parseInt(from) + parseInt(chunkSize)
      console.log('from = ' + from + '  -  to = ' + to)

      if( from >= accounts.length){
        console.log('timer stopped //////////////////////////////////');
        clearInterval(assignTimerId);
      }
      // fill address/amounts arrays
      let addresses = [];
      let amounts = [];
      let classes = [];
      for(let i = from; i < to; i++){

        // check the end
        if(i >= accounts.length){
          // stop timer
          console.log('timer stopped //////////////////////////////////');
          clearInterval(assignTimerId);
          break;

        }else{

          let parsedRaw = accounts[i].split(",");
          if(parsedRaw.length >= 4 && !parsedRaw[0].isEmpty()) {
            addresses.push(fixAddressPrefix(parsedRaw[1]));
            amounts.push(makeTokens(parseFloat(parsedRaw[2])));
            classes.push(parseInt(parsedRaw[3]));
            numToSend++;
          }
        }
      }

      console.log('numToSend = ' + numToSend + '  - addresses.length = '+addresses.length + '  -  amounts.length = '+  amounts.length);
      if(numToSend === addresses.length && numToSend === amounts.length && numToSend === classes.length && numToSend > 0)
      {
        console.log('calling timerAssignFunction ....... ');
        console.log('param =  ' + contractAddress + ' ' + addresses +' ' + numToSend);

        sendAssignChunkToSmartContract(contractAddress,
          addresses, amounts, classes, numToSend);
        console.log("...END -> cntTimer = " + cntTimer)
      }
      else{
        console.log('Fatal error: numToSend / size arrays mismatch ')
      }

      cntTimer++;
      console.log('.......................................................................')
    }

    function sendAssignChunkToSmartContract(contractAddress, addrs, amounts, classes, numToSend) {
      console.log("started sendAssignChunkToSmartContract" );
      dataparam = naviContract.batchAssignTokens.getData(addrs, amounts, classes);
      //console.log("dataparam = " + dataparam );

      console.log("estimating gas... ");
      web3.eth.estimateGas({from: defaultAccount,
        to: contractAddress,
        data: dataparam}, (error, result) => {

        let estimatedGas = result;

        console.log("estimate = " + estimatedGas );
        estimatedGas = parseInt(estimatedGas + estimatedGas * 0.1);

        web3.eth.getBlock("latest", (error, result) => {
          let gasLimit = result.gasLimit;

          console.log("gasLimit = " + gasLimit);

          let gasOk=0;
          if(estimatedGas  < gasLimit){
            gasOk=estimatedGas;
          }else{
            gasOk=gasLimit;
          }
          console.log("gasOk = " + gasOk );

          naviContract.batchAssignTokens(addrs, amounts, classes, { gas: estimatedGas, gasPrice: config.gasPrice },  function(error, result){
            if (!error) {
              console.log(" batchAssignTokens OK: " + result);  // OK
            } else {
              console.log(" batchAssignTokens error: " + error);
            }
          });
        });
      });
    }
  });
});







