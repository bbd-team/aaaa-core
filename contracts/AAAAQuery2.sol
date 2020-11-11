// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import "./libraries/SafeMath.sol";
import './modules/ConfigNames.sol';

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);
}

interface IConfig {
    function developer() external view returns (address);
    function platform() external view returns (address);
    function factory() external view returns (address);
    function mint() external view returns (address);
    function token() external view returns (address);
    function developPercent() external view returns (uint);
    function wallet() external view returns (address);
    function base() external view returns (address);
    function share() external view returns (address);
    function poolParams(address pool, bytes32 key) external view returns (uint);
    function params(bytes32 key) external view returns(uint);
    function setParameter(uint[] calldata _keys, uint[] calldata _values) external;
    function setPoolParameter(address _pool, bytes32 _key, uint _value) external;
    function getValue(bytes32 _key) external view returns (uint);
    function getPoolValue(address _pool, bytes32 _key) external view returns (uint);
    function getParams(bytes32 _key) external view returns (uint, uint, uint, uint);
    function getPoolParams(address _pool, bytes32 _key) external view returns (uint, uint, uint, uint);
}

interface IAAAAFactory {
    function countPools() external view returns(uint);
    function countBallots() external view returns(uint);
    function allBallots(uint index) external view returns(address);
    function allPools(uint index) external view returns(address);
    function isPool(address addr) external view returns(bool);
    function getPool(address lend, address collateral) external view returns(address);
}

interface IAAAAPool {
    function supplyToken() external view returns(address);
    function collateralToken() external view returns(address);
    function totalBorrow() external view returns(uint);
    function totalPledge() external view returns(uint);
    function remainSupply() external view returns(uint);
    function getInterests() external view returns(uint);
    function numberBorrowers() external view returns(uint);
    function borrowerList(uint index) external view returns(address);
    function borrows(address user) external view returns(uint,uint,uint,uint,uint);
    function getRepayAmount(uint amountCollateral, address from) external view returns(uint);
    function liquidationHistory(address user, uint index) external view returns(uint,uint,uint);
    function liquidationHistoryLength(address user) external view returns(uint);
    function getMaximumBorrowAmount(uint amountCollateral) external view returns(uint amountBorrow);
    function interestPerBorrow() external view returns(uint);
    function lastInterestUpdate() external view returns(uint);
    function interestPerSupply() external view returns(uint);
    function supplys(address user) external view returns(uint,uint,uint,uint,uint);
}

interface IAAAAMint {
    function maxSupply() external view returns(uint);
    function mintCumulation() external view returns(uint);
    function takeLendWithAddress(address user) external view returns (uint);
    function takeBorrowWithAddress(address user) external view returns (uint);
}

interface ISwapPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

interface IAAAABallot {
    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        uint vote;   // index of the voted proposal 0 YES, 1 NO
        bool claimed; // already claimed reward
    }
    function name() external view returns(bytes32);
    function subject() external view returns(string memory);
    function content() external view returns(string memory);
    function createdBlock() external view returns(uint);
    function createdTime() external view returns(uint);
    function creator() external view returns(address);
    function proposals(uint index) external view returns(uint);
    function end() external view returns (bool);
    function pass() external view returns (bool);
    function expire() external view returns (bool);
    function pool() external view returns (address);
    function value() external view returns (uint);
    function total() external view returns (uint);
    function reward() external view returns (uint);
    function voters(address user) external view returns (Voter memory);
}

