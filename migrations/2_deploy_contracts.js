
const fs = require('fs');
const path = require('path');

const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/../OUTPUTS/smart-contract-address.txt'

let NaviToken = artifacts.require("./NaviToken.sol");

module.exports = function(deployer) {
    deployer.deploy(NaviToken).then(function() {   

        console.log('NaviToken.address = ' + NaviToken.address)
        fs.writeFile(CONTRACTADDRESS_FILEPATH, NaviToken.address, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file " + CONTRACTADDRESS_FILEPATH + " was saved!");
      }); 
    });
};
