"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var ethers_1 = require("ethers");
var ethereum_waffle_1 = require("ethereum-waffle");
var AAAAPool_json_1 = __importDefault(require("../build/AAAAPool.json"));
var AAAAConfig_json_1 = __importDefault(require("../build/AAAAConfig.json"));
var AAAAMint_json_1 = __importDefault(require("../build/AAAAMint.json"));
var AAAAFactory_json_1 = __importDefault(require("../build/AAAAFactory.json"));
var AAAAPlatform_json_1 = __importDefault(require("../build/AAAAPlatform.json"));
var AAAAToken_json_1 = __importDefault(require("../build/AAAAToken.json"));
var AAAAShare_json_1 = __importDefault(require("../build/AAAAShare.json"));
var AAAAQuery_json_1 = __importDefault(require("../build/AAAAQuery.json"));
var AAAAQuery_json_2 = __importDefault(require("../build/AAAAQuery.json"));
var ERC20Token_json_1 = __importDefault(require("../build/ERC20Token.json"));
var StakingRewards_json_1 = __importDefault(require("../build/StakingRewards.json"));
var UniLPStrategy_json_1 = __importDefault(require("../build/UniLPStrategy.json"));
var bignumber_js_1 = require("bignumber.js");
chai_1.use(ethereum_waffle_1.solidity);
function convertBigNumber(bnAmount, divider) {
    return new bignumber_js_1.BigNumber(bnAmount.toString()).dividedBy(new bignumber_js_1.BigNumber(divider)).toFixed();
}
describe('deploy', function () {
    var provider = new ethereum_waffle_1.MockProvider();
    var _a = provider.getWallets(), walletMe = _a[0], walletOther = _a[1], walletDeveloper = _a[2], walletTeam = _a[3], walletSpare = _a[4], walletPrice = _a[5], wallet1 = _a[6], wallet2 = _a[7], wallet3 = _a[8], wallet4 = _a[9];
    var configContract;
    var factoryContract;
    var mintContract;
    var platformContract;
    var tokenContract;
    var shareContract;
    var masterChef;
    var tokenUSDT;
    var tokenLP;
    var poolContract;
    var queryContract;
    var stakingReward;
    var stakingRewardFactory;
    var rewardToken;
    var strategy;
    var tx;
    var receipt;
    function getBlockNumber() {
        return __awaiter(this, void 0, void 0, function () {
            var blockNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, provider.getBlockNumber()];
                    case 1:
                        blockNumber = _a.sent();
                        console.log("Current block number: " + blockNumber);
                        return [2 /*return*/, blockNumber];
                }
            });
        });
    }
    function mineBlock(provider, timestamp) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, provider.send('evm_mine', [timestamp])];
            });
        });
    }
    before(function () { return __awaiter(void 0, void 0, void 0, function () {
        var rewardsDuration, startTime, endTime, pool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('hello world1');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAShare_json_1.default)];
                case 1:
                    shareContract = _a.sent();
                    console.log('hello world2');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAConfig_json_1.default)];
                case 2:
                    configContract = _a.sent();
                    console.log('hello world3');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAFactory_json_1.default)];
                case 3:
                    factoryContract = _a.sent();
                    console.log('hello world4');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAMint_json_1.default)];
                case 4:
                    mintContract = _a.sent();
                    console.log('hello world5');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAPlatform_json_1.default)];
                case 5:
                    platformContract = _a.sent();
                    console.log('hello world6');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAToken_json_1.default)];
                case 6:
                    tokenContract = _a.sent();
                    console.log('hello world7');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletOther, ERC20Token_json_1.default, ['USDT', 'USDT', 18, ethers_1.ethers.utils.parseEther('1000000')])];
                case 7:
                    tokenUSDT = _a.sent();
                    console.log('hello world8');
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletMe, ERC20Token_json_1.default, ['Uniswap V2 LP ETH/DAI', 'Uniswap v2 ETH/DAI', 18, ethers_1.ethers.utils.parseEther('1000000')])];
                case 8:
                    // tokenUSDT 	= await deployContract(walletMe, ERC20, ['File Coin', 'FIL', 18, ethers.utils.parseEther('1000000')]);
                    tokenLP = _a.sent();
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, ERC20Token_json_1.default, ['UNI', 'UNI', 18, ethers_1.ethers.utils.parseEther('1000000')])];
                case 9:
                    rewardToken = _a.sent();
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletDeveloper, AAAAQuery_json_1.default)];
                case 10:
                    queryContract = _a.sent();
                    console.log('hello world3');
                    return [4 /*yield*/, getBlockNumber()];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletMe, StakingRewards_json_1.default, [walletDeveloper.address, rewardToken.address, tokenLP.address])];
                case 12:
                    // stakingRewardFactory = await deployContract(walletMe, StakingRewardFactory, [rewardToken.address, 50]);
                    stakingReward = _a.sent();
                    // rewardToken.connect(walletDeveloper).transfer(stakingReward.address, ethers.utils.parseEther('100'));
                    // stakingReward.connect(walletDeveloper).notifyRewardAmount(ethers.utils.parseEther('100'));
                    return [4 /*yield*/, rewardToken.connect(walletDeveloper).transfer(stakingReward.address, ethers_1.ethers.utils.parseEther('100'))];
                case 13:
                    // rewardToken.connect(walletDeveloper).transfer(stakingReward.address, ethers.utils.parseEther('100'));
                    // stakingReward.connect(walletDeveloper).notifyRewardAmount(ethers.utils.parseEther('100'));
                    _a.sent();
                    return [4 /*yield*/, stakingReward.connect(walletDeveloper).notifyRewardAmount(ethers_1.ethers.utils.parseEther('100'))];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, stakingReward.rewardsDuration()];
                case 15:
                    rewardsDuration = _a.sent();
                    return [4 /*yield*/, stakingReward.lastUpdateTime()];
                case 16:
                    startTime = _a.sent();
                    return [4 /*yield*/, stakingReward.periodFinish()];
                case 17:
                    endTime = _a.sent();
                    console.log('configContract = ', configContract.address);
                    console.log('factoryContract = ', factoryContract.address);
                    console.log('mintContract address = ', mintContract.address);
                    console.log('platformContract address = ', platformContract.address);
                    console.log('tokenContract address = ', tokenContract.address);
                    // console.log('tokenUSDT address = ', tokenUSDT.address);
                    console.log('rewardToken address = ', rewardToken.address);
                    // console.log('stakingRewardFactory address = ', stakingRewardFactory.address);
                    console.log('stakingReward address = ', stakingReward.address);
                    console.log('team:', ethers_1.ethers.utils.formatBytes32String("team"));
                    console.log('spare:', ethers_1.ethers.utils.formatBytes32String("spare"));
                    console.log('price:', ethers_1.ethers.utils.formatBytes32String("price"));
                    console.log('POOL_PRICE:', ethers_1.ethers.utils.formatBytes32String("POOL_PRICE"));
                    console.log('AAAATokenUserMint:', ethers_1.ethers.utils.formatBytes32String("AAAA_USER_MINT"));
                    console.log('changePricePercent:', ethers_1.ethers.utils.formatBytes32String("CHANGE_PRICE_PERCENT"));
                    console.log('liquidationRate:', ethers_1.ethers.utils.formatBytes32String("POOL_LIQUIDATION_RATE"));
                    return [4 /*yield*/, configContract.connect(walletDeveloper).initialize(platformContract.address, factoryContract.address, mintContract.address, tokenContract.address, tokenUSDT.address, shareContract.address, walletDeveloper.address)];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, shareContract.connect(walletDeveloper).setupConfig(configContract.address)];
                case 19:
                    _a.sent();
                    return [4 /*yield*/, factoryContract.connect(walletDeveloper).setupConfig(configContract.address)];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, mintContract.connect(walletDeveloper).setupConfig(configContract.address)];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).setupConfig(configContract.address)];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, tokenContract.connect(walletDeveloper).setupConfig(configContract.address)];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, queryContract.connect(walletDeveloper).initialize(configContract.address)];
                case 24:
                    _a.sent();
                    return [4 /*yield*/, configContract.connect(walletDeveloper).initParameter()];
                case 25:
                    _a.sent();
                    return [4 /*yield*/, configContract.connect(walletDeveloper).setWallets([
                            ethers_1.ethers.utils.formatBytes32String("team"),
                            ethers_1.ethers.utils.formatBytes32String("spare"),
                            ethers_1.ethers.utils.formatBytes32String("price")
                        ], [
                            walletTeam.address,
                            walletSpare.address,
                            walletPrice.address
                        ])];
                case 26:
                    _a.sent();
                    return [4 /*yield*/, shareContract.connect(walletDeveloper).initialize()];
                case 27:
                    _a.sent();
                    return [4 /*yield*/, tokenContract.connect(walletDeveloper).initialize()];
                case 28:
                    _a.sent();
                    return [4 /*yield*/, factoryContract.connect(walletDeveloper).changeBallotByteCode(AAAAQuery_json_2.default.bytecode)];
                case 29:
                    _a.sent();
                    return [4 /*yield*/, factoryContract.connect(walletDeveloper).createPool(tokenUSDT.address, tokenLP.address)];
                case 30:
                    _a.sent();
                    return [4 /*yield*/, factoryContract.connect(walletDeveloper).getPool(tokenUSDT.address, tokenLP.address)];
                case 31:
                    pool = _a.sent();
                    poolContract = new ethers_1.Contract(pool, AAAAPool_json_1.default.abi, provider).connect(walletMe);
                    return [4 /*yield*/, ethereum_waffle_1.deployContract(walletMe, UniLPStrategy_json_1.default, [rewardToken.address, tokenLP.address, poolContract.address, stakingReward.address])];
                case 32:
                    strategy = _a.sent();
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).switchStrategy(tokenUSDT.address, tokenLP.address, strategy.address)];
                case 33:
                    _a.sent();
                    // await tokenUSDT.connect(walletMe).approve(poolContract.address, ethers.utils.parseEther('1000000'));
                    // await tokenUSDT.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));
                    return [4 /*yield*/, tokenUSDT.connect(walletOther).approve(poolContract.address, ethers_1.ethers.utils.parseEther('1000000'))];
                case 34:
                    // await tokenUSDT.connect(walletMe).approve(poolContract.address, ethers.utils.parseEther('1000000'));
                    // await tokenUSDT.connect(walletOther).approve(poolContract.address, ethers.utils.parseEther('1000000'));
                    _a.sent();
                    return [4 /*yield*/, tokenLP.connect(walletOther).approve(poolContract.address, ethers_1.ethers.utils.parseEther('1000000'))];
                case 35:
                    _a.sent();
                    return [4 /*yield*/, tokenLP.connect(walletMe).approve(poolContract.address, ethers_1.ethers.utils.parseEther('1000000'))];
                case 36:
                    _a.sent();
                    return [4 /*yield*/, tokenUSDT.connect(walletMe).approve(poolContract.address, ethers_1.ethers.utils.parseEther('1000000'))];
                case 37:
                    _a.sent();
                    return [4 /*yield*/, tokenLP.connect(walletMe).transfer(walletOther.address, ethers_1.ethers.utils.parseEther('100000'))];
                case 38:
                    _a.sent();
                    return [4 /*yield*/, tokenUSDT.connect(walletOther).transfer(walletMe.address, ethers_1.ethers.utils.parseEther('100000'))];
                case 39:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it("simple test", function () { return __awaiter(void 0, void 0, void 0, function () {
        var pool, poolContract, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23;
        return __generator(this, function (_24) {
            switch (_24.label) {
                case 0: return [4 /*yield*/, mintContract.connect(walletDeveloper).changeInterestRatePerBlock(ethers_1.ethers.utils.parseEther('2000'))];
                case 1: return [4 /*yield*/, (_24.sent()).wait()];
                case 2:
                    _24.sent();
                    return [4 /*yield*/, factoryContract.connect(walletDeveloper).getPool(tokenUSDT.address, tokenLP.address)];
                case 3:
                    pool = _24.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).deposit(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 4: return [4 /*yield*/, (_24.sent()).wait()];
                case 5:
                    _24.sent();
                    poolContract = new ethers_1.Contract(pool, AAAAPool_json_1.default.abi, provider).connect(walletMe);
                    _b = (_a = console).log;
                    _c = convertBigNumber;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 6:
                    _b.apply(_a, [_c.apply(void 0, [(_24.sent()).amountSupply, 1e18])]);
                    _d = chai_1.expect;
                    _e = convertBigNumber;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 7:
                    _d.apply(void 0, [_e.apply(void 0, [(_24.sent()).amountSupply, 1e18])]).to.equals('1000');
                    _f = chai_1.expect;
                    _g = convertBigNumber;
                    return [4 /*yield*/, poolContract.remainSupply()];
                case 8:
                    _f.apply(void 0, [_g.apply(void 0, [_24.sent(), 1e18])]).to.equals('1000');
                    _j = (_h = console).log;
                    _k = convertBigNumber;
                    return [4 /*yield*/, mintContract.connect(walletMe).takeLendWithAddress(walletMe.address)];
                case 9:
                    _j.apply(_h, [_k.apply(void 0, [_24.sent(), 1])]);
                    return [4 /*yield*/, platformContract.connect(walletMe).withdraw(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('500'))];
                case 10: return [4 /*yield*/, (_24.sent()).wait()];
                case 11:
                    _24.sent();
                    _l = chai_1.expect;
                    _m = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletMe.address)];
                case 12:
                    _l.apply(void 0, [_m.apply(void 0, [_24.sent(), 1e18])]).to.equals('99500');
                    _o = chai_1.expect;
                    _p = convertBigNumber;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 13:
                    _o.apply(void 0, [_p.apply(void 0, [(_24.sent()).amountSupply, 1e18])]).to.equals('500');
                    _q = chai_1.expect;
                    _r = convertBigNumber;
                    return [4 /*yield*/, poolContract.remainSupply()];
                case 14:
                    _q.apply(void 0, [_r.apply(void 0, [_24.sent(), 1e18])]).to.equals('500');
                    _t = (_s = console).log;
                    _u = convertBigNumber;
                    return [4 /*yield*/, mintContract.connect(walletMe).takeLendWithAddress(walletMe.address)];
                case 15:
                    _t.apply(_s, [_u.apply(void 0, [_24.sent(), 1])]);
                    _w = (_v = console).log;
                    _x = ['wallet team:'];
                    _y = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletTeam.address)];
                case 16:
                    _w.apply(_v, _x.concat([_y.apply(void 0, [_24.sent(), 1e18])]));
                    return [4 /*yield*/, platformContract.connect(walletMe).withdraw(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('500'))];
                case 17: return [4 /*yield*/, (_24.sent()).wait()];
                case 18:
                    _24.sent();
                    _0 = (_z = console).log;
                    _1 = ['wallet team:'];
                    _2 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletTeam.address)];
                case 19:
                    _0.apply(_z, _1.concat([_2.apply(void 0, [_24.sent(), 1e18])]));
                    _3 = chai_1.expect;
                    _4 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletMe.address)];
                case 20:
                    _3.apply(void 0, [_4.apply(void 0, [_24.sent(), 1e18])]).to.equals('100000');
                    _5 = chai_1.expect;
                    _6 = convertBigNumber;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 21:
                    _5.apply(void 0, [_6.apply(void 0, [(_24.sent()).amountSupply, 1e18])]).to.equals('0');
                    _7 = chai_1.expect;
                    _8 = convertBigNumber;
                    return [4 /*yield*/, poolContract.remainSupply()];
                case 22:
                    _7.apply(void 0, [_8.apply(void 0, [_24.sent(), 1e18])]).to.equals('0');
                    _10 = (_9 = console).log;
                    _11 = convertBigNumber;
                    return [4 /*yield*/, mintContract.connect(walletMe).takeLendWithAddress(walletMe.address)];
                case 23:
                    _10.apply(_9, [_11.apply(void 0, [_24.sent(), 1])]);
                    return [4 /*yield*/, mintContract.connect(walletMe).mintLender()];
                case 24: return [4 /*yield*/, (_24.sent()).wait()];
                case 25:
                    _24.sent();
                    _13 = (_12 = console).log;
                    _14 = convertBigNumber;
                    return [4 /*yield*/, tokenContract.balanceOf(walletMe.address)];
                case 26:
                    _13.apply(_12, [_14.apply(void 0, [_24.sent(), 1])]);
                    _16 = (_15 = console).log;
                    _17 = convertBigNumber;
                    return [4 /*yield*/, tokenContract.balanceOf(walletTeam.address)];
                case 27:
                    _16.apply(_15, [_17.apply(void 0, [_24.sent(), 1])]);
                    _19 = (_18 = console).log;
                    _20 = convertBigNumber;
                    return [4 /*yield*/, tokenContract.balanceOf(walletSpare.address)];
                case 28:
                    _19.apply(_18, [_20.apply(void 0, [_24.sent(), 1])]);
                    _22 = (_21 = console).log;
                    _23 = convertBigNumber;
                    return [4 /*yield*/, mintContract.connect(walletMe).takeLendWithAddress(walletMe.address)];
                case 29:
                    _22.apply(_21, [_23.apply(void 0, [_24.sent(), 1])]);
                    return [2 /*return*/];
            }
        });
    }); });
    function sevenInfo() {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, k;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, poolContract.interestPerSupply()];
                    case 1:
                        _a.interestPerSupply = _b.sent();
                        return [4 /*yield*/, poolContract.liquidationPerSupply()];
                    case 2:
                        _a.liquidationPerSupply = _b.sent();
                        return [4 /*yield*/, poolContract.interestPerBorrow()];
                    case 3:
                        _a.interestPerBorrow = _b.sent();
                        return [4 /*yield*/, poolContract.totalLiquidation()];
                    case 4:
                        _a.totalLiquidation = _b.sent();
                        return [4 /*yield*/, poolContract.totalLiquidationSupplyAmount()];
                    case 5:
                        _a.totalLiquidationSupplyAmount = _b.sent();
                        return [4 /*yield*/, poolContract.totalBorrow()];
                    case 6:
                        _a.totalBorrow = _b.sent();
                        return [4 /*yield*/, poolContract.totalPledge()];
                    case 7:
                        _a.totalPledge = _b.sent();
                        return [4 /*yield*/, poolContract.remainSupply()];
                    case 8:
                        _a.remainSupply = _b.sent();
                        return [4 /*yield*/, poolContract.lastInterestUpdate()];
                    case 9:
                        result = (_a.lastInterestUpdate = _b.sent(),
                            _a);
                        console.log('===sevenInfo begin===');
                        for (k in result) {
                            console.log(k + ':', convertBigNumber(result[k], 1));
                        }
                        console.log('===sevenInfo end===');
                        return [2 /*return*/, result];
                }
            });
        });
    }
    ;
    function SupplyStruct(user) {
        return __awaiter(this, void 0, void 0, function () {
            var result, k;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, poolContract.supplys(user)];
                    case 1:
                        result = _a.sent();
                        console.log('===SupplyStruct begin===');
                        for (k in result) {
                            console.log(k + ':', convertBigNumber(result[k], 1));
                        }
                        console.log('===SupplyStruct end===');
                        return [2 /*return*/, result];
                }
            });
        });
    }
    ;
    function BorrowStruct(user) {
        return __awaiter(this, void 0, void 0, function () {
            var result, k;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, poolContract.borrows(user)];
                    case 1:
                        result = _a.sent();
                        console.log('===BorrowStruct begin===');
                        for (k in result) {
                            console.log(k + ':', convertBigNumber(result[k], 1));
                        }
                        console.log('===BorrowStruct end===');
                        return [2 /*return*/, result];
                }
            });
        });
    }
    ;
    it('deposit(1000) -> borrow(100) -> repay(100) -> withdraw(1000)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e, maxBorrow, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, receipt, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
        return __generator(this, function (_8) {
            switch (_8.label) {
                case 0: return [4 /*yield*/, platformContract.connect(walletMe).deposit(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 1: return [4 /*yield*/, (_8.sent()).wait()];
                case 2:
                    _8.sent();
                    _b = (_a = console).log;
                    _c = ['after deposit: ',
                        'pool USDT'];
                    _d = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 3:
                    _c = _c.concat([_d.apply(void 0, [_8.sent(), 1]), 'pool LP']);
                    _e = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(poolContract.address)];
                case 4:
                    _b.apply(_a, _c.concat([_e.apply(void 0, [_8.sent(), 1])]));
                    return [4 /*yield*/, poolContract.getMaximumBorrowAmount(ethers_1.ethers.utils.parseEther('10000'))];
                case 5:
                    maxBorrow = _8.sent();
                    console.log('maxBorrow:', convertBigNumber(maxBorrow, 1), 'USDT');
                    return [4 /*yield*/, platformContract.connect(walletOther).borrow(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('10000'), maxBorrow)];
                case 6: return [4 /*yield*/, (_8.sent()).wait()];
                case 7:
                    _8.sent();
                    _g = (_f = console).log;
                    _h = ['after borrow: ',
                        'wallet USDT'];
                    _j = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletOther.address)];
                case 8:
                    _h = _h.concat([_j.apply(void 0, [_8.sent(), 1]), 'wallet LP']);
                    _k = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(walletOther.address)];
                case 9:
                    _h = _h.concat([_k.apply(void 0, [_8.sent(), 1]), 'pool USDT']);
                    _l = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 10:
                    _h = _h.concat([_l.apply(void 0, [_8.sent(), 1]), 'pool LP']);
                    _m = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(poolContract.address)];
                case 11:
                    _g.apply(_f, _h.concat([_m.apply(void 0, [_8.sent(), 1])]));
                    _p = (_o = console).log;
                    _q = ['getInterests:'];
                    _r = convertBigNumber;
                    return [4 /*yield*/, poolContract.getInterests()];
                case 12:
                    _p.apply(_o, _q.concat([_r.apply(void 0, [_8.sent(), 1])]));
                    return [4 /*yield*/, platformContract.connect(walletOther).repay(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('10000'))];
                case 13:
                    tx = _8.sent();
                    return [4 /*yield*/, tx.wait()];
                case 14:
                    receipt = _8.sent();
                    console.log('repay gas:', receipt.gasUsed.toString());
                    // console.log('events:', receipt.events)
                    // console.log(receipt.events[2].event, 'args:', receipt.events[2].args)
                    // console.log('_supplyAmount:', convertBigNumber(receipt.events[2].args._supplyAmount, 1))
                    // console.log('_collateralAmount:', convertBigNumber(receipt.events[2].args._collateralAmount, 1))
                    // console.log('_interestAmount:', convertBigNumber(receipt.events[2].args._interestAmount, 1))
                    _t = (_s = console).log;
                    _u = ['after repay with UNI: '];
                    _v = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 15:
                    _u = _u.concat([_v.apply(void 0, [_8.sent(), 1])]);
                    _w = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(poolContract.address)];
                case 16:
                    _u = _u.concat([_w.apply(void 0, [_8.sent(), 1])]);
                    _x = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(walletOther.address)];
                case 17:
                    _u = _u.concat([_x.apply(void 0, [_8.sent(), 1])]);
                    _y = convertBigNumber;
                    return [4 /*yield*/, rewardToken.balanceOf(walletOther.address)];
                case 18:
                    // console.log('events:', receipt.events)
                    // console.log(receipt.events[2].event, 'args:', receipt.events[2].args)
                    // console.log('_supplyAmount:', convertBigNumber(receipt.events[2].args._supplyAmount, 1))
                    // console.log('_collateralAmount:', convertBigNumber(receipt.events[2].args._collateralAmount, 1))
                    // console.log('_interestAmount:', convertBigNumber(receipt.events[2].args._interestAmount, 1))
                    _t.apply(_s, _u.concat([_y.apply(void 0, [_8.sent(), 1])]));
                    // await SupplyStruct(walletMe.address);
                    // await sevenInfo();
                    return [4 /*yield*/, platformContract.connect(walletMe).withdraw(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 19:
                    // await SupplyStruct(walletMe.address);
                    // await sevenInfo();
                    _8.sent();
                    _0 = (_z = console).log;
                    _1 = ['after withdraw: '];
                    _2 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 20:
                    _1 = _1.concat([_2.apply(void 0, [_8.sent(), 1])]);
                    _3 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 21:
                    _0.apply(_z, _1.concat([_3.apply(void 0, [_8.sent(), 1])]));
                    _5 = (_4 = console).log;
                    _6 = ['wallet team:'];
                    _7 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletTeam.address)];
                case 22:
                    _5.apply(_4, _6.concat([_7.apply(void 0, [_8.sent(), 1e18])]));
                    return [2 /*return*/];
            }
        });
    }); });
    it('deposit(1000) -> borrow(100) -> liquidation(100) -> withdraw(1000)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e, maxBorrow, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        return __generator(this, function (_0) {
            switch (_0.label) {
                case 0: return [4 /*yield*/, platformContract.connect(walletMe).deposit(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 1: return [4 /*yield*/, (_0.sent()).wait()];
                case 2:
                    _0.sent();
                    _b = (_a = console).log;
                    _c = ['after deposit: '];
                    _d = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 3:
                    _c = _c.concat([_d.apply(void 0, [_0.sent(), 1])]);
                    _e = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 4:
                    _b.apply(_a, _c.concat([_e.apply(void 0, [_0.sent(), 1])]));
                    return [4 /*yield*/, poolContract.getMaximumBorrowAmount(ethers_1.ethers.utils.parseEther('10000'))];
                case 5:
                    maxBorrow = _0.sent();
                    return [4 /*yield*/, platformContract.connect(walletOther).borrow(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('10000'), maxBorrow)];
                case 6: return [4 /*yield*/, (_0.sent()).wait()];
                case 7:
                    _0.sent();
                    _g = (_f = console).log;
                    _h = ['after borrow: '];
                    _j = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 8:
                    _h = _h.concat([_j.apply(void 0, [_0.sent(), 1])]);
                    _k = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 9:
                    _g.apply(_f, _h.concat([_k.apply(void 0, [_0.sent(), 1])]));
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).updatePoolParameter(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.formatBytes32String("POOL_PRICE"), ethers_1.ethers.utils.parseEther('0.01'))];
                case 10: return [4 /*yield*/, (_0.sent()).wait()];
                case 11:
                    _0.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).liquidation(tokenUSDT.address, tokenLP.address, walletOther.address)];
                case 12: return [4 /*yield*/, (_0.sent()).wait()];
                case 13:
                    _0.sent();
                    _m = (_l = console).log;
                    _o = ['after liquidation: '];
                    _p = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 14:
                    _o = _o.concat([_p.apply(void 0, [_0.sent(), 1])]);
                    _q = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 15:
                    _m.apply(_l, _o.concat([_q.apply(void 0, [_0.sent(), 1])]));
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).updatePoolParameter(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.formatBytes32String("POOL_PRICE"), ethers_1.ethers.utils.parseEther('0.02'))];
                case 16: 
                // await SupplyStruct(walletMe.address);
                // await sevenInfo();
                return [4 /*yield*/, (_0.sent()).wait()];
                case 17:
                    // await SupplyStruct(walletMe.address);
                    // await sevenInfo();
                    _0.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).withdraw(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 18: return [4 /*yield*/, (_0.sent()).wait()];
                case 19:
                    _0.sent();
                    _s = (_r = console).log;
                    _t = ['after withdraw: '];
                    _u = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 20:
                    _t = _t.concat([_u.apply(void 0, [_0.sent(), 1])]);
                    _v = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 21:
                    _s.apply(_r, _t.concat([_v.apply(void 0, [_0.sent(), 1])]));
                    _x = (_w = console).log;
                    _y = ['wallet team:'];
                    _z = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletTeam.address)];
                case 22:
                    _x.apply(_w, _y.concat([_z.apply(void 0, [_0.sent(), 1e18])]));
                    return [2 /*return*/];
            }
        });
    }); });
    it('deposit(1000) -> borrow(100) -> liquidation(100) -> reinvest() -> withdraw(1000)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e, maxBorrow, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, tx, _w, _x, _y, _z, _0;
        return __generator(this, function (_1) {
            switch (_1.label) {
                case 0: return [4 /*yield*/, platformContract.connect(walletMe).deposit(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 1: return [4 /*yield*/, (_1.sent()).wait()];
                case 2:
                    _1.sent();
                    _b = (_a = console).log;
                    _c = ['after deposit: '];
                    _d = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 3:
                    _c = _c.concat([_d.apply(void 0, [_1.sent(), 1])]);
                    _e = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 4:
                    _b.apply(_a, _c.concat([_e.apply(void 0, [_1.sent(), 1])]));
                    return [4 /*yield*/, poolContract.getMaximumBorrowAmount(ethers_1.ethers.utils.parseEther('10000'))];
                case 5:
                    maxBorrow = _1.sent();
                    _g = (_f = console).log;
                    _h = ['before borrow'];
                    _j = convertBigNumber;
                    return [4 /*yield*/, tokenLP.balanceOf(walletOther.address)];
                case 6:
                    _h = _h.concat([_j.apply(void 0, [_1.sent(), 1])]);
                    _k = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletOther.address)];
                case 7:
                    _g.apply(_f, _h.concat([_k.apply(void 0, [_1.sent(), 1])]));
                    return [4 /*yield*/, platformContract.connect(walletOther).borrow(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('10000'), maxBorrow)];
                case 8: return [4 /*yield*/, (_1.sent()).wait()];
                case 9:
                    _1.sent();
                    _m = (_l = console).log;
                    _o = ['after borrow: '];
                    _p = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 10:
                    _o = _o.concat([_p.apply(void 0, [_1.sent(), 1])]);
                    _q = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 11:
                    _m.apply(_l, _o.concat([_q.apply(void 0, [_1.sent(), 1])]));
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).updatePoolParameter(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.formatBytes32String("POOL_PRICE"), ethers_1.ethers.utils.parseEther('0.01'))];
                case 12: return [4 /*yield*/, (_1.sent()).wait()];
                case 13:
                    _1.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).liquidation(tokenUSDT.address, tokenLP.address, walletOther.address)];
                case 14: return [4 /*yield*/, (_1.sent()).wait()];
                case 15:
                    _1.sent();
                    _s = (_r = console).log;
                    _t = ['after liquidation: '];
                    _u = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 16:
                    _t = _t.concat([_u.apply(void 0, [_1.sent(), 1])]);
                    _v = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 17:
                    _s.apply(_r, _t.concat([_v.apply(void 0, [_1.sent(), 1])]));
                    return [4 /*yield*/, poolContract.liquidationHistory(walletOther.address, 0)];
                case 18:
                    tx = _1.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).reinvest(tokenUSDT.address, tokenLP.address)];
                case 19: 
                // console.log(tx)
                // await SupplyStruct(walletMe.address);
                // console.log('wallet team:', convertBigNumber(await tokenUSDT.balanceOf(walletTeam.address),1e18))
                return [4 /*yield*/, (_1.sent()).wait()];
                case 20:
                    // console.log(tx)
                    // await SupplyStruct(walletMe.address);
                    // console.log('wallet team:', convertBigNumber(await tokenUSDT.balanceOf(walletTeam.address),1e18))
                    _1.sent();
                    return [4 /*yield*/, platformContract.connect(walletDeveloper).updatePoolParameter(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.formatBytes32String("POOL_PRICE"), ethers_1.ethers.utils.parseEther('0.02'))];
                case 21: 
                // console.log('wallet team:', convertBigNumber(await tokenUSDT.balanceOf(walletTeam.address),1e18))
                // await SupplyStruct(walletMe.address);
                // await sevenInfo();
                return [4 /*yield*/, (_1.sent()).wait()];
                case 22:
                    // console.log('wallet team:', convertBigNumber(await tokenUSDT.balanceOf(walletTeam.address),1e18))
                    // await SupplyStruct(walletMe.address);
                    // await sevenInfo();
                    _1.sent();
                    return [4 /*yield*/, platformContract.connect(walletMe).withdraw(tokenUSDT.address, tokenLP.address, ethers_1.ethers.utils.parseEther('1000'))];
                case 23:
                    _1.sent();
                    _x = (_w = console).log;
                    _y = ['after withdraw: '];
                    _z = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 24:
                    _y = _y.concat([_z.apply(void 0, [_1.sent(), 1])]);
                    _0 = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(poolContract.address)];
                case 25:
                    _x.apply(_w, _y.concat([_0.apply(void 0, [_1.sent(), 1])]));
                    return [2 /*return*/];
            }
        });
    }); });
    it('liquidation list test', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    }); });
    it('test circuit breaker', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    _b = (_a = console).log;
                    _c = ['wallet team:'];
                    _d = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(walletTeam.address)];
                case 1:
                    _b.apply(_a, _c.concat([_d.apply(void 0, [_j.sent(), 1e18])]));
                    _f = (_e = console).log;
                    _g = ['wallet share:'];
                    _h = convertBigNumber;
                    return [4 /*yield*/, tokenUSDT.balanceOf(shareContract.address)];
                case 2:
                    _f.apply(_e, _g.concat([_h.apply(void 0, [_j.sent(), 1e18])]));
                    return [2 /*return*/];
            }
        });
    }); });
    it('test withdrawable/reinvestable', function () { return __awaiter(void 0, void 0, void 0, function () {
        var platformShare, totalSupply, _a, _b, interestPerSupply, interests, totalBorrow, meInterests, interestSettled, meSupply, remainSupply, deltaBlock, _c, reinvestAmount, a, withdrawAmount;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, configContract.getValue(ethers_1.ethers.utils.formatBytes32String('INTEREST_PLATFORM_SHARE'))];
                case 1:
                    platformShare = _d.sent();
                    return [4 /*yield*/, poolContract.totalBorrow()];
                case 2:
                    _b = (_a = (_d.sent())).add;
                    return [4 /*yield*/, poolContract.remainSupply()];
                case 3:
                    totalSupply = _b.apply(_a, [_d.sent()]);
                    return [4 /*yield*/, poolContract.interestPerSupply()];
                case 4:
                    interestPerSupply = _d.sent();
                    return [4 /*yield*/, poolContract.getInterests()];
                case 5:
                    interests = _d.sent();
                    return [4 /*yield*/, poolContract.totalBorrow()];
                case 6:
                    totalBorrow = _d.sent();
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 7:
                    meInterests = (_d.sent()).interests;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 8:
                    interestSettled = (_d.sent()).interestSettled;
                    return [4 /*yield*/, poolContract.supplys(walletMe.address)];
                case 9:
                    meSupply = (_d.sent()).amountSupply;
                    return [4 /*yield*/, poolContract.remainSupply()];
                case 10:
                    remainSupply = (_d.sent());
                    return [4 /*yield*/, provider.getBlockNumber()];
                case 11:
                    _c = (_d.sent());
                    return [4 /*yield*/, poolContract.lastInterestUpdate()];
                case 12:
                    deltaBlock = _c - (_d.sent());
                    meInterests = meInterests.add(interestPerSupply.mul(meSupply).div(ethers_1.ethers.utils.parseEther('1')).sub(interestSettled));
                    console.log('deltaBlock=', deltaBlock);
                    console.log('totalSupply=', convertBigNumber(totalSupply, 1e18));
                    console.log('interestPerSupply=', convertBigNumber(interestPerSupply, 1e18));
                    console.log('interests=', convertBigNumber(interests, 1e18));
                    console.log('totalBorrow=', convertBigNumber(totalBorrow, 1e18));
                    console.log('meInterests=', convertBigNumber(meInterests, 1e18));
                    console.log('interestSettled=', convertBigNumber(interestSettled, 1e18));
                    console.log('meSupply=', convertBigNumber(meSupply, 1e18));
                    console.log('platformShare=', convertBigNumber(platformShare, 1e18));
                    console.log('remainSupply=', convertBigNumber(remainSupply, 1e18));
                    reinvestAmount = meInterests * platformShare / 1e18;
                    if (reinvestAmount < remainSupply) {
                        console.log('ok to invest');
                    }
                    else {
                        console.log('not enough money to pay');
                    }
                    a = meInterests - meInterests.mul(platformShare).div(ethers_1.ethers.utils.parseEther('1'));
                    console.log('a=', a);
                    withdrawAmount = meSupply.add(a);
                    console.log('withdrawAmount=', convertBigNumber(withdrawAmount, 1e18));
                    if (withdrawAmount < remainSupply) {
                        console.log('ok  to withdraw');
                    }
                    else {
                        console.log('not enough money to withdraw');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
});
