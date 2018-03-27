const fs = require('fs');
const path = require('path');

const NaviToken = artifacts.require("./NaviToken.sol");

const CONTRACTADDRESS_FILEPATH = path.resolve(__dirname) + '/../deploy/OUTPUTS/smart-contract-address.txt'

module.exports = function(deployer) {
    return deployer.deploy(NaviToken).then(function() {

      console.log('NaviToken.address = ' + NaviToken.address)
      fs.writeFile(CONTRACTADDRESS_FILEPATH, NaviToken.address, function(err) {
        if(err) {
          return console.log(err);
        }
        console.log("The file " + CONTRACTADDRESS_FILEPATH + " was saved!");
      });
    });
};