contract AAAAQuery2 {
    address public owner;
    address public config;
    using SafeMath for uint;

    struct ConfigCommonStruct {
        uint PROPOSAL_VOTE_DURATION;
        uint PROPOSAL_EXECUTE_DURATION;
        uint PROPOSAL_CREATE_COST;
        uint STAKE_LOCK_TIME;
        uint MINT_AMOUNT_PER_BLOCK;
        uint INTEREST_PLATFORM_SHARE;
        uint INTEREST_BUYBACK_SHARE;
        uint CHANGE_PRICE_DURATION;
        uint CHANGE_PRICE_PERCENT;
        uint MINT_BORROW_PERCENT;
    }

    struct ConfigPoolStruct {
        address pair;
        address supplyToken;
        address collateralToken;
        uint POOL_BASE_INTERESTS;
        uint POOL_MARKET_FRENZY;
        uint POOL_PLEDGE_RATE;
        uint POOL_LIQUIDATION_RATE;
        string supplyTokenSymbol;
        string collateralTokenSymbol;
    }

    constructor() public {
        owner = msg.sender;
    }
    
    function setupConfig (address _config) external {
        require(msg.sender == owner, "FORBIDDEN");
        config = _config;
    }

    function getConfigCommon() public view returns (ConfigCommonStruct memory info){
        info.PROPOSAL_VOTE_DURATION = IConfig(config).getValue(ConfigNames.PROPOSAL_VOTE_DURATION);
        info.PROPOSAL_EXECUTE_DURATION = IConfig(config).getValue(ConfigNames.PROPOSAL_EXECUTE_DURATION);
        info.PROPOSAL_CREATE_COST = IConfig(config).getValue(ConfigNames.PROPOSAL_CREATE_COST);
        info.STAKE_LOCK_TIME = IConfig(config).getValue(ConfigNames.STAKE_LOCK_TIME);
        info.MINT_AMOUNT_PER_BLOCK = IConfig(config).getValue(ConfigNames.MINT_AMOUNT_PER_BLOCK);
        info.INTEREST_PLATFORM_SHARE = IConfig(config).getValue(ConfigNames.INTEREST_PLATFORM_SHARE);
        info.INTEREST_BUYBACK_SHARE = IConfig(config).getValue(ConfigNames.INTEREST_BUYBACK_SHARE);
        info.CHANGE_PRICE_DURATION = IConfig(config).getValue(ConfigNames.CHANGE_PRICE_DURATION);
        info.CHANGE_PRICE_PERCENT = IConfig(config).getValue(ConfigNames.CHANGE_PRICE_PERCENT);
        info.MINT_BORROW_PERCENT = IConfig(config).getValue(ConfigNames.MINT_BORROW_PERCENT);
        return info;
    }

    function getConfigPool(address _pair) public view returns (ConfigPoolStruct memory info){
        info.pair = _pair;
        info.supplyToken = IAAAAPool(_pair).supplyToken();
        info.collateralToken = IAAAAPool(_pair).collateralToken();
        info.supplyTokenSymbol = IERC20(info.supplyToken).symbol();
        info.collateralTokenSymbol = IERC20(info.collateralToken).symbol();
        info.POOL_BASE_INTERESTS = IConfig(config).getPoolValue(_pair, ConfigNames.POOL_BASE_INTERESTS);
        info.POOL_MARKET_FRENZY = IConfig(config).getPoolValue(_pair, ConfigNames.POOL_MARKET_FRENZY);
        info.POOL_PLEDGE_RATE = IConfig(config).getPoolValue(_pair, ConfigNames.POOL_PLEDGE_RATE);
        info.POOL_LIQUIDATION_RATE = IConfig(config).getPoolValue(_pair, ConfigNames.POOL_LIQUIDATION_RATE);
        return info;
    }

    function getConfigPools() public view returns (ConfigPoolStruct[] memory list){
        uint count = IAAAAFactory(IConfig(config).factory()).countPools();
        list = new ConfigPoolStruct[](count);
        if(count > 0) {
            for(uint i = 0; i < count; i++) {
                address pair = IAAAAFactory(IConfig(config).factory()).allPools(i);
                list[i] = getConfigPool(pair);
            }
        }
        return list;
    }

    function countConfig() public view returns (uint) {
        return 10 + IAAAAFactory(IConfig(config).factory()).countPools() * 4;
    }
}