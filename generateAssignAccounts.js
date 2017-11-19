const path = require('path');
const fs = require('fs');
var crypto = require('crypto');

// LOAD PARAMETERS --------------------------------
const ETHNODE_FILEPATH = path.resolve(__dirname) + '/PARAMS/ethereum_node.txt'
const NUMACCOUNTS_FILEPATH = path.resolve(__dirname) + '/PARAMS/num_accounts_2_create.txt'
var urlEthereumNode = require('fs').readFileSync(ETHNODE_FILEPATH, 'utf-8')
var numAccounts2Create = require('fs').readFileSync(NUMACCOUNTS_FILEPATH, 'utf-8')
console.log('urlEthereumNode = ' + urlEthereumNode)
console.log('numAccounts2Create = ' + numAccounts2Create)

const Web3 = require('web3')
let web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))
console.log('Web3 OK')

console.log('check num accounts...')
if(web3.eth.accounts.length <=1){
  console.log("Vous ne pouvez pas lancer ce script parce que vous n'avez pasassez d'accounts. SVP, gérérez des accounts d'abord." )
  return;
}
console.log('...num accounts OK')

const GENERATED_ACCOUNTS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_input_accounts_amounts.txt';
const GENERATED_NUMTOKENS_FILEPATH = path.resolve(__dirname) + '/OUTPUTS/generated_number_of_tokens.txt'

var arrayAccounts = []

// generate randoms
function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

function randomInt (low, high) {
  return parseInt(Math.random() * (high - low) + low)
}

function randomValueAmount () {
    var low =  1;
    var high = 100000;
    return parseInt(Math.random() * (high - low) + low)
}

var separator =','
cnt=0;
cntTrueAdded=0;
sumAmounts=0;
var Lacc = web3.eth.accounts.length;
var Lacc3 = Lacc/3;
for(var a = 0; a < Lacc ;a++){
  
  var strline;
  if(cnt>0){ // skip first one: the owner 
    
    console.log('creating account ' + cnt)

    amount = randomValueAmount()
    if(cnt<=Lacc3){ 
      // first 3 = TEAM/ADVISORS
      console.log(cnt + " - true account: " +  web3.eth.accounts[a])  
      strline = web3.eth.accounts[a] +separator +amount + separator + '2'
    }else if(cnt<=2*Lacc3){
      // 3 to 6 = EQUITIES
      console.log(cnt + " - true account: " +  web3.eth.accounts[a])
      strline = web3.eth.accounts[a] +separator +amount + separator + '1'
    }else{
      // 6-9 = INVESTOR
      console.log(cnt + " - true account: " +  web3.eth.accounts[a])
      strline = web3.eth.accounts[a] +separator +amount + separator + '0'
    }
    arrayAccounts.push(strline)
    sumAmounts+=amount;

    cntTrueAdded++;
  }
  cnt++
}

cnt=0
for(var k = cntTrueAdded; k < numAccounts2Create ;k++){    
    amount = randomValueAmount()
    var fakeAccount = '0x'+ randomValueHex(40);
    var random = randomInt(0,100);
    if(random<10){
          console.log(cnt + " - fake account: " + fakeAccount)
          strline = fakeAccount + separator+ amount+ separator+ '2'
    }
    else if(random<20){
      console.log(cnt + " - fake account: " + fakeAccount)
      strline = fakeAccount + separator+ amount+ separator+ '1'
    }
    else{
          console.log(cnt + " - fake account: " + fakeAccount)
          strline = fakeAccount + separator+ amount+ separator+ '0'
    }
    arrayAccounts.push(strline)
    sumAmounts+=amount;
    cnt++
}

console.log('sumAmounts = ' + sumAmounts)

var filewriter = fs.createWriteStream(GENERATED_ACCOUNTS_FILEPATH);
arrayAccounts.forEach(  
    function addLine(value) { 
      filewriter.write(value+'\n')
  }  
);  


var filewriter2 = fs.createWriteStream(GENERATED_NUMTOKENS_FILEPATH);
filewriter2.write(sumAmounts.toString())





