
HOW TO TEST

- download the project
- unzip the NAV.zip file on the same folder to get the PARAMS/OUTPUTS/DEFROST folders
- set your parameters changing files in the PARAMS folder
- run an ethereum testnet node 
- you must have/create 10 accounts on your testnet

- run truffle compile (install missing modules - if any)
- run truffle test  (install missing modules - if any)

- set the number of accounts you want to create in the num_accounts_2_create.txt file (PARAMS folder)

- launch the generateAssingAccounts.js script to get N accounts  (first 10 are true accounts, others are fake ones)
	- account[0] is the owner
	- account[1][2][3] are TEAM/ADVISORS 
	- account[4][5][6] are EQUITIES investors
	- account[>=10] are fare address randomly assigned to ona of the trees classes (TEAM/RESERVE - ADVISORS - NORMAL INVESTOR)
	please note that account[>=10] have no private keys: if you want to test token transfer (locally or on a wallet) you must use one of 10 first accounts

- launch the AssignTokensScheduler.js             to dispatch token to all investors
- launch the verifyBatchAssignNormalInvestor.js   to check that token amounts are correctly assigned to NORMAL INVESTORS
- launch the TryDefrostAdvisors.js	          to defrost advisors tokens ( only frosted for 6 month )
- launch the TryDefrostReserveAndTeam.js         to defrost  TEAM/RESERVE  investors tokens ( frosted for 6 month and then vested for 30 month )

please note: before defrost you must wait for :
* ICO started: change this manually in the constructor to set the ICO start timestamp
		// for test only: set START_ICO to contract creation timestamp
		// +600 => add 10 minutes
		START_ICO_TIMESTAMP = now + 600; // line to remove before the main net deployment 
* is time to defrost: period before defrosting is elapsed for equities or team/advisor: please change parameters in the NaviToken.sol smart contract to speed-up the overall procedure during tests
		
		int public constant MONTH_IN_MINUTES = 2; // month in minutes  (1month = 43200 min)
		int public constant DEFROST_AFTER_MONTHS = 6;
