pragma solidity 0.4.15;

import "./StandardToken.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

contract NaviToken is StandardToken, Ownable {

	/* Overriding some ERC20 variables */
	string public constant name      = "NaviToken";
	string public constant symbol    = "NVT";
	uint256 public constant decimals = 18;

	uint256 public constant MAX_NUM_NAVITOKENS    = 1000000000 * 10 ** decimals;
	// Freeze duration for Advisors accounts
	// uint256 public constant START_ICO_TIMESTAMP   = 1501595111;  // line to decomment for the PROD before the main net deployment
	uint256 public START_ICO_TIMESTAMP; // !!! line to remove before the main net deployment (not constant for testing and overwritten in the constructor)
	int public constant DEFROST_MONTH_IN_MINUTES = 43200; // month in minutes  (1month = 43200 min)
	int public constant DEFROST_RESERVEANDTEAM_MONTHS = 6; 
	int public constant DEFROST_ADVISOR_MONTHS = 6; 

	uint public constant DEFROST_FACTOR_TEAMANDADV = 30;

	// Fields that can be changed by functions
	address[] vIcedBalancesReserveAndTeam;
	mapping (address => uint256) icedBalancesTeamAndAdv_frosted;
    mapping (address => uint256) icedBalancesTeamAndAdv_defrosted;
	
	address[] vIcedBalancesAdvisors;
	mapping (address => uint256) mapIcedBalancesAdvisors;


	// Variable usefull for verifying that the assignedSupply matches that totalSupply
	uint256 public assignedSupply;
	//Boolean to allow or not the initial assignement of token (batch)
	bool public batchAssignStopped = false;
	bool public stopDefrost = false;

	function NaviToken() {
		owner                	= msg.sender;
		uint256 amountReserve  	= SafeMath.div(SafeMath.mul(MAX_NUM_NAVITOKENS, 20) , 100);  // 20% allocated and controlled by to NaviAddress
		balances[owner]  		= amountReserve;
		totalSupply          	= MAX_NUM_NAVITOKENS;
		assignedSupply       	= amountReserve;

		// for test only: set START_ICO to contract creation timestamp
		// +600 => add 10 minutes
		START_ICO_TIMESTAMP = now; // line to remove before the main net deployment 
	}

	/**
   * @dev Transfer tokens in batches (of adresses)
   * @param _vaddr address The address which you want to send tokens from
   * @param _vamounts address The address which you want to transfer to
   */
  function batchAssignTokens(address[] _vaddr, uint[] _vamounts, uint[] _vDefrostClass ) onlyOwner {
	  
			require ( batchAssignStopped == false );
			require ( _vaddr.length == _vamounts.length && _vaddr.length == _vDefrostClass.length);
			//Looping into input arrays to assign target amount to each given address
			for (uint index=0; index<_vaddr.length; index++) {

				address toAddress = _vaddr[index];
				uint amount = SafeMath.mul(_vamounts[index], 10 ** decimals);
				uint defrostClass = _vDefrostClass[index]; // 0=ico investor, 1=reserveandteam , 2=advisor 
			
				assignedSupply = SafeMath.add(assignedSupply, amount);
				if (  defrostClass  == 0 ) {
					// investor account
					balances[toAddress] = amount;
				}
				else if(defrostClass == 1){
				
					// Iced account. The balance is not affected here
                    vIcedBalancesReserveAndTeam.push(toAddress);
					balances[toAddress] = 0;                   
                    icedBalancesTeamAndAdv_frosted[toAddress] = amount;
					icedBalancesTeamAndAdv_defrosted[toAddress] = 0;

				}else if(defrostClass == 2){
					// advisors account: tokens to defrost
					vIcedBalancesAdvisors.push(toAddress);
					if(mapIcedBalancesAdvisors[toAddress] == 0){
						mapIcedBalancesAdvisors[toAddress] = amount;
					}
				}
			}
	}

	function getBlockTimestamp() constant returns (uint256){
		return now;
	}

	function elapsedMonthsFromICOStart() constant returns (int elapsed) {
		elapsed = (int(now-START_ICO_TIMESTAMP)/60)/DEFROST_MONTH_IN_MINUTES;
	}

	function getReserveAndTeamDefrostFactor()constant returns (uint){
		return DEFROST_FACTOR_TEAMANDADV;
	}
	
	function lagReserveAndTeamDefrost()constant returns (int){
		return DEFROST_RESERVEANDTEAM_MONTHS;
	}

	function lagAdvisorsDefrost()constant returns (int){
		return DEFROST_ADVISOR_MONTHS;
	}

	function canDefrostReserveAndTeam()constant returns (bool){
		int numMonths = elapsedMonthsFromICOStart();
		return  numMonths >= DEFROST_RESERVEANDTEAM_MONTHS && 
							uint(numMonths) <= SafeMath.add(uint(DEFROST_RESERVEANDTEAM_MONTHS),  DEFROST_FACTOR_TEAMANDADV);
	}

	function defrostReserveAndTeamTokens() onlyOwner {

		require(now>START_ICO_TIMESTAMP);
		require(stopDefrost == false);

		int monthsElapsedTeamAndAdv = elapsedMonthsFromICOStart() - DEFROST_RESERVEANDTEAM_MONTHS;
		require(monthsElapsedTeamAndAdv>0);
		uint monthsIndex = uint(monthsElapsedTeamAndAdv);
		require(monthsIndex<=DEFROST_FACTOR_TEAMANDADV);

		// Looping into the iced accounts
        for (uint index = 0; index < vIcedBalancesReserveAndTeam.length; index++) {

			address currentAddress = vIcedBalancesReserveAndTeam[index];
            uint256 amountTotal = SafeMath.add(icedBalancesTeamAndAdv_frosted[currentAddress], icedBalancesTeamAndAdv_defrosted[currentAddress]);
            uint256 targetDeFrosted = SafeMath.div(SafeMath.mul(monthsIndex, amountTotal), DEFROST_FACTOR_TEAMANDADV);
            uint256 amountToRelease = SafeMath.sub(targetDeFrosted, icedBalancesTeamAndAdv_defrosted[currentAddress]);
           
		    if (amountToRelease > 0) {
                icedBalancesTeamAndAdv_frosted[currentAddress] = SafeMath.sub(icedBalancesTeamAndAdv_frosted[currentAddress], amountToRelease);
                icedBalancesTeamAndAdv_defrosted[currentAddress] = SafeMath.add(icedBalancesTeamAndAdv_defrosted[currentAddress], amountToRelease);
                balances[currentAddress] = SafeMath.add(balances[currentAddress], amountToRelease);
            }
        }
	}

	function canDefrostAdvisors() constant returns (bool){
		return elapsedMonthsFromICOStart() == DEFROST_ADVISOR_MONTHS;
	}

	function defrostAdvisorsTokens() onlyOwner {

		require(now > START_ICO_TIMESTAMP);
		require(stopDefrost == false);

		require(elapsedMonthsFromICOStart() >= DEFROST_ADVISOR_MONTHS);
		for (uint index=0; index<vIcedBalancesAdvisors.length; index++) {
			address currentAddress = vIcedBalancesAdvisors[index];
			uint256 amountToDefrost = mapIcedBalancesAdvisors[currentAddress];
			if ( amountToDefrost > 0 ) {
				if(balances[currentAddress] > 0){
					balances[currentAddress] = SafeMath.add(balances[currentAddress], amountToDefrost);
					mapIcedBalancesAdvisors[currentAddress] = SafeMath.sub(mapIcedBalancesAdvisors[currentAddress], amountToDefrost);
				}else{
					balances[currentAddress] = amountToDefrost;
					mapIcedBalancesAdvisors[currentAddress] = SafeMath.sub(mapIcedBalancesAdvisors[currentAddress], amountToDefrost);
				}
			}
		}
	}

	/*function getNow() constant returns (uint) {
		return now;
	}*/

	function getStartIcoTimestamp() constant returns (uint) {
		return START_ICO_TIMESTAMP;
	}

	function stopBatchAssign() onlyOwner {
			require ( batchAssignStopped == false);
			batchAssignStopped = true;
	}

	function getAddressBalance(address addr) constant returns (uint256 balance)  {
			balance = balances[addr];
	}

	function getAddressAndBalance(address addr) constant returns (address _address, uint256 _amount)  {
			_address = addr;
			_amount = balances[addr];
	}

	function setStopDefrost() onlyOwner constant {
		stopDefrost = true;
	}


	function killContract() onlyOwner {
		selfdestruct(owner);
	}


}
