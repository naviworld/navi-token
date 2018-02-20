pragma solidity ^0.4.19;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract NaviToken is StandardToken, Ownable {

	using SafeMath for uint256;

    /* Overriding some ERC20 variables */
    string public constant name      = "NaviToken";
    string public constant symbol    = "NVT";
    uint256 public constant decimals = 18;

    uint256 public constant MAX_NUM_NAVITOKENS    = 1000000000 * 10 ** decimals;
    // Freeze duration for Advisors accounts
    // uint256 public constant START_ICO_TIMESTAMP   = 1519912800;  // line to decomment for the PROD before the main net deployment
    uint256 public START_ICO_TIMESTAMP; // !!! line to remove before the main net deployment (not constant for testing and overwritten in the constructor)

    uint256 public constant MONTH_IN_MINUTES = 43200; // month in minutes  (1month = 43200 min)
    uint256 public constant DEFROST_AFTER_MONTHS = 6;

    uint256 public constant DEFROST_FACTOR_TEAMANDADV = 30;

    enum DefrostClass {Investor, ReserveAndTeam, Advisor}

    // Fields that can be changed by functions
    address[] icedBalancesReserveAndTeam;
    mapping (address => uint256) icedBalancesReserveAndTeamFrosted;
    mapping (address => uint256) icedBalancesReserveAndTeamDefrosted;

    address[] icedBalancesAdvisors;
    mapping (address => uint256) mapIcedBalancesAdvisors;

    //Boolean to allow or not the initial assignement of token (batch)
    bool public batchAssignStopped = false;
    bool public stopDefrost = false;

    function NaviToken() public {
        uint256 amountReserve    = MAX_NUM_NAVITOKENS.mul(10).div(100);  // 10% allocated and controlled by to NaviAddress
        balances[owner]          = amountReserve;
        totalSupply              = amountReserve;

        // for test only: set START_ICO to contract creation timestamp
        // +600 => add 10 minutes
        START_ICO_TIMESTAMP = now; // line to remove before the main net deployment
    }

    /**
    * @dev Transfer tokens in batches (of addresses)
    * @param _addr address The address which you want to send tokens from
    * @param _amounts address The address which you want to transfer to
    */
    function batchAssignTokens(address[] _addr, uint256[] _amounts, DefrostClass[] _defrostClass) public onlyOwner {
        require(batchAssignStopped == false);
        require(_addr.length == _amounts.length && _addr.length == _defrostClass.length);
        //Looping into input arrays to assign target amount to each given address
        for (uint256 index = 0; index < _addr.length; index++) {
            address toAddress = _addr[index];
            uint amount = _amounts[index].mul(10 ** decimals);
            DefrostClass defrostClass = _defrostClass[index]; // 0=ico investor, 1=reserveandteam , 2=advisor
            
            require(totalSupply.add(amount) <= MAX_NUM_NAVITOKENS);

            totalSupply = totalSupply.add(amount);
            if (defrostClass == DefrostClass.Investor) {
                // investor account
                balances[toAddress] = balances[toAddress].add(amount);
            } else if (defrostClass == DefrostClass.ReserveAndTeam) {
                // Iced account. The balance is not affected here
                icedBalancesReserveAndTeam.push(toAddress);
                icedBalancesReserveAndTeamFrosted[toAddress] = icedBalancesReserveAndTeamFrosted[toAddress].add(amount);
                icedBalancesReserveAndTeamDefrosted[toAddress] = 0;
            } else if (defrostClass == DefrostClass.Advisor) {
                // advisors account: tokens to defrost
                icedBalancesAdvisors.push(toAddress);
                mapIcedBalancesAdvisors[toAddress] = mapIcedBalancesAdvisors[toAddress].add(amount);
            }
        }
    }

    function elapsedMonthsFromICOStart() view public returns (uint256) {
       return (now <= START_ICO_TIMESTAMP) ? 0 : (now - START_ICO_TIMESTAMP) / 60 / MONTH_IN_MINUTES;
    }

    function canDefrostReserveAndTeam() view public returns (bool) {
        return elapsedMonthsFromICOStart() > DEFROST_AFTER_MONTHS &&
               now > START_ICO_TIMESTAMP && stopDefrost == false;
    }

    function defrostReserveAndTeamTokens() public onlyOwner {
        require(canDefrostReserveAndTeam());

        uint256 monthsIndex = elapsedMonthsFromICOStart() - DEFROST_AFTER_MONTHS;

        if (monthsIndex > DEFROST_FACTOR_TEAMANDADV){
            monthsIndex = DEFROST_FACTOR_TEAMANDADV;
        }
        // Looping into the iced accounts
        for (uint256 index = 0; index < icedBalancesReserveAndTeam.length; index++) {

            address currentAddress = icedBalancesReserveAndTeam[index];
            uint256 amountTotal = icedBalancesReserveAndTeamFrosted[currentAddress].add(icedBalancesReserveAndTeamDefrosted[currentAddress]);
            uint256 targetDeFrosted = monthsIndex.mul(amountTotal).div(DEFROST_FACTOR_TEAMANDADV);
            uint256 amountToRelease = targetDeFrosted.sub(icedBalancesReserveAndTeamDefrosted[currentAddress]);

            if (amountToRelease > 0) {
                icedBalancesReserveAndTeamFrosted[currentAddress] = icedBalancesReserveAndTeamFrosted[currentAddress].sub(amountToRelease);
                icedBalancesReserveAndTeamDefrosted[currentAddress] = icedBalancesReserveAndTeamDefrosted[currentAddress].add(amountToRelease);
                balances[currentAddress] = balances[currentAddress].add(amountToRelease);
              }
        }
    }

    function canDefrostAdvisors() view public returns (bool) {
        return elapsedMonthsFromICOStart() >= DEFROST_AFTER_MONTHS &&
               now > START_ICO_TIMESTAMP &&
               stopDefrost == false;
    }

    function defrostAdvisorsTokens() public onlyOwner {
        require(canDefrostAdvisors());
        for (uint256 index = 0; index < icedBalancesAdvisors.length; index++) {
            address currentAddress = icedBalancesAdvisors[index];
            uint256 amountToDefrost = mapIcedBalancesAdvisors[currentAddress];
            if (amountToDefrost > 0) {
                if (balances[currentAddress] > 0) {
                    balances[currentAddress] = balances[currentAddress].add(amountToDefrost);
                    mapIcedBalancesAdvisors[currentAddress] = mapIcedBalancesAdvisors[currentAddress].sub(amountToDefrost);
                } else {
                    balances[currentAddress] = balances[currentAddress].add(amountToDefrost);
                    mapIcedBalancesAdvisors[currentAddress] = mapIcedBalancesAdvisors[currentAddress].sub(amountToDefrost);
                }
            }
        }
    }

    function stopBatchAssign() public onlyOwner {
        require(batchAssignStopped == false);
        batchAssignStopped = true;
    }

    function setStopDefrost() public onlyOwner {
        stopDefrost = true;
    }

}
