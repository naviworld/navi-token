const decimals = 18;

const makeTokens = amount => amount * 10 ** decimals;

const MONTHS_IN_SECCONDS = 60*60*24*30;
const NaviToken = artifacts.require("./NaviToken.sol");

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
      return instance.balanceOf.call(accounts[0]);
    }).then(function(balance) {
      console.log("balance accounts[0] = " + balance);
      assert.equal(balance, '1e+26', "owner balance amount error");
    });
  });

  it("should retrieve start ICO timestamp ", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.START_ICO_TIMESTAMP();
    }).then(function(startICOts) {
      console.log("startICOts = " + startICOts);
      let diff = Date.now() - startICOts;
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

  const vmyaddr = [
     '0xffff2828eeee4545dddd0808cccc7777bbbb0000',
     '0xffff2828eeee4545dddd0808cccc7777bbbb1111',
     '0xffff2828eeee4545dddd0808cccc7777bbbb2222',
  ];
  const vmyamount = [makeTokens(15000), makeTokens(20000), makeTokens(25000)];
  const vmyclass = [0, 1, 2];

  it("should assign tokens to three address (one contributor, one team&reserve, one advisor)", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.batchAssignTokens(vmyaddr,vmyamount,vmyclass);
    });
  });

  it("should retrieve contributor assigned tokens amount ", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.balanceOf(vmyaddr[0]);
    }).then(function(balance) {
      console.log("contributor amount = " + balance);
      assert.equal(balance, '1.5e+22', "Error: assigned contributor amount mismatch");
    });
  });

  it("should can defrost after defrostTime", function() {
    return NaviToken.deployed().then(function(instance) {
      web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [MONTHS_IN_SECCONDS*7], id: 1});
      web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 2});
      return instance.canDefrostReserveAndTeam.call();
    }).then(function(defrostEnabled) {
      console.log("canDefrostReserveAndTeam after 7 month = " + defrostEnabled);
      assert.equal(defrostEnabled, true, "Error: defrostReserveAndTeamTokens not enable after 7 month");
    });
  });

  it("should assign team token balance after defrost", function() {
    let theInstance;
    return NaviToken.deployed().then(function(instance) {
      theInstance = instance;
      web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [MONTHS_IN_SECCONDS*29], id: 1});
      return instance.defrostReserveAndTeamTokens();
    }).then(function(){
      return theInstance.balanceOf(vmyaddr[1]);
    }).then(function(balance){
      console.log("team amount = " + balance.toNumber());
      assert.equal(balance, '2e+22', "Error: defrosted team tokens mismatch");
      return theInstance.elapsedMonthsFromICOStart.call();
    }).then(function(elapsedMonths) {
      console.log("elapsedMonths from ICO start = " + elapsedMonths);
      assert.equal(elapsedMonths, 36, "Error: months count after start ICO and end defrost");
    });
  });

  it("should assign advisor token balance after defrost", function() {
    let theInstance;
    return NaviToken.deployed().then(function(instance) {
      theInstance = instance;
      return instance.defrostAdvisorsTokens();
    }).then(function(){
      return theInstance.balanceOf(vmyaddr[2]);
    }).then(function(balance){
      console.log("advisor amount = " + balance.toNumber());
      assert.equal(balance, '2.5e+22', "Error: defrosted advisor tokens mismatch");
    });
  });

});
