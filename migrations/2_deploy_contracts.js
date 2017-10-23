
const fs = require('fs');
var CONTRACT_FILE = "./PARAMS/contract_address.txt"

var NaviToken = artifacts.require("./NaviToken.sol");

module.exports = function(deployer) {
    deployer.deploy(NaviToken).then(function() {   

        console.log('NaviToken.address = ' + NaviToken.address)
        fs.writeFile(CONTRACT_FILE, NaviToken.address, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file " + CONTRACT_FILE + " was saved!");
      }); 
    });
};
