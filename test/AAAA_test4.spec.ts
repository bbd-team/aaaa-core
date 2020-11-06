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
	let tokenFIL 	: Contract;
	let tokenUSDT 	: Contract;
	let poolContract: Contract;
	let queryContract : Contract;

	before(async () => {
		shareContract = await deployContract(walletDeveloper, AAAAShare);
		configContract  = await deployContract(walletDeveloper, AAAAConfig);
		factoryContract  = await deployContract(walletDeveloper, AAAAFactory);
		mintContract  = await deployContract(walletDeveloper, AAAAMint);
		platformContract  = await deployContract(walletDeveloper, AAAAPlatform);
		tokenContract  = await deployContract(walletDeveloper, AAAAToken);
		tokenUSDT 	= await deployContract(walletOther, ERC20, ['USDT', 'USDT', 18, ethers.utils.parseEther('1000000')]);
		tokenFIL 	= await deployContract(walletMe, ERC20, ['File Coin', 'FIL', 18, ethers.utils.parseEther('1000000')]);
		queryContract = await deployContract(walletDeveloper, AAAAQuery);

		console.log('configContract = ', configContract.address);
		console.log('factoryContract = ', factoryContract.address);
		console.log('mintContract address = ', mintContract.address);
		console.log('platformContract address = ', platformContract.address);
		console.log('tokenContract address = ', tokenContract.address);
		console.log('tokenFIL address = ', tokenFIL.address);

		console.log('team:', ethers.utils.formatBytes32String("team"))
		console.log('spare:', ethers.utils.formatBytes32String("spare"))
		console.log('price:', ethers.utils.formatBytes32String("price"))
		console.log('pledgePrice:', ethers.utils.formatBytes32String("pledgePrice"))
		console.log('AAAATokenUserMint:', ethers.utils.formatBytes32String("AAAATokenUserMint"))
		console.log('changePricePercent:', ethers.utils.formatBytes32String("changePricePercent"))
		console.log('liquidationRate:', ethers.utils.formatBytes32String("liquidationRate"))
		console.log('marketFrenzy:', ethers.utils.formatBytes32String("marketFrenzy"))
		
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

		await configContract.connect(walletPrice).setPoolPrice([pool], ['43318171973142730']);

		await tokenFIL.connect(walletMe).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenFIL.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));
		await tokenUSDT.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));

		await tokenFIL.connect(walletMe).transfer(walletOther.address, ethers.utils.parseEther('100000'));
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
			console.log(k+':', convertBigNumber(result[k], 1e18))
		}
		console.log('===sevenInfo end===')
		return result;
	};

	async function SupplyStruct(user:any) {
		let result = await poolContract.supplys(user);

		console.log('===SupplyStruct begin===');
		for (let k in result) {
			console.log(k+':', convertBigNumber(result[k], 1e18))
		}
		console.log('===SupplyStruct end===');
		return result;
	};

	it('deposit(10000) -> borrow(126) -> withdraw(5000) -> liquidation(walletOther) -> withdraw(5000)', async() => {
		console.log('after withdraw Supplyer: ', 
		convertBigNumber(await tokenFIL.balanceOf(walletOther.address), 1e18), 
		convertBigNumber(await tokenUSDT.balanceOf(walletOther.address), 1e18),
		
		convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1e18), 
		convertBigNumber(await tokenUSDT.balanceOf(walletMe.address), 1e18));	
		await platformContract.connect(walletMe).deposit(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'));
		console.log('after deposit: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1e18));
		let maxBorrow = await poolContract.getMaximumBorrowAmount(ethers.utils.parseEther('10000'));
		await platformContract.connect(walletOther).borrow(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('10000'), maxBorrow);
		console.log('after borrow: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1e18));
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.01'));
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('5000'));
		console.log('after withdraw 500: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1e18));
		await platformContract.connect(walletMe).liquidation(tokenFIL.address, tokenUSDT.address, walletOther.address);
		console.log('after liquidation: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1e18));
		await SupplyStruct(walletMe.address);
		await sevenInfo();
		await platformContract.connect(walletDeveloper).updatePoolParameter(
			tokenFIL.address, tokenUSDT.address, ethers.utils.formatBytes32String("pledgePrice"), ethers.utils.parseEther('0.02'));
		// await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('1000'));
		await platformContract.connect(walletMe).withdraw(tokenFIL.address, tokenUSDT.address, ethers.utils.parseEther('4999.9999'));
		console.log('after withdraw contract: ', 
			convertBigNumber(await tokenFIL.balanceOf(poolContract.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(poolContract.address), 1e18));
		console.log('after withdraw Supplyer: ', 
			convertBigNumber(await tokenFIL.balanceOf(walletOther.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(walletOther.address), 1e18),
			convertBigNumber(await tokenFIL.balanceOf(walletMe.address), 1e18), 
			convertBigNumber(await tokenUSDT.balanceOf(walletMe.address), 1e18));				
		console.log('wallet team:', convertBigNumber(await tokenFIL.balanceOf(walletTeam.address),1e18))
	});

})
