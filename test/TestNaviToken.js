var NaviToken = artifacts.require("./NaviToken.sol");

var NUM_NAVITOKENS = 3e+26;

contract('NaviToken', function(accounts) {

  it("should retrieve mor etha 10000 NaviToken from the owner account", function() {
    return NaviToken.deployed().then(function(instance) {
      return instance.getAddressBalance.call(accounts[0]);
    }).then(function(balance) {
      console.log('owner balance = '+ balance.valueOf())
      //assert.equal(balance.valueOf == NUM_NAVITOKENS, true, "NUM_NAVITOKENS issued not good");
    });
  });


  /*it("should call a batchAssign ", function() {
    var navi;
    var metaCoinBalance;
    var metaCoinEthBalance;

    return NaviToken.deployed().then(function(instance) {
      navi = instance;
      return meta.getBalance.call(accounts[0]);
    }).then(function(outCoinBalance) {
      metaCoinBalance = outCoinBalance.toNumber();
      return meta.getBalanceInEth.call(accounts[0]);
    }).then(function(outCoinBalanceEth) {
      metaCoinEthBalance = outCoinBalanceEth.toNumber();
    }).then(function() {
      assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, "Library function returned unexpected function, link
    });
  });*/

  it("should call a batchAssign ", function() {

    var navi;

    var vaddr=[];
    var vamounts=[];
    var vclasses=[];

    vaddr.push('0xc5b57d7280565bacdb28712787affafd7f98d94d');
    vaddr.push('0xc5b57d7280565bacdb28712787affafd7f98d94e');
    vaddr.push('0xc5b57d7280565bacdb28712787affafd7f98d94f');

    vamounts.push(1000);  vamounts.push(2000);  vamounts.push(3000);
    vclasses.push(0);  vclasses.push(1);  vclasses.push(2);
    
    var multDecimals = 1000000000000000000

    return NaviToken.deployed().then(function(instance) {
      navi = instance;
      return navi.batchAssignTokens(vaddr, vamounts, vclasses);
    }).then(function(result) {
      return navi.getAddressBalance(vaddr[0]);
    }).then(function(result) {
      var numtokens = result / multDecimals;
      console.log('addr 0 balance = ' + numtokens);
      assert.equal(numtokens, 1000, "addr 0 balance is not 1000");
    }).then(function(result) {
      return navi.getAddressBalance(vaddr[1]);
    }).then(function(result) {
      console.log('addr 1 balance = ' + result);
      assert.equal(result, 0, "addr 1 balance is not 0");
    }).then(function(result) {
      return navi.getAddressBalance(vaddr[2]);
    }).then(function(result) {
      console.log('addr 0 balance = ' + result);
      assert.equal(result, 0, "addr 0 balance is not 0");
    }).then(function(result) {
      return navi.defrostEquitiesTokens();
    }).then(function(result) {
      console.log('addr 1 balance = ' + result);
      assert.equal(result, 1, "addr 1 balance is not 0");
    });
  });


  /*it("should call a function that depends on a linked library", function() {
    var meta;
    var metaCoinBalance;
    var metaCoinEthBalance;

    return MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(accounts[0]);
    }).then(function(outCoinBalance) {
      metaCoinBalance = outCoinBalance.toNumber();
      return meta.getBalanceInEth.call(accounts[0]);
    }).then(function(outCoinBalanceEth) {
      metaCoinEthBalance = outCoinBalanceEth.toNumber();
    }).then(function() {
      assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, "Library function returned unexpected function, link
    });
  });
  it("should send coin correctly", function() {
    var meta;

    // Get initial balances of first and second account.
    var account_one = accounts[0];age may be broken");
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 10;

    return MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(account_one);
    }).then(function(balance) {
      account_one_starting_balance = balance.toNumber();
      return meta.getBalance.call(account_two);
    }).then(function(balance) {
      account_two_starting_balance = balance.toNumber();
      return meta.sendCoin(account_two, amount, {from: account_one});
    }).then(function() {
      return meta.getBalance.call(account_one);
    }).then(function(balance) {
      account_one_ending_balance = balance.toNumber();
      return meta.getBalance.call(account_two);
    }).then(function(balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
    });
  });*/
});
