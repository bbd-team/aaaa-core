// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import "./modules/Configable.sol";
import "./modules/ConfigNames.sol";
import "./libraries/SafeMath.sol";
import "./libraries/TransferHelper.sol";

interface IAAAAMint {
    function increaseProductivity(address user, uint value) external returns (bool);
    function decreaseProductivity(address user, uint value) external returns (bool);
    function getProductivity(address user) external view returns (uint, uint);
}

interface IAAAAPool {
    function deposit(uint _amountDeposit, address _from) external;
    function withdraw(uint _amountWithdraw, address _from) external;
    function borrow(uint _amountCollateral, uint _expectBorrow, address _from) external;
    function repay(uint _amountCollateral, address _from) external returns(uint, uint);
    function liquidation(address _user, address _from) external returns (uint);
    function reinvest(address _from) external returns(uint);
    function updatePledgeRate(uint _pledgeRate) external;
    function updatePledgePrice(uint _pledgePrice) external;
    function updateLiquidationRate(uint _liquidationRate) external;
    function switchStrategy(address _collateralStrategy) external;
    function supplys(address user) external view returns(uint,uint,uint,uint,uint);
    function borrows(address user) external view returns(uint,uint,uint,uint,uint);
    function getTotalAmount() external view  returns (uint);
    function supplyToken() external view  returns (address);
}

interface IAAAAFactory {
    function getPool(address _lendToken, address _collateralToken) external view returns (address);
    function countPools() external view returns(uint);
    function allPools(uint index) external view returns (address);
}

contract AAAAPlatform is Configable {

    using SafeMath for uint;

    function deposit(address _lendToken, address _collateralToken, uint _amountDeposit) external {
        require(IConfig(config).getValue(ConfigNames.DEPOSIT_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).deposit(_amountDeposit, msg.sender);
        _updateProdutivity(pool);
    }
    
    function withdraw(address _lendToken, address _collateralToken, uint _amountWithdraw) external {
        require(IConfig(config).getValue(ConfigNames.WITHDRAW_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).withdraw(_amountWithdraw, msg.sender);
        _updateProdutivity(pool);
    }
    
    function borrow(address _lendToken, address _collateralToken, uint _amountCollateral, uint _expectBorrow) external {
        require(IConfig(config).getValue(ConfigNames.BORROW_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).borrow(_amountCollateral, _expectBorrow, msg.sender);
        _updateProdutivity(pool);
    }
    
    function repay(address _lendToken, address _collateralToken, uint _amountCollateral) external {
        require(IConfig(config).getValue(ConfigNames.REPAY_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).repay(_amountCollateral, msg.sender);
        _updateProdutivity(pool);
    }
    
    function liquidation(address _lendToken, address _collateralToken, address _user) external {
        require(IConfig(config).getValue(ConfigNames.LIQUIDATION_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).liquidation(_user, msg.sender);
        _updateProdutivity(pool);
    }

    function reinvest(address _lendToken, address _collateralToken) external {
        require(IConfig(config).getValue(ConfigNames.REINVEST_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).reinvest(msg.sender);
        _updateProdutivity(pool);
    }

    function _updateProdutivity(address _pool) internal {
        uint amount = IAAAAPool(_pool).getTotalAmount();
        (uint old, ) = IAAAAMint(IConfig(config).mint()).getProductivity(_pool);
        if(old > 0) {
            IAAAAMint(IConfig(config).mint()).getProductivity(_pool);
            IAAAAMint(IConfig(config).mint()).decreaseProductivity(_pool, old);
        }
        
        address token = IAAAAPool(_pool).supplyToken();
        uint price = IConfig(config).prices(token);
        if(amount > 0) {
            IAAAAMint(IConfig(config).mint()).increaseProductivity(_pool, price.mul(amount).div(1e18));
        }
    }

    function switchStrategy(address _lendToken, address _collateralToken, address _collateralStrategy) external onlyDeveloper
    {
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).switchStrategy(_collateralStrategy);
    }

    function updatePoolParameter(address _lendToken, address _collateralToken, bytes32 _key, uint _value) external onlyDeveloper
    {
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IConfig(config).setPoolValue(pool, _key, _value);
    }
}
