const fs = require('fs');

const NaviToken = require('./build/contracts/NaviToken.json');
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider(urlEthereumNode))

var ACTIONS_PATH = "./ACTIONS"
var LOGS_PATH = "./LOGS/"

var urlEthereumNode = "http://localhost:8545"
var CONTRACT_FILE = "./PARAMS/contract_address.txt"
var contractAddress  = require('fs').readFileSync(CONTRACT_FILE).toString();
console.log('contractAddress = ' + contractAddress)

//naviContract = web3.eth.contract(NaviToken.abi).at(contractAddress);
naviContract = new web3.eth.Contract(NaviToken.abi,  contractAddress);
console.log('naviContract = ' + naviContract)
//naviContract.options.address = contractAddress;
console.log('abi = ' + NaviToken.abi)
naviContract.elapsedMonthsFromICOStart( function(error, result){
    if (!error) {
        console.log("OWNER: getAddressBalance worked : " + result);          
    } else {
        console.log(error);
    }
});

// unlock ethereum base account
//web3.personal.unlockAccount(web3.eth.accounts[0], ownerPassword)
console.log('unlockAccount OK')
web3.eth.defaultAccount = web3.eth.accounts[0];

/*
var vIcoProjects = [];
var vIcoInvestors = [];

function IcoProject(icoaddress, start, stop, urlproject, hashwp) {
    this.icoaddress = icoaddress
    this.blockstart = parseInt(start)
    this.blockstop = parseInt(stop)
    this.url_project = urlproject;
    this.hash_white_paper = hashwp;
}

function IcoInvestor(icoaddress) {
    this.investoraddress = icoaddress
}

function getRandomInt(offset, max){
    return offset + Math.floor(Math.random() * max) 
}

var owner = web3.eth.accounts[0];
console.log('owner = ' +  owner)
var Lacc = web3.eth.accounts.length
console.log('accounts L = ' +  Lacc)

var lastBlock = web3.eth.getBlock('latest');
console.log('block last number = ' +  lastBlock.number)
var maxStopBlock = 0;

var numProjects = icorobotContract.getNumProjects();
console.log('numProjects should be 0 => numProjects = ' + numProjects)

    if(Lacc<50){
        console.log('ERROR: !!!!!!!!!!!!!! number of accounts too low !!!!!!!!!!!!!');
    }
    
    // add 10 ico projects    
    for(var p=1;p<=10;p++){
        var addr = web3.eth.accounts[p]
        //set random start/end block numbers for each project
        var start = lastBlock.number + getRandomInt(10,10);
        var stop = start + getRandomInt(30,10);
        if(stop > maxStopBlock){
            maxStopBlock = stop;
        }
        var url = "www.google.fr";
        var hashwp = "0x8888811111000000000000000000000000000000000000000000000000000000";
        vIcoProjects.push(new IcoProject(addr, start, stop, url, hashwp));
    }
    console.log('num projects = ' +  vIcoProjects.length)
    console.log('*******************    maxStopBlock  = ' +  maxStopBlock)

    // add 39 investors
    for(var i=11;i<Lacc;i++){
        var invaddr = web3.eth.accounts[i]
        vIcoInvestors.push(new IcoInvestor(invaddr));
    }
    console.log('num investors = ' +  vIcoInvestors.length)


// add projects to contract 
console.log('adding 10 Ico Projects  ---------------------------------------------  ' + vIcoProjects.length);
for(var k=0;k<vIcoProjects.length;k++){

        console.log('calling addIcoProject ' + k + ' ..............');
        var _icoaddress = vIcoProjects[k].icoaddress;
        var _blockstart = vIcoProjects[k].blockstart;
        var _blockstop = vIcoProjects[k].blockstop;
        var _urlproject = vIcoProjects[k].url_project;
        var _hashwp = vIcoProjects[k].hash_white_paper;
        console.log('ico args = ' + _icoaddress + ' ' + _blockstart + ' ' +_blockstop + ' ' +_urlproject + ' ' + _hashwp);
        icorobotContract.addIcoProject(_icoaddress, _blockstart, _blockstop,_urlproject,_hashwp, 
                                            { from: _icoaddress, value: 25000, gas : 444000 }, function(error, result){
                if (!error) {
                    console.log("addIcoProject OK: " + result);  // OK
                } else {
                    console.log("Error addIcoProject: " + error); 
                }
        });
}

// ACTIONS : 
// 1 = lock
// 2 = promise
// 3 = retire
waitTimerId = setInterval(waitForProjectsAdd, 4000);
function waitForProjectsAdd(){
    
    var numProjects = icorobotContract.getNumProjects();
    if(numProjects>=10){
        clearTimeout(waitTimerId);
    }else{
        console.log('waitForProjectsAdd ....................   => numProjects = ' + numProjects)
    }   
}


console.log('start scheduler ------------------------------------------------------------------------------')
console.log('start scheduler ------------------------------------------------------------------------------')
console.log('---------------')


function lockMoneyToIcoProject(_icoaddress, _investoraddress, _amount) {
    
    /*dataparam = icorobotContract.lockMoneyToIco.getData(_icoaddress)
    console.log("dataparam = " + dataparam );
    var estimatedGas = web3.eth.estimateGas({data: dataparam})
    console.log("estimate = " + estimatedGas );

    gasLimit = web3.eth.getBlock("latest").gasLimit
    console.log("gasLimit = " + gasLimit);

    gasOk=0 
    if(estimatedGas  < gasLimit){
        gasOk=estimatedGas;
    }else{
        gasOk=gasLimit;
    }
    console.log("gasOk = " + gasOk );*/
