var NaviToken = artifacts.require("./NaviToken.sol");

contract('NaviToken', function(accounts) {
  it("should retrieve max number of NaviToken", function() {
    return NaviToken.deployed().then(function(instance) {
      
      return instance.MAX_NUM_NAVITOKENS();
    }).then(function(maxnum) {
      console.log("Max Num Navi Tokens = " + maxnum);
      assert.equal(maxnum, '1e+27', "MAX_NUM_NAVITOKENS error");
    });
  });

  it("should retrieve NaviToken owner balance (account[0])", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.getAddressBalance.call(accounts[0]);
    }).then(function(balance) {
      console.log("balance accounts[0] = " + balance);
      assert.equal(balance, '2e+26', "owner balance amount error");
    });
  });  

  it("should retrieve start ICO timestamp ", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.getStartIcoTimestamp.call();
    }).then(function(startICOts) {
      console.log("startICOts = " + startICOts);
      var diff = Date.now() - startICOts;
      assert.equal(diff>1, true, "start ICO timestamp error");
    });
  });


  it("should ask if it can defrost reserve and team and get answer no (false)", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.canDefrostReserveAndTeam.call();
    }).then(function(canDefrostRT) {
      console.log("canDefrostRT = " + canDefrostRT);
      assert.equal(canDefrostRT, false, "Error: canDefrostReserveAndTeam returned true");
    });
  });

  it("should ask if it can defrost advisors and get answer no (false)", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.canDefrostAdvisors.call();
    }).then(function(canDefrostAdv) {
      console.log("canDefrostAdv = " + canDefrostAdv);
      assert.equal(canDefrostAdv, false, "Error: canDefrostAdvisors returned true");
    });
  });

  it("should get number of elapsed months from ICO start", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.elapsedMonthsFromICOStart.call();
    }).then(function(elapsedMonths) {
      console.log("elapsedMonths from ICO start = " + elapsedMonths);
      assert.equal(elapsedMonths, 0, "Error: retrived elapsedMonthsFromICOStart value not zero");
    });
  });

  it("should get stopDefrost value false", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.stopDefrost();
    }).then(function(stopD) {
      console.log("stopDefrost = " + stopD);
      assert.equal(stopD, false, "Error: stopDefrost = true at the beginning of ICO");
    });
  });

  var vmyaddr = [];
  // fake adresses
  vmyaddr.push('0xffff2828eeee4545dddd0808cccc7777bbbb0000')
  vmyaddr.push('0xffff2828eeee4545dddd0808cccc7777bbbb1111')
  vmyaddr.push('0xffff2828eeee4545dddd0808cccc7777bbbb2222')
  var vmyamount = [];
  vmyamount.push(15000)
  vmyamount.push(20000)
  vmyamount.push(25000)
  var vmyclass = [];
  vmyclass.push(0)
  vmyclass.push(1)
  vmyclass.push(2)
  it("should assign tokens to three address (one investor, one team&reserve, one advisor)", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.batchAssignTokens(vmyaddr,vmyamount,vmyclass);
    }).then(function(stop) {
      //console.log("stopDefrost = " + stop);
      //assert.equal(stopDefrost, false, "Error: stopDefrost true at the beginning of ICO");
    });
  });

  it("should retrieve investor assigned tokens amount ", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.getAddressAndBalance(vmyaddr[0]);
    }).then(function(vret) {
      investorAddress = vret[0]; 
      investorAmount = vret[1];
      console.log("investor address = " + investorAddress);
      console.log("investor amount = " + investorAmount);
      assert.equal(investorAddress, vmyaddr[0], "Error: assigned investorAddress mismatch");
      assert.equal(investorAmount, '1.5e+22', "Error: assigned investorAmount mismatch");
    });
  });


  it("should set stopDefrost value to true", function() {
    var theInstance;
    return NaviToken.deployed().then(function(instance) {
      theInstance = instance;
      console.log("setStopDefrost() ... ");
      return instance.setStopDefrost();
    }).then(function() {
      console.log("ask stopDefrost value ... ");
      return theInstance.stopDefrost();
    }).then(function(stopD2) {
      console.log("stopDefrost retreved shuld be true = " + stopD2);
      assert.equal(stopD2, true, "Error: stopDefrost false after being set to false");
    });
  });

  /*it("should retrieve stopDefrost value = true", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.stopDefrost();
    }).then(function(stopD2) {
      console.log("stopDefrost = " + stopD2);
      assert.equal(stopD2, true, "Error: stopDefrost false after being set to false");
    });
  });*/


});
