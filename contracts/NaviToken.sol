pragma solidity ^0.4.19;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract NaviToken is StandardToken, Ownable {
    event Assigned(address indexed to, uint256 amount, uint256 defrostClass);
    event AssignmentStopped();
    event Defrosted(address indexed to, uint256 amount, uint256 defrostClass);

	using SafeMath for uint256;

    /* Overriding some ERC20 variables */
    string public constant name      = "NaviToken";
    string public constant symbol    = "NAVI";
    uint8 public constant decimals = 18;

    uint256 public constant MAX_NUM_NAVITOKENS    = 1000000000 * 10 ** uint256(decimals);
    uint256 public constant START_ICO_TIMESTAMP   = 1519912800;  // TODO: line to uncomment for the PROD before the main net deployment
    //uint256 public START_ICO_TIMESTAMP; // TODO: !!! line to remove before the main net deployment (not constant for testing and overwritten in the constructor)

    uint256 public constant MONTH_IN_MINUTES = 43200; // month in minutes  (1month = 43200 min)
    uint256 public constant DEFROST_AFTER_MONTHS = 6;

    uint256 public constant DEFROST_FACTOR_TEAMANDADV = 30;

    enum DefrostClass {Contributor, ReserveAndTeam, Advisor}

    // Fields that can be changed by functions
    address[] icedBalancesReserveAndTeam;
    mapping (address => uint256) mapIcedBalancesReserveAndTeamFrosted;
    mapping (address => uint256) mapIcedBalancesReserveAndTeamDefrosted;

    address[] icedBalancesAdvisors;
    mapping (address => uint256) mapIcedBalancesAdvisors;

    //Boolean to allow or not the initial assignement of token (batch)
    bool public batchAssignStopped = false;

    modifier canAssign() {
        require(!batchAssignStopped);
        require(elapsedMonthsFromICOStart() < 2);
        _;
    }

    function NaviToken() public {
        uint256 amountReserve    = MAX_NUM_NAVITOKENS.mul(10).div(100);  // 10% allocated and controlled by the company
        balances[owner]          = amountReserve;
        totalSupply              = amountReserve;

        Transfer(address(0), owner, amountReserve);

        // for test only: set START_ICO to contract creation timestamp
        //START_ICO_TIMESTAMP = now; // TODO: line to remove before the main net deployment
    }

    /**
    * @dev Transfer tokens in batches (of addresses)
    * @param _addr address The address which you want to send tokens from
    * @param _amounts address The address which you want to transfer to
    */
    function batchAssignTokens(address[] _addr, uint256[] _amounts, DefrostClass[] _defrostClass) public onlyOwner canAssign {
        require(_addr.length == _amounts.length && _addr.length == _defrostClass.length);
        //Looping into input arrays to assign target amount to each given address
        for (uint256 index = 0; index < _addr.length; index++) {
            address toAddress = _addr[index];
            uint amount = _amounts[index].mul(10 ** uint256(decimals));
            DefrostClass defrostClass = _defrostClass[index]; // 0 = ico contributor, 1 = reserve and team , 2 = advisor

            totalSupply = totalSupply.add(amount);
            require(totalSupply <= MAX_NUM_NAVITOKENS);

            if (defrostClass == DefrostClass.Contributor) {
                // contributor account
                balances[toAddress] = balances[toAddress].add(amount);
                Transfer(address(0), toAddress, amount);
            } else if (defrostClass == DefrostClass.ReserveAndTeam) {
                // Iced account. The balance is not affected here
                icedBalancesReserveAndTeam.push(toAddress);
                mapIcedBalancesReserveAndTeamFrosted[toAddress] = mapIcedBalancesReserveAndTeamFrosted[toAddress].add(amount);
            } else if (defrostClass == DefrostClass.Advisor) {
                // advisors account: tokens to defrost
                icedBalancesAdvisors.push(toAddress);
                mapIcedBalancesAdvisors[toAddress] = mapIcedBalancesAdvisors[toAddress].add(amount);
            }

            Assigned(toAddress, amount, uint256(defrostClass));
        }
    }

    function elapsedMonthsFromICOStart() view public returns (uint256) {
       return (now <= START_ICO_TIMESTAMP) ? 0 : (now - START_ICO_TIMESTAMP) / 60 / MONTH_IN_MINUTES;
    }

    function canDefrostReserveAndTeam() view public returns (bool) {
        return elapsedMonthsFromICOStart() > DEFROST_AFTER_MONTHS;
    }

    function defrostReserveAndTeamTokens() public {
        require(canDefrostReserveAndTeam());

        uint256 monthsIndex = elapsedMonthsFromICOStart() - DEFROST_AFTER_MONTHS;

        if (monthsIndex > DEFROST_FACTOR_TEAMANDADV){
            monthsIndex = DEFROST_FACTOR_TEAMANDADV;
        }

        // Looping into the iced accounts
        for (uint256 index = 0; index < icedBalancesReserveAndTeam.length; index++) {

            address currentAddress = icedBalancesReserveAndTeam[index];
            uint256 amountTotal = mapIcedBalancesReserveAndTeamFrosted[currentAddress].add(mapIcedBalancesReserveAndTeamDefrosted[currentAddress]);
            uint256 targetDefrosted = monthsIndex.mul(amountTotal).div(DEFROST_FACTOR_TEAMANDADV);
            uint256 amountToRelease = targetDefrosted.sub(mapIcedBalancesReserveAndTeamDefrosted[currentAddress]);

            if (amountToRelease > 0) {
                mapIcedBalancesReserveAndTeamFrosted[currentAddress] = mapIcedBalancesReserveAndTeamFrosted[currentAddress].sub(amountToRelease);
                mapIcedBalancesReserveAndTeamDefrosted[currentAddress] = mapIcedBalancesReserveAndTeamDefrosted[currentAddress].add(amountToRelease);
                balances[currentAddress] = balances[currentAddress].add(amountToRelease);

                Transfer(address(0), currentAddress, amountToRelease);
                Defrosted(currentAddress, amountToRelease, uint256(DefrostClass.ReserveAndTeam));
            }
        }
    }

    function canDefrostAdvisors() view public returns (bool) {
        return elapsedMonthsFromICOStart() >= DEFROST_AFTER_MONTHS;
    }

    function defrostAdvisorsTokens() public {
        require(canDefrostAdvisors());
        for (uint256 index = 0; index < icedBalancesAdvisors.length; index++) {
            address currentAddress = icedBalancesAdvisors[index];
            uint256 amountToDefrost = mapIcedBalancesAdvisors[currentAddress];
            if (amountToDefrost > 0) {
                balances[currentAddress] = balances[currentAddress].add(amountToDefrost);
                mapIcedBalancesAdvisors[currentAddress] = mapIcedBalancesAdvisors[currentAddress].sub(amountToDefrost);

                Transfer(address(0), currentAddress, amountToDefrost);
                Defrosted(currentAddress, amountToDefrost, uint256(DefrostClass.Advisor));
            }
        }
    }

    function stopBatchAssign() public onlyOwner canAssign {
        batchAssignStopped = true;
        AssignmentStopped();
    }

    function() public payable {
        revert();
    }
}
