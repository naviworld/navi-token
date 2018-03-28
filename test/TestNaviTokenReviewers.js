const BigNumber = web3.BigNumber;

const TOKEN_DECIMALS_MULTIPLIER = 10**18;

const makeTokens = amount => new BigNumber(amount).mul(TOKEN_DECIMALS_MULTIPLIER).floor();

require('chai')
    .use(require("chai-bignumber")(BigNumber))
    .use(require('chai-as-promised'))
    .should();

const NaviToken = artifacts.require("./NaviToken.sol");

const increaseTime = (addSeconds) => new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
        [{jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0},
            {jsonrpc: "2.0", method: "evm_mine", params: [], id: 0}
        ],
        function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }
    );
});
const snapshot = () => new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
        {jsonrpc: "2.0", method: "evm_snapshot", params: [], id: 0},
        function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }
    );
});
const revert = (id) => new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
        {jsonrpc: "2.0", method: "evm_revert", params: [id], id: 0},
        function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }
    );
});

function makePseudoAdress() {
    var text = "";
    var possible = "abcdef0123456789";
    for (var i = 0; i < 40; i++)
        text += possible.charAt(Math.floor(Math.random() *
            possible.length));
    return "0x" + text;
}

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

contract('NaviToken', accounts => {
    let snapshotId;

    beforeEach(async () => {
        snapshotId = (await snapshot()).result;
    });

    afterEach(async () => {
        await revert(snapshotId);
    });

    it("#1 defrost advisor's tokens", async () => {
        const token = await NaviToken.new();
        const addresses = [
            accounts[1]
        ];
        const amounts = [makeTokens(100000000)]; // 100'000'000 tokens
        const classes = [2];

        await token.batchAssignTokens(addresses, amounts, classes);

        await token.balanceOf(addresses[0]).should.eventually.bignumber.be.zero;
        await token.defrostReserveAndTeamTokens().should.be.eventually.rejected;
        await increaseTime(months(7));
        await token.defrostAdvisorsTokens();

        await token.balanceOf(addresses[0])
            .should.eventually.bignumber.be.equals(amounts[0]);
    });

    it('#2 defrost several times in one month', async () => {
        const token = await NaviToken.new();
        const addresses = [
            accounts[1],
        ];
        const amounts = [makeTokens(100000000)]; // 100'000'000 tokens
        const classes = [1];

        await token.batchAssignTokens(addresses, amounts, classes);

        await token.balanceOf(addresses[0]).should.eventually.bignumber.be.zero;

        await increaseTime(months(7));

        for (let i = 0; i < 3; i++) {
            await token.defrostReserveAndTeamTokens();
            await token.balanceOf(addresses[0])
                .should.eventually.bignumber.equals(
                    amounts[0].div(30).floor());
}
    });

    it('#3 distribution lifecycle', async () => {
        const token = await NaviToken.new();
        const addresses = [
            accounts[1],
            accounts[2],
            accounts[3],
            accounts[4]
        ];
        const amounts = [makeTokens(300000000), makeTokens(200000000), makeTokens(200000000), makeTokens(200000000)]; // 900'000'000 tokens
        const classes = [0, 0, 1, 2];

        await token.batchAssignTokens(addresses, amounts, classes);

        await token.balanceOf(addresses[0]).should.eventually.bignumber.equals(amounts[0]);
        await token.balanceOf(addresses[1]).should.eventually.bignumber.equals(amounts[1]);
        await token.balanceOf(addresses[2]).should.eventually.bignumber.be.zero;
        await token.balanceOf(addresses[3]).should.eventually.bignumber.be.zero;

        await token.defrostReserveAndTeamTokens().should.be.eventually.rejected;

        await increaseTime(months(6));
        for (let i = 1; i <= 30; i++) {
            await increaseTime(months(1) + seconds(1));
            await token.defrostReserveAndTeamTokens();
            await token.balanceOf(addresses[2])
                .should.eventually.bignumber.equals(
                    new BigNumber(amounts[2]).mul(i).div(30).floor());
        }
    });

    it('#4 defrost, transfer, defrost', async () => {
        const token = await NaviToken.new();
        const addresses = [
            accounts[1]
        ];
        const amounts = [makeTokens(100000000)];
        const classes = [1];
        await token.batchAssignTokens(addresses, amounts, classes);

        await increaseTime(months(7));
        await token.defrostReserveAndTeamTokens();
        await token.balanceOf(addresses[0])
            .should.eventually.bignumber.equals(
                new BigNumber(amounts[0]).div(30).floor());

        await token.transfer(accounts[0], await token.balanceOf(addresses[0]), {from: addresses[0]});

        await increaseTime(months(1));
        await token.defrostReserveAndTeamTokens();

        await token.balanceOf(addresses[0])
            .should.eventually.bignumber.equals(
                new BigNumber(amounts[0]).div(30).floor());
    });

    it('#5 distribute more tokens than MAX_NUM_NAVITOKENS', async () => {
        const token = await NaviToken.new();
        const addresses = [
            accounts[1],
            accounts[2],
            accounts[3]
        ];
        const amounts = [makeTokens(1000000000), makeTokens(200000000), makeTokens(100000000)]; // 1'300'000'000 tokens
        const classes = [0, 1, 2];

        await token.batchAssignTokens(addresses, amounts, classes).should.be.eventually.rejected;
    });

    it('#6 check totalSupply', async () => {
        const token = await NaviToken.new();
        await token.totalSupply().should.eventually.bignumber.equals(await token.balanceOf(await token.owner()));
    });

    it('#7 double assignment', async () => {
        const token = await NaviToken.new();

        await token.batchAssignTokens([accounts[1]], [makeTokens(100000)], [0]);
        await token.batchAssignTokens([accounts[1]], [makeTokens(500000)], [0]);

        await token.balanceOf(accounts[1]).should.eventually.bignumber.equals(makeTokens(100000).add(makeTokens(500000)));
    });

    it('#8 try to assign after defrost', async () => {
        const token = await NaviToken.new();

        await token.batchAssignTokens([accounts[1]], [makeTokens(300000000)], [1]);
        // await token.stopBatchAssign(); // as if by chance forgot to perform

        await increaseTime(months(7));
        await token.defrostReserveAndTeamTokens();
        await token.batchAssignTokens([accounts[2]], [makeTokens(100000000)], [1]).should.eventually.be.rejected;
    });

    it('#9 defrost tokens after 40 month', async () => {
        const token = await NaviToken.new();
        const addresses = [accounts[1], accounts[2]];
        const amounts = [makeTokens(300000000), makeTokens(200000000)]; // 900'000'000 tokens
        const classes = [1, 2];

        await token.batchAssignTokens(addresses, amounts, classes);

        await token.balanceOf(addresses[0]).should.eventually.bignumber.be.zero;
        await token.balanceOf(addresses[1]).should.eventually.bignumber.be.zero;

        await token.defrostReserveAndTeamTokens().should.be.eventually.rejected;

        await increaseTime(months(40));
        await token.defrostReserveAndTeamTokens();
        await token.balanceOf(addresses[0]).should.eventually.bignumber.equal(amounts[0]);

        await token.defrostAdvisorsTokens();
        await token.balanceOf(addresses[1]).should.eventually.bignumber.equal(amounts[1]);
    });

    it('#10 try to assign after 2 month from ICO', async () => {
        const token = await NaviToken.new();

        await token.batchAssignTokens([accounts[1]], [makeTokens(300000000)], [1]);
        // await token.stopBatchAssign(); // as if by chance forgot to perform

      await increaseTime(months(2) - seconds(1));
      await token.batchAssignTokens([accounts[2]], [makeTokens(100000000)], [1]).should.eventually.be.fulfilled;

        await increaseTime(months(2) + seconds(1));
        await token.batchAssignTokens([accounts[2]], [makeTokens(100000000)], [1]).should.eventually.be.rejected;
    });

    it('ReserveAndTeam Defrosting pass with 120 addresses', async () => {
        const token = await NaviToken.new();
        let addresses = [];
        let amounts = [];
        let classes = [];
        for (let i = 0; i < 100; i++) {
            addresses.push(makePseudoAdress());
            amounts.push(makeTokens(1000));
            classes.push(1);
        }
        await token.batchAssignTokens(addresses, amounts, classes);
        addresses = [];
        amounts = [];
        classes = [];
        for (let i = 0; i < 20; i++) {
            addresses.push(makePseudoAdress());
            amounts.push(makeTokens(1000));
            classes.push(1);
        }
        await token.batchAssignTokens(addresses, amounts,
            classes);
        await increaseTime(months(7));
        await token.defrostReserveAndTeamTokens();
    });

    // it('ReserveAndTeam Defrosting fail with 130 addresses', async () => {
    //     const token = await NaviToken.new();
    //     let addresses = [];
    //     let amounts = [];
    //     let classes = [];
    //     for (let i = 0; i < 100; i++) {
    //         addresses.push(makePseudoAdress());
    //         amounts.push(1000);
    //         classes.push(1);
    //     }
    //     await token.batchAssignTokens(addresses, amounts, classes);
    //
    //     addresses = [];
    //     amounts = [];
    //     classes = [];
    //     for (let i = 0; i < 50; i++) {
    //         addresses.push(makePseudoAdress());
    //         amounts.push(1000);
    //         classes.push(1);
    //     }
    //     await token.batchAssignTokens(addresses, amounts, classes);
    //     await increaseTime(months(7));
    //     await token.defrostReserveAndTeamTokens();
    // });

    it('Advisors Defrosting pass with 200 adresses', async () => {
        const token = await NaviToken.new();
        let addresses = [];
        let amounts = [];
        let classes = [];
        for (let i = 0; i < 100; i++) {
            addresses.push(makePseudoAdress());
            amounts.push(makeTokens(1000));
            classes.push(2);
        }
        await token.batchAssignTokens(addresses, amounts, classes);
        addresses = [];
        amounts = [];
        classes = [];
        for (let i = 0; i < 100; i++) {
            addresses.push(makePseudoAdress());
            amounts.push(makeTokens(1000));
            classes.push(2);
        }
        await token.batchAssignTokens(addresses, amounts, classes);
        await increaseTime(months(7));
        await token.defrostAdvisorsTokens();
    });

    it('ETH payments are not acceptable', async () => {
        const token = await NaviToken.new();
        await token.send(web3.toWei(1, 'ether')).should.be.rejectedWith('revert');
    });



    // it('Advisors Defrosting pass with 250 addresses', async () => {
    //     const token = await NaviToken.new();
    //     let addresses = [];
    //     let amounts = [];
    //     let classes = [];
    //     for (let i = 0; i < 100; i++) {
    //         addresses.push(makePseudoAdress());
    //         amounts.push(1000);
    //
    //         classes.push(2);
    //     }
    //     await token.batchAssignTokens(addresses, amounts, classes);
    //     addresses = [];
    //     amounts = [];
    //     classes = [];
    //     for (let i = 0; i < 100; i++) {
    //         addresses.push(makePseudoAdress());
    //         amounts.push(1000);
    //         classes.push(2);
    //     }
    //     await token.batchAssignTokens(addresses, amounts, classes);
    //     addresses = [];
    //     amounts = [];
    //     classes = [];
    //     for (let i = 0; i < 50; i++) {
    //         addresses.push(makePseudoAdress());
    //         amounts.push(1000);
    //         classes.push(2);
    //     }
    //
    //     await token.batchAssignTokens(addresses, amounts, classes);
    //     await increaseTime(months(7));
    //     await token.defrostAdvisorsTokens();
    // });
});
