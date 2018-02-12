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
    // uint256 public constant START_ICO_TIMESTAMP   = 1501595111;  // line to decomment for the PROD before the main net deployment
    uint256 public START_ICO_TIMESTAMP; // !!! line to remove before the main net deployment (not constant for testing and overwritten in the constructor)

    uint256 public constant MONTH_IN_MINUTES = 43200; // month in minutes  (1month = 43200 min)
    uint256 public constant DEFROST_AFTER_MONTHS = 6;

    uint256 public constant DEFROST_FACTOR_TEAMANDADV = 30;

    enum DefrostClass {Investor, ReserveAndTeam, Advisor}
    // Fields that can be changed by functions
    address[] icedBalancesReserveAndTeam;
    mapping (address => uint256) icedBalancesTeamAndAdv_frosted;
    mapping (address => uint256) icedBalancesTeamAndAdv_defrosted;

    address[] icedBalancesAdvisors;
    mapping (address => uint256) mapIcedBalancesAdvisors;


    // Variable usefull for verifying that the assignedSupply matches that totalSupply
    uint256 public assignedSupply;

    //Boolean to allow or not the initial assignement of token (batch)
    bool public batchAssignStopped = false;
    bool public stopDefrost = false;

    function NaviToken() {
        totalSupply              = MAX_NUM_NAVITOKENS;

        uint256 amountReserve    = MAX_NUM_NAVITOKENS.mul(20).div(100);  // 20% allocated and controlled by to NaviAddress
        balances[owner]          = amountReserve;
        assignedSupply           = amountReserve;

        // for test only: set START_ICO to contract creation timestamp
        // +600 => add 10 minutes
        START_ICO_TIMESTAMP = now; // line to remove before the main net deployment
    }

    /**
    * @dev Transfer tokens in batches (of addresses)
    * @param _addr address The address which you want to send tokens from
    * @param _amounts address The address which you want to transfer to
    */
    function batchAssignTokens(address[] _addr, uint256[] _amounts, DefrostClass[] _defrostClass) onlyOwner {
        require (batchAssignStopped == false);
        require (_addr.length == _amounts.length && _addr.length == _defrostClass.length);
        //Looping into input arrays to assign target amount to each given address
        for (uint256 index = 0; index < _addr.length; index++) {
            address toAddress = _addr[index];
            uint amount = _amounts[index].mul(10 ** decimals);
            DefrostClass defrostClass = _defrostClass[index]; // 0=ico investor, 1=reserveandteam , 2=advisor

            assignedSupply = assignedSupply.add(amount);
            if (defrostClass == DefrostClass.Investor) {
                // investor account
                balances[toAddress] = amount;
            } else if (defrostClass == DefrostClass.ReserveAndTeam) {
                // Iced account. The balance is not affected here
                icedBalancesReserveAndTeam.push(toAddress);
                balances[toAddress] = 0;
                icedBalancesTeamAndAdv_frosted[toAddress] = amount;
                icedBalancesTeamAndAdv_defrosted[toAddress] = 0;
            } else if (defrostClass == DefrostClass.Advisor) {
                // advisors account: tokens to defrost
                icedBalancesAdvisors.push(toAddress);
                if (mapIcedBalancesAdvisors[toAddress] == 0) {
                    mapIcedBalancesAdvisors[toAddress] = amount;
                }
            }
        }
    }

    function getBlockTimestamp() constant returns (uint256) {
        return now;
    }

    function elapsedMonthsFromICOStart() view returns (uint256) {
       return (now <= START_ICO_TIMESTAMP) ? 0 : (now - START_ICO_TIMESTAMP) / 60 / MONTH_IN_MINUTES;
    }

    function getReserveAndTeamDefrostFactor() constant returns (uint256) {
        return DEFROST_FACTOR_TEAMANDADV;
    }

    function lagReserveAndTeamDefrost() constant returns (uint256) {
        return DEFROST_AFTER_MONTHS;
    }

    function lagAdvisorsDefrost() constant returns (uint256) {
        return DEFROST_AFTER_MONTHS;
    }

    function canDefrostReserveAndTeam() constant returns (bool) {
        uint256 numMonths = elapsedMonthsFromICOStart();
        return  numMonths >= DEFROST_AFTER_MONTHS &&
                            numMonths <= DEFROST_AFTER_MONTHS.add(DEFROST_FACTOR_TEAMANDADV);
    }

    function defrostReserveAndTeamTokens() onlyOwner {

        require(now > START_ICO_TIMESTAMP);
        require(stopDefrost == false);

        uint256 monthsElapsedTeamAndAdv = elapsedMonthsFromICOStart() - DEFROST_AFTER_MONTHS;
        require(monthsElapsedTeamAndAdv > 0);
        uint256 monthsIndex = uint256(monthsElapsedTeamAndAdv);
        require(monthsIndex <= DEFROST_FACTOR_TEAMANDADV);

        // Looping into the iced accounts
        for (uint256 index = 0; index < icedBalancesReserveAndTeam.length; index++) {

            address currentAddress = icedBalancesReserveAndTeam[index];
            uint256 amountTotal = icedBalancesTeamAndAdv_frosted[currentAddress].add(icedBalancesTeamAndAdv_defrosted[currentAddress]);
            uint256 targetDeFrosted = monthsIndex.mul(amountTotal).div(DEFROST_FACTOR_TEAMANDADV);
            uint256 amountToRelease = targetDeFrosted.sub(icedBalancesTeamAndAdv_defrosted[currentAddress]);

            if (amountToRelease > 0) {
                icedBalancesTeamAndAdv_frosted[currentAddress] = icedBalancesTeamAndAdv_frosted[currentAddress].sub(amountToRelease);
                icedBalancesTeamAndAdv_defrosted[currentAddress] = icedBalancesTeamAndAdv_defrosted[currentAddress].add(amountToRelease);
                balances[currentAddress] = balances[currentAddress].add(amountToRelease);
              }
        }
    }

    function canDefrostAdvisors() constant returns (bool) {
        return elapsedMonthsFromICOStart() == DEFROST_AFTER_MONTHS;
    }

    function defrostAdvisorsTokens() onlyOwner {

        require(now > START_ICO_TIMESTAMP);
        require(stopDefrost == false);

        require(elapsedMonthsFromICOStart() >= DEFROST_AFTER_MONTHS);
        for (uint256 index = 0; index < icedBalancesAdvisors.length; index++) {
            address currentAddress = icedBalancesAdvisors[index];
            uint256 amountToDefrost = mapIcedBalancesAdvisors[currentAddress];
            if (amountToDefrost > 0) {
                if (balances[currentAddress] > 0) {
                    balances[currentAddress] = balances[currentAddress].add(amountToDefrost);
                    mapIcedBalancesAdvisors[currentAddress] = mapIcedBalancesAdvisors[currentAddress].sub(amountToDefrost);
                } else {
                    balances[currentAddress] = amountToDefrost;
                    mapIcedBalancesAdvisors[currentAddress] = mapIcedBalancesAdvisors[currentAddress].sub(amountToDefrost);
                }
            }
        }
    }

    function getStartIcoTimestamp() constant returns (uint256) {
        return START_ICO_TIMESTAMP;
    }

    function stopBatchAssign() onlyOwner {
        require(batchAssignStopped == false);
        batchAssignStopped = true;
    }

    function getAddressBalance(address _addr) constant returns (uint256 _balance) {
        _balance = balances[_addr];
    }

    function getAddressAndBalance(address _addr) constant returns (address _address, uint256 _amount) {
        _address = _addr;
        _amount = balances[_addr];
    }

    function setStopDefrost() onlyOwner {
        stopDefrost = true;
    }

}
