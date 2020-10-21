// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
pragma experimental ABIEncoderV2;

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);
}

interface ISevenUpFactory {
    function countPools() external view returns(uint);
    function allPools(uint index) external view returns(address);
    function isPool(address addr) external view returns(bool);
    function getPool(address lend, address collateral) external view returns(address);
}

interface ISevenUpPool {
    function supplyToken() external view returns(address);
    function collateralToken() external view returns(address);
    function totalBorrow() external view returns(uint);
    function totalPledge() external view returns(uint);
    function remainSupply() external view returns(uint);
    function getInterests() external view returns(uint);
}

contract SevenUpQuery {
    address public owner;
    address public factory;

    struct PoolInfoStruct {
        address pair;
        uint totalBorrow;
        uint totalPledge;
        uint remainSupply;
        uint interests;
        address supplyToken;
        address collateralToken;
        uint8 supplyTokenDecimals;
        uint8 collateralTokenDecimals;
        string supplyTokenSymbol;
        string collateralTokenSymbol;
    }

    struct TokenStruct {
        string name;
        string symbol;
        uint8 decimals;
        uint balance;
        uint totalSupply;
        uint allowance;
    }

    constructor() public {
        owner = msg.sender;
    }
    
    function initialize (address _factory) external {
        require(msg.sender == owner, "FORBIDDEN");
        factory = _factory;
    }

    function getPoolInfoByIndex(uint index) external view returns (PoolInfoStruct memory info) {
        uint count = ISevenUpFactory(factory).countPools();
        if (index >= count || count == 0) {
            return info;
        }
        address pair = ISevenUpFactory(factory).allPools(index);
        return getPoolInfo(pair);
    }

    function getPoolInfoByTokens(address lend, address collateral) external view returns (PoolInfoStruct memory info) {
        address pair = ISevenUpFactory(factory).getPool(lend, collateral);
        return getPoolInfo(pair);
    }
    
    function getPoolInfo(address pair) public view returns (PoolInfoStruct memory info) {
        if(!ISevenUpFactory(factory).isPool(pair)) {
            return info;
        }
        info.pair = pair;
        info.totalBorrow = ISevenUpPool(pair).totalBorrow();
        info.totalPledge = ISevenUpPool(pair).totalPledge();
        info.remainSupply = ISevenUpPool(pair).remainSupply();
        info.interests = ISevenUpPool(pair).getInterests();
        info.supplyToken = ISevenUpPool(pair).supplyToken();
        info.collateralToken = ISevenUpPool(pair).collateralToken();
        info.supplyTokenDecimals = IERC20(info.supplyToken).decimals();
        info.collateralTokenDecimals = IERC20(info.collateralToken).decimals();
        info.supplyTokenSymbol = IERC20(info.supplyToken).symbol();
        info.collateralTokenSymbol = IERC20(info.collateralToken).symbol();
    }

    function queryToken(address user, address spender, address token) public view returns (TokenStruct memory info) {
        info.name = IERC20(token).name();
        info.symbol = IERC20(token).symbol();
        info.decimals = IERC20(token).decimals();
        info.balance = IERC20(token).balanceOf(user);
        info.totalSupply = IERC20(token).totalSupply();
        if(spender != user) {
            info.allowance = IERC20(token).allowance(user, spender);
        }
    }

    function queryTokenList(address user, address spender, address[] memory tokens) public view returns (TokenStruct[] memory token_list) {
        uint count = tokens.length;
        if(count > 0) {
            token_list = new TokenStruct[](count);
            for(uint i = 0;i < count;i++) {
                token_list[i] = queryToken(user, spender, tokens[i]);
            }
        }
    }
}