import {expect, use} from 'chai';
import {Contract, ethers, BigNumber} from 'ethers';
import {deployContract, MockProvider, solidity} from 'ethereum-waffle';
import AAAA from '../build/AAAAPool.json';
import AAAAConfig from '../build/AAAAConfig.json';
import AAAAMint from '../build/AAAAMint.json';
import AAAAFactory from '../build/AAAAFactory.json';
import AAAAPlatform from '../build/AAAAPlatform.json';
import AAAAToken from '../build/AAAAToken.json';
import AAAAShare from '../build/AAAAShare.json';
import AAAAQuery from '../build/AAAAQuery.json'
import ERC20 from '../build/ERC20Token.json';
import StakingReward from '../build/StakingRewards.json';
import StakingRewardFactory from '../build/StakingRewardsFactory.json';
import UniLPStrategy from '../build/UniLPStrategy.json';
import { BigNumber as BN } from 'bignumber.js'

use(solidity);

function convertBigNumber(bnAmount: BigNumber, divider: number) {
	return new BN(bnAmount.toString()).dividedBy(new BN(divider)).toFixed();
}

describe('deploy', () => {
	let provider = new MockProvider();
	const [walletMe, walletOther, walletDeveloper, walletTeam, walletSpare, walletPrice, wallet1, wallet2, wallet3, wallet4] = provider.getWallets();
	let configContract: Contract;
	let factoryContract: Contract;
	let mintContract:  Contract;
	let platformContract: Contract;
	let tokenContract: Contract;
	let shareContract: Contract;
	let masterChef 	: Contract;
	let tokenFIL 	: Contract;
	let tokenUSDT 	: Contract;
	let poolContract: Contract;
	let queryContract : Contract;
	let stakingReward : Contract;
	let stakingRewardFactory : Contract;
	let rewardToken : Contract;
	let strategy : Contract;
	let tx: any;
	let receipt: any;

	async function getBlockNumber() {
		const blockNumber = await provider.getBlockNumber()
		console.log("Current block number: " + blockNumber);
		return blockNumber;
	  }

	before(async () => {
		shareContract = await deployContract(walletDeveloper, AAAAShare);
		configContract  = await deployContract(walletDeveloper, AAAAConfig);
		factoryContract  = await deployContract(walletDeveloper, AAAAFactory);
		mintContract  = await deployContract(walletDeveloper, AAAAMint);
		platformContract  = await deployContract(walletDeveloper, AAAAPlatform);
		tokenContract  = await deployContract(walletDeveloper, AAAAToken);
		tokenUSDT 	= await deployContract(walletOther, ERC20, ['USDT', 'USDT', 18, ethers.utils.parseEther('1000000')]);
		tokenFIL 	= await deployContract(walletMe, ERC20, ['File Coin', 'FIL', 18, ethers.utils.parseEther('1000000')]);
		rewardToken = await deployContract(walletMe, ERC20, ['UNI', 'UNI', 18, ethers.utils.parseEther('1000000')]);
		queryContract = await deployContract(walletDeveloper, AAAAQuery);

		await getBlockNumber();
		stakingRewardFactory = await deployContract(walletMe, StakingRewardFactory, [rewardToken.address, 50]);
		stakingReward = await deployContract(walletMe, StakingReward, [stakingRewardFactory.address, rewardToken.address, tokenUSDT.address]);

		console.log('configContract = ', configContract.address);
		console.log('factoryContract = ', factoryContract.address);
		console.log('mintContract address = ', mintContract.address);
		console.log('platformContract address = ', platformContract.address);
		console.log('tokenContract address = ', tokenContract.address);
		console.log('tokenFIL address = ', tokenFIL.address);
		console.log('rewardToken address = ', rewardToken.address);
		console.log('stakingRewardFactory address = ', stakingRewardFactory.address);
		console.log('stakingReward address = ', stakingReward.address);

		console.log('team:', ethers.utils.formatBytes32String("team"))
		console.log('spare:', ethers.utils.formatBytes32String("spare"))
		console.log('price:', ethers.utils.formatBytes32String("price"))
		console.log('pledgePrice:', ethers.utils.formatBytes32String("pledgePrice"))
		console.log('AAAATokenUserMint:', ethers.utils.formatBytes32String("AAAATokenUserMint"))
		console.log('changePricePercent:', ethers.utils.formatBytes32String("changePricePercent"))
		console.log('liquidationRate:', ethers.utils.formatBytes32String("liquidationRate"))
		
		await configContract.connect(walletDeveloper).initialize(
			platformContract.address, 
			factoryContract.address, 
			mintContract.address, 
			tokenContract.address, 
			tokenFIL.address,
			shareContract.address,
			walletDeveloper.address
		);
		await shareContract.connect(walletDeveloper).setupConfig(configContract.address);
		await factoryContract.connect(walletDeveloper).setupConfig(configContract.address);
		await mintContract.connect(walletDeveloper).setupConfig(configContract.address);
		await platformContract.connect(walletDeveloper).setupConfig(configContract.address);
		await tokenContract.connect(walletDeveloper).setupConfig(configContract.address);
		await queryContract.connect(walletDeveloper).initialize(configContract.address);

		await configContract.connect(walletDeveloper).initParameter();
		await configContract.connect(walletDeveloper).setWallets([
			ethers.utils.formatBytes32String("team"), 
			ethers.utils.formatBytes32String("spare"), 
			ethers.utils.formatBytes32String("price")
		], [
			walletTeam.address, 
			walletSpare.address, 
			walletPrice.address
		]);
		await shareContract.connect(walletDeveloper).initialize();
		await tokenContract.connect(walletDeveloper).initialize();
		await factoryContract.connect(walletDeveloper).createPool(tokenFIL.address, tokenUSDT.address);

		let pool = await factoryContract.connect(walletDeveloper).getPool(tokenFIL.address, tokenUSDT.address);
		poolContract  = new Contract(pool, AAAA.abi, provider).connect(walletMe);

		strategy = await deployContract(walletMe, UniLPStrategy, [rewardToken.address, tokenUSDT.address, poolContract.address, stakingReward.address]);
		await platformContract.connect(walletDeveloper).switchStrategy(tokenFIL.address, tokenUSDT.address, strategy.address);

		await configContract.connect(walletPrice).setPoolPrice([pool], ['43318171973142730']);

		await tokenFIL.connect(walletMe).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenFIL.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenUSDT.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));

		await tokenFIL.connect(walletMe).transfer(walletOther.address, ethers.utils.parseEther('100000'));
	})

	it("simple test", async () => {
		await (await mintContract.connect(walletDeveloper).changeInterestRatePerBlock(ethers.utils.parseEther('2000'))).wait();
		let pool = await factoryContract.connect(walletDeveloper).getPool(tokenFIL.address, tokenUSDT.address);
		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		const poolContract  = new Contract(pool, AAAA.abi, provider).connect(walletMe);
		console.log(convertBigNumber((await poolContract.supplys(walletMe.address)).amountSupply, 1e18));
		expect(convertBigNumber((await poolContract.supplys(walletMe.address)).amountSupply, 1e18)).to.equals('1000');
		expect(convertBigNumber(await poolContract.remainSupply(), 1e18)).to.equals('1000');
		console.log(convertBigNumber(await mintContract.connect(walletMe).takeLendWithAddress(walletMe.address), 1));
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('500'));
		expect(convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1e18)).to.equals('899500');
		expect(convertBigNumber((await poolContract.supplys(walletMe.address)).amountSupply, 1e18)).to.equals('500');
		expect(convertBigNumber(await poolContract.remainSupply(), 1e18)).to.equals('500');
		console.log(convertBigNumber(await mintContract.connect(walletMe).takeLendWithAddress(walletMe.address), 1));
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('500'));
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		expect(convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1e18)).to.equals('900000');
		expect(convertBigNumber((await poolContract.supplys(walletMe.address)).amountSupply, 1e18)).to.equals('0');
		expect(convertBigNumber(await poolContract.remainSupply(), 1e18)).to.equals('0');
		console.log(convertBigNumber(await mintContract.connect(walletMe).takeLendWithAddress(walletMe.address), 1));
		await mintContract.connect(walletMe).mintLender();
		console.log(convertBigNumber(await tokenContract.balanceOf(walletMe.address), 1));
		console.log(convertBigNumber(await tokenContract.balanceOf(walletTeam.address), 1));
		console.log(convertBigNumber(await tokenContract.balanceOf(walletSpare.address), 1));
		console.log(convertBigNumber(await mintContract.connect(walletMe).takeLendWithAddress(walletMe.address), 1));
	})

	async function sevenInfo() {
		let result = {
			interestPerSupply: await poolContract.interestPerSupply(),
			liquidationPerSupply: await poolContract.liquidationPerSupply(),
			interestPerBorrow : await poolContract.interestPerBorrow(),
			totalLiquidation: await poolContract.totalLiquidation(),
			totalLiquidationSupplyAmount: await poolContract.totalLiquidationSupplyAmount(),
			totalBorrow: await poolContract.totalBorrow(),
			totalPledge: await poolContract.totalPledge(),
			remainSupply: await poolContract.remainSupply(),
			lastInterestUpdate: await poolContract.lastInterestUpdate()
		};

		console.log('===sevenInfo begin===');
		for (let k in result) {
			console.log(k+':', convertBigNumber(result[k], 1))
		}
		console.log('===sevenInfo end===')
		return result;
	};

	async function SupplyStruct(user:any) {
		let result = await poolContract.supplys(user);

		console.log('===SupplyStruct begin===');
		for (let k in result) {
			console.log(k+':', convertBigNumber(result[k], 1))
		}
		console.log('===SupplyStruct end===');
		return result;
	};

	async function BorrowStruct(user:any) {
		let result = await poolContract.borrows(user);

		console.log('===BorrowStruct begin===');
		for (let k in result) {
			console.log(k+':', convertBigNumber(result[k], 1))
		}
		console.log('===BorrowStruct end===');
		return result;
	};

	it('deposit(1000) -> borrow(100) -> repay(100) -> withdraw(1000)', async() => {
		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));

		let maxBorrow = await poolContract.getMaximumBorrowAmount(ethers.utils.parseEther('10000'));
		console.log('maxBorrow:', convertBigNumber(maxBorrow, 1));
		await platformContract.connect(walletOther).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'), maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenUSDT.balanceOf(walletOther.address), 1),
			convertBigNumber(await tokenFIL.balanceOf(walletOther.address), 1),
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));

		console.log('getInterests:', convertBigNumber(await poolContract.getInterests(),1));

		tx = await platformContract.connect(walletOther).repay(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'));
		let receipt = await tx.wait()
		console.log('repay gas:', receipt.gasUsed.toString())
		// console.log('events:', receipt.events)
		// console.log(receipt.events[2].event, 'args:', receipt.events[2].args)
		// console.log('_supplyAmount:', convertBigNumber(receipt.events[2].args._supplyAmount, 1))
		// console.log('_collateralAmount:', convertBigNumber(receipt.events[2].args._collateralAmount, 1))
		// console.log('_interestAmount:', convertBigNumber(receipt.events[2].args._interestAmount, 1))

		console.log('after repay: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));

		// await SupplyStruct(walletMe.address);
		// await sevenInfo();
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after withdraw: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
	});

	it('deposit(1000) -> borrow(100) -> liquidation(100) -> withdraw(1000)', async() => {
		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		let maxBorrow = await poolContract.getMaximumBorrowAmount(ethers.utils.parseEther('10000'));
		await platformContract.connect(walletOther).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'), maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.01'));
		await platformContract.connect(walletMe).liquidation(tokenFIL.address, tokenUSDT.address, walletOther.address);
		console.log('after liquidation: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		// await SupplyStruct(walletMe.address);
		// await sevenInfo();
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.02'));
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after withdraw: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
	});

	it('deposit(1000) -> borrow(100) -> liquidation(100) -> reinvest() -> withdraw(1000)', async() => {
		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		let maxBorrow = await poolContract.getMaximumBorrowAmount(ethers.utils.parseEther('10000'));
		await platformContract.connect(walletOther).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'), maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.01'));
		await platformContract.connect(walletMe).liquidation(tokenFIL.address, tokenUSDT.address, walletOther.address);
		console.log('after liquidation: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		let tx = await poolContract.liquidationHistory(walletOther.address, 0);
		// console.log(tx)
		// await SupplyStruct(walletMe.address);
		// console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		await platformContract.connect(walletMe).reinvest(tokenFIL.address, tokenUSDT.address);
		// console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		// await SupplyStruct(walletMe.address);
		// await sevenInfo();
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.02')); 
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		console.log('after withdraw: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1));
		// await sevenInfo();
	});

	it('liquidation list test', async() => {

		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));

		await tokenUSDT.connect(walletOther).transfer(wallet1.address, ethers.utils.parseEther('1000'));
		await tokenUSDT.connect(walletOther).transfer(wallet2.address, ethers.utils.parseEther('1000'));
		await tokenUSDT.connect(walletOther).transfer(wallet3.address, ethers.utils.parseEther('1000'));
		await tokenUSDT.connect(walletOther).transfer(wallet4.address, ethers.utils.parseEther('1000'));

		await tokenUSDT.connect(wallet1).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenUSDT.connect(wallet2).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenUSDT.connect(wallet3).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenUSDT.connect(wallet4).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		// console.log('wallet team2:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))

		await platformContract.connect(wallet1).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'), ethers.utils.parseEther('1'));
		// await platformContract.connect(wallet2).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'), ethers.utils.parseEther('1'));
		// await platformContract.connect(wallet3).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'), ethers.utils.parseEther('1'));
		// await platformContract.connect(wallet4).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'), ethers.utils.parseEther('1'));
		//await platformContract.connect(wallet5).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'), ethers.utils.parseEther('1'));

		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('500'));
		// console.log('wallet share:', convertBigNumber(await tokenFIL.balanceOf(shareContract.address),1e18))
		// console.log('wallet team3:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		// console.log('user:', await mintContract.connect(walletOther).numberOfLender(), await mintContract.connect(walletOther).numberOfBorrower());

		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0')); 
		// console.log('wallet team4:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		// await platformContract.connect(walletDeveloper).updatePoolParameter(
		// 	tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.001')); 
		await platformContract.connect(walletMe).liquidation(tokenFIL.address, tokenUSDT.address, wallet1.address);

		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('500'));

		// console.log('hello world')

		let tx = await queryContract.iterateLiquidationInfo(0, 0, 10);

		// for(var i = 0 ;i < tx.liquidationCount.toNumber(); i ++)
		// {
		// 	console.log(tx.liquidationList[i].user, tx.liquidationList[i].expectedRepay.toString(), tx.liquidationList[i].amountCollateral.toString())
		// }


		// console.log(tx.liquidationCount.toString())
		// console.log(tx.poolIndex.toString())
		// console.log(tx.userIndex.toString())
		//1000000000000000000000
		//   1000000038717656007
	});

	it('test circuit breaker', async()=>{
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
		console.log('wallet share:', convertBigNumber(await tokenFIL.balanceOf(shareContract.address),1e18))

		// let priceDurationKey = ethers.utils.formatBytes32String('changePriceDuration');
		// let price002 = ethers.utils.parseEther('0.002')
		// let price001 = ethers.utils.parseEther('0.001')
		// console.log((await configContract.params(priceDurationKey)).toString())
		// // await configContract.connect(walletPrice).setPoolPrice([poolContract.address], [price002]); 
		// expect(await configContract.connect(walletPrice).setPoolPrice([poolContract.address], [price002])).to.be.revertedWith('7UP: Price FORBIDDEN'); 
		// console.log('hello world')
		// expect(await configContract.connect(walletPrice).setPoolPrice([poolContract.address], [price002])).to.be.revertedWith('7UP: Price FORBIDDEN'); 
		
		// await configContract.connect(walletDeveloper).setParameter([priceDurationKey],[0]);
		// console.log((await configContract.params(priceDurationKey)).toString())
		// expect(await configContract.connect(walletPrice).setPoolPrice([poolContract.address], [price002])).to.be.revertedWith('7UP: Config FORBIDDEN'); 
		// console.log('set price to 0.002')
		// await configContract.connect(walletPrice).setPoolPrice([poolContract.address], [price002]); 
		// console.log('set price to 0.001')
		// await configContract.connect(walletDeveloper).setPoolPrice([poolContract.address], [ethers.utils.parseEther('0.001')]); 
	});

	it('test withdrawable/reinvestable', async() => {
		let platformShare = await configContract.params(ethers.utils.formatBytes32String('platformShare'));
		let totalSupply = (await poolContract.totalBorrow()).add(await poolContract.remainSupply());
		let interestPerSupply = await poolContract.interestPerSupply(); 
		let interests = await poolContract.getInterests();
		let totalBorrow = await poolContract.totalBorrow();
		let meInterests = (await poolContract.supplys(walletMe.address)).interests;
		let interestSettled = (await  poolContract.supplys(walletMe.address)).interestSettled;
		let meSupply = (await poolContract.supplys(walletMe.address)).amountSupply;
		let remainSupply = (await poolContract.remainSupply());
		let deltaBlock = (await provider.getBlockNumber()) - (await poolContract.lastInterestUpdate());

		meInterests = meInterests.add(interestPerSupply.mul(meSupply).div(ethers.utils.parseEther('1')).sub(interestSettled));

		console.log('deltaBlock=', deltaBlock);
		console.log('totalSupply=', convertBigNumber(totalSupply, 1e18));
		console.log('interestPerSupply=', convertBigNumber(interestPerSupply, 1e18));
		console.log('interests=', convertBigNumber(interests, 1e18));
		console.log('totalBorrow=', convertBigNumber(totalBorrow, 1e18));
		console.log('meInterests=', convertBigNumber(meInterests, 1e18));
		console.log('interestSettled=', convertBigNumber(interestSettled, 1e18));
		console.log('meSupply=', convertBigNumber(meSupply,1e18));
		console.log('platformShare=', convertBigNumber(platformShare, 1e18));
		console.log('remainSupply=', convertBigNumber(remainSupply, 1e18));

		//test reinvestable :
		let reinvestAmount = meInterests * platformShare / 1e18
		if(reinvestAmount < remainSupply)
		{
			console.log('ok to invest');
		}
		else 
		{
			console.log('not enough money to pay');
		}

		//test withdrawable :
		let a = meInterests - meInterests.mul(platformShare).div(ethers.utils.parseEther('1'));
		console.log('a=', a);
		let withdrawAmount = meSupply.add(a);
		console.log('withdrawAmount=', convertBigNumber(withdrawAmount, 1e18));
		if(withdrawAmount < remainSupply)
		{
			console.log('ok  to withdraw');
		}
		else
		{
			console.log('not enough money to withdraw');
		}
	})

})