/*    gasOk = 222000
    icorobotContract.lockMoneyToIco(_icoaddress, { gas: gasOk, from: _investoraddress, value: _amount },  function(error, result){
            if (!error) {
                console.log("lockMoneyToIco OK");  // OK    
                //saveLockMoneyActionToFile(false, _icoaddress, _investoraddress, _amount);        
            } else {
                console.log(" lockMoneyToIco Error: " + error); 
                //saveErrorTofile("lockMoneyToIco")
            }
    });
}

function saveLockMoneyActionToFile(isTry, _icoaddress, _investoraddress, _amount, lastB, startB, endB){
    var filepath;
    if(isTry==true){
        filepath = ACTIONS_PATH + '/trylock_' + Date.now() + '.txt';
    }else{
        filepath = ACTIONS_PATH + '/postlock_' + Date.now() + '.txt';
    }
    var filecontent = _icoaddress + ';' + _investoraddress + ';' +_amount + ';' + lastB+ ';' +startB+ ';' + endB;
    console.log("saveLockMoneyActionToFile filecontent = " + filecontent); 
    fs.writeFile(filepath, filecontent, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file " + ACTIONS_PATH + " was saved!");
    }); 
}


function intendMoneyToIcoProject(_icoaddress, _investoraddress, _amount) {
    
    gasOk = 222000
    icorobotContract.intendMoneyToIco(_icoaddress, { gas: gasOk, from: _investoraddress, value: _amount },  function(error, result){
            if (!error) {
                console.log("intendMoneyToIco OK.");  // OK
                //saveIntendMoneyActionToFile(false, _icoaddress, _investoraddress, _amount);            
            } else {
                console.log(" lockMoneyToIco Error: " + error); 
            }
    });
}

function saveIntendMoneyActionToFile(isTry, _icoaddress, _investoraddress, _amount, lastB, startB, endB){
    var filepath;
    if(isTry==true){
        filepath = ACTIONS_PATH + '/tryintend_' + Date.now() + '.txt';
    }else{
        filepath = ACTIONS_PATH + '/postintend_' + Date.now() + '.txt';
    }
    var filecontent = _icoaddress + ';' + _investoraddress + ';' +_amount + ';' + lastB+ ';' +startB+ ';' + endB;
    fs.writeFile(filepath, filecontent, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file " + ACTIONS_PATH + " was saved!");
    }); 
}

function saveLogFile(filename, filecontent){
    var filepath = LOGS_PATH + filename;
    fs.writeFile(filepath, filecontent, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file " + filepath + " was saved!");
    }); 
}

// scheduler:  
var cntTimer = parseInt(0)
var cumulLockedMoney=0;
var cumulIntendeddMoney=0;
var cumulRetiredMoney=0;
function timerTestFunction() {


        var blockLast = web3.eth.getBlock('latest');
    
        console.log('timerscheduler call: block = ' + blockLast.number + '........  cntTimer =' + cntTimer)

        // pick up a random project
        var idxP = getRandomInt(0,vIcoProjects.length);
        addrico = vIcoProjects[idxP].icoaddress;
        startB = vIcoProjects[idxP].blockstart;
        endB = vIcoProjects[idxP].blockstop;
        console.log('addrico = '+ addrico);
        // pick up a random investor
        var idxI = getRandomInt(0,vIcoInvestors.length);
        addrinvestor = vIcoInvestors[idxI].investoraddress;
        console.log('addrinvestor = '+ addrinvestor);
        // pick up a random sum of money from investor
        var money = getRandomInt(5000,15000); // entre 15 et 20k
        console.log('money = '+ money);
        // pick up a random action : lock, promise, retire
        var action = getRandomInt(1,3); // entre 15 et 20k
        
        // send tx to contract and save action  to file
        if(action == 1){            // lock money to  ICO contract
            console.log('action lock triggered...')
            cumulLockedMoney+=money;
            saveLockMoneyActionToFile(true, addrico, addrinvestor, money, blockLast.number, startB, endB)
            lockMoneyToIcoProject(addrico, addrinvestor, money);
        }else if(action == 2){      // promise money to  ICO contract 
            console.log('action promise triggered...')   
            cumulLockedMoney+=money;        
            saveIntendMoneyActionToFile(true, addrico, addrinvestor, money, blockLast.number, startB, endB)
            intendMoneyToIcoProject(addrico, addrinvestor, money);
        }else if(action == 3){      // retire ICO contract  (if any)     
            console.log('action retire triggered...') 
            cumulRetiredMoney+=money;      
            //retireMoneyToIcoProject();
        }


        // check all projects are finished
        //var bEnd = icorobotContract.areAllICoFinished();
        var numRunning = icorobotContract.getNumRunningIcos();
        console.log('Num Running Icos = ' + numRunning);
      
        cntTimer++;
        console.log('..........................................................................')
}



// launch assign timer  ----------------------------------------------------------------
var schedulerIntervalSec = parseInt(8*1000)
console.log('schedulerIntervalSec = ' + schedulerIntervalSec)
schedulerTimerID = setInterval(timerTestFunction, schedulerIntervalSec);


function IcoProjectFromFile(icoaddress, start, stop, urlproject, hashwp) {
    this.icoaddress = icoaddress
    this.lockedmoney =0;
    this.intendedmoney =0;
    this.retiredmoney=0;
}


function checkAllMoney(){

    // read logged money files (loked, intended, retired)
    fs.readdir(ACTIONS_PATH, (err, dir)=>{
        for(var i=0; i<dir.length; i++){
            let fileName = dir[i];
            console.log("A: "+fileName);
            let filefile = dir+"\\"+fileName;
            fs.lstat(filefile, function(err, stats) {
                console.log("B: "+fileName);
            });
        }
    });
    
    // calc logged money (loked, intended, retired) for ech project  
     //  proj = new IcoProjectFromFile( ...

    // check amount raised in the blockchain is equal to logged
}

*/