pragma solidity 0.4.15;

import "./StandardToken.sol";
import "./Ownable.sol";
import "./SafeMath.sol";

contract NaviToken is StandardToken, Ownable {

	/* Overriding some ERC20 variables */
	string public constant name      = "NaviToken";
	string public constant symbol    = "NVT";
	uint256 public constant decimals = 18;

	uint256 public constant MAX_NUM_NAVITOKENS    = 1000000000;// * 10 ** decimals;
	// Freeze duration for TeamAndAdvisors accounts
	// uint256 public constant START_ICO_TIMESTAMP   = 1501595111;  // line to decomment for the PROD before the main net deployment
	uint256 public START_ICO_TIMESTAMP; // line to remove before the main net deployment (not constant for testing and overwritten in the constructor)
	uint public constant DEFROST_MONTH_IN_MINUTES = 2; // month in minutes  (1month = 43200 min)
	uint public constant DEFROST_EQUITIES_MONTHS = 4; 
	uint public constant DEFROST_TEAMADVISOR_MONTHS = 8; 

	// Fields that can be changed by functions
	address[] vIcedBalancesEquities;
	address[] vIcedBalancesTeamAndAdvisors;
	mapping (address => uint256) mapIcedBalancesEquities;
	mapping (address => uint256) mapIcedBalancesTeamAndAdvisors;


	// Variable usefull for verifying that the assignedSupply matches that totalSupply
	uint256 public assignedSupply;
	//Boolean to allow or not the initial assignement of token (batch)
	bool public batchAssignStopped = false;


	function NaviToken() {
		owner                	= msg.sender;
		uint256 amountReserve  	= MAX_NUM_NAVITOKENS * 30 / 100;
		balances[owner]  		= amountReserve;
		totalSupply          	= MAX_NUM_NAVITOKENS;
		assignedSupply       	= amountReserve;

		// for test only: set START_ICO to contract creation timestamp
		// +600 => add 10 minutes
		START_ICO_TIMESTAMP = now + 600; // line to remove before the main net deployment 
	}

	/**
   * @dev Transfer tokens in batches (of adresses)
   * @param _vaddr address The address which you want to send tokens from
   * @param _vamounts address The address which you want to transfer to
   */
  function batchAssignTokens(address[] _vaddr, uint[] _vamounts, uint[] _vDefrostClass ) onlyOwner {
			require ( batchAssignStopped == false );
			require ( _vaddr.length == _vamounts.length && 
							_vamounts.length == _vamounts.length && _vDefrostClass.length == _vDefrostClass.length);
			//Looping into input arrays to assign target amount to each given address
			for (uint index=0; index<_vaddr.length; index++) {
				address toAddress = _vaddr[index];
				uint amount = _vamounts[index] * 10 ** decimals;
				uint defrostClass = _vDefrostClass[index]; // 0=ico investor, 1=equity , 2=advisor 
			
				assignedSupply += amount ;
				if (  defrostClass  == 0 ) {
					// investor account
					balances[toAddress] += amount;
				}
				else if(defrostClass == 1){
					// equity account: tokens to defrost
					vIcedBalancesEquities.push(toAddress);
				}else if(defrostClass == 2){
					// TeamAndAdvisors account: tokens to defrost
					vIcedBalancesTeamAndAdvisors.push(toAddress) ;
				}
			}
	}

	function getBlockTimestamp() constant returns (uint256){
		return now;
	}

	function defrostEquitiesTokens() onlyOwner {

		require(now>START_ICO_TIMESTAMP);
		require(elapsedMonthsFromICOStart() >= DEFROST_EQUITIES_MONTHS);
		for (uint index=0; index<vIcedBalancesEquities.length; index++) {
			address currentAddress = vIcedBalancesEquities[index];
			uint256 amountToDefrost = mapIcedBalancesEquities[currentAddress];
			if ( amountToDefrost > 0 ) {
				balances[currentAddress] = balances[currentAddress] + amountToDefrost;
			}
		}
	}

	function defrostTeamAndAdvisorsTokens() onlyOwner {

		require(now > START_ICO_TIMESTAMP);
		require(elapsedMonthsFromICOStart() >= DEFROST_TEAMADVISOR_MONTHS);
		for (uint index=0; index<vIcedBalancesTeamAndAdvisors.length; index++) {
			address currentAddress = vIcedBalancesTeamAndAdvisors[index];
			uint256 amountToDefrost = mapIcedBalancesTeamAndAdvisors[currentAddress];
			if ( amountToDefrost > 0 ) {
				balances[currentAddress] = balances[currentAddress] + amountToDefrost;
			}
		}
	}

	function elapsedMonthsFromICOStart() constant returns (uint elapsed) {
		elapsed = ((now-START_ICO_TIMESTAMP)/60)/DEFROST_MONTH_IN_MINUTES;
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

	/*function getIcedAddressesEquities() constant returns (address[] vaddr)  {
			vaddr = vIcedBalancesEquities;
	}
	
	function getIcedAddressesTeamAndAdvisors() constant returns (address[] vaddr)  {
			vaddr = vIcedBalancesTeamAndAdvisors;
	}*/

	function isEquityIced(address addr) constant returns (bool)  {
			uint256 amountToDefrost = mapIcedBalancesEquities[addr];
			return amountToDefrost > 0;
	}

	function isAdvisorIced(address addr) constant returns (bool)  {
			uint256 amountToDefrost = mapIcedBalancesTeamAndAdvisors[addr];
			return amountToDefrost > 0;
	}


	function killContract() onlyOwner {
		selfdestruct(owner);
	}


}
