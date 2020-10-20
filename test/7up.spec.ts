import {expect, use} from 'chai';
import {Contract, BigNumber} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import SevenUp from '../build/SevenUpPool.json';
import ERC20 from '../build/ERC20Token.json';
import { BigNumber as BN } from 'bignumber.js'

use(solidity);

function convertBigNumber(bnAmount: BigNumber, divider: number) {
	return new BN(bnAmount.toString()).dividedBy(new BN(divider)).toFixed();
}

describe('7up', () => {
	let provider = new MockProvider();
	const [walletMe, walletOther, walletPool, newGovernor, walletTeam, walletInit] = provider.getWallets();
	let tokenUSDT 	: Contract;
	let tokenFIL 	: Contract;

	let sevenContract : Contract;
	let masterChef 	: Contract;
	

	async function getBlockNumber() {
		const blockNumber = await provider.getBlockNumber()
		console.log("Current block number: " + blockNumber);
		return blockNumber;
	  }

	before(async () => {
		sevenContract  = await deployContract(walletMe, SevenUp);
		tokenUSDT 	= await deployContract(walletOther, ERC20, ['USDT', 'USDT', 18, 1000000]);
		tokenFIL 	= await deployContract(walletMe, ERC20, ['File Coin', 'FIL', 18, 1000000]);
		
		await sevenContract.connect(walletMe).init(tokenFIL.address, tokenUSDT.address);
		await sevenContract.connect(walletMe).updatePledgeRate(5000); // 60% pledge rate
		await sevenContract.connect(walletMe).updatePledgePrice(200); // 0.02 FIL = 1 USDT
		await sevenContract.connect(walletMe).updateLiquidationRate(9000); // 0.02 FIL = 1 USDT
		
		console.log('walletMe = ', walletMe.address);
		console.log('walletOther = ', walletOther.address);
		console.log('7up address = ', sevenContract.address);
		console.log('USDT address = ', tokenUSDT.address);
		console.log('FIL address = ', tokenFIL.address);
		await tokenFIL.connect(walletMe).approve(sevenContract.address, 99999999999999);
		await tokenFIL.connect(walletOther).approve(sevenContract.address, 99999999999999);
		await tokenUSDT.connect(walletOther).approve(sevenContract.address, 99999999999999);

		await tokenFIL.connect(walletMe).transfer(walletOther.address, 100000);
	});

	it('simple deposit & withdraw', async() => {
		
		await sevenContract.connect(walletMe).deposit(1000);
		console.log(convertBigNumber((await sevenContract.supplys(walletMe.address)).amountSupply, 1));
		expect(convertBigNumber((await sevenContract.supplys(walletMe.address)).amountSupply, 1)).to.equals('1000');
		expect(convertBigNumber(await sevenContract.remainSupply(), 1)).to.equals('1000');

		await sevenContract.connect(walletMe).withdraw(500);
		expect(convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1)).to.equals('899500');
		expect(convertBigNumber((await sevenContract.supplys(walletMe.address)).amountSupply, 1)).to.equals('500');
		expect(convertBigNumber(await sevenContract.remainSupply(), 1)).to.equals('500');

		await sevenContract.connect(walletMe).withdraw(500);
		expect(convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1)).to.equals('900000');
		expect(convertBigNumber((await sevenContract.supplys(walletMe.address)).amountSupply, 1)).to.equals('0');
		expect(convertBigNumber(await sevenContract.remainSupply(), 1)).to.equals('0');
	});

	it('deposit(1000) -> borrow(100) -> repay(100) -> withdraw(1000)', async() => {
		await sevenContract.connect(walletMe).deposit(1000);
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		let maxBorrow = await sevenContract.getMaximumBorrowAmount(10000);
		await sevenContract.connect(walletOther).borrow(10000, maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		await sevenContract.connect(walletOther).repay(10000);
		console.log('after repay: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		await sevenContract.connect(walletMe).withdraw(1000);
		console.log('after withdraw: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));
	});

	it('deposit(1000) -> borrow(100) -> liquidation(100) -> withdraw(1000)', async() => {
		await sevenContract.connect(walletMe).deposit(1000);
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		let maxBorrow = await sevenContract.getMaximumBorrowAmount(10000);
		await sevenContract.connect(walletOther).borrow(10000, maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		await sevenContract.connect(walletMe).updatePledgePrice(100); // 0.02 FIL = 1 USDT
		await sevenContract.connect(walletMe).liquidation(walletOther.address);
		console.log('after liquidation: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));

		await sevenContract.connect(walletMe).withdraw(1000);
		console.log('after withdraw: ', 
			convertBigNumber(await tokenFIL.balanceOf(sevenContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(sevenContract.address), 1));
	});
});