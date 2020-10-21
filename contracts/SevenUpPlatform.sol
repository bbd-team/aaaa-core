// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import "./modules/Configable.sol";
import "./libraries/SafeMath.sol";
import "./libraries/TransferHelper.sol";

interface ISevenUpMint {
    function increaseBorrowerProductivity(address user, uint value) external returns (bool);
    function decreaseBorrowerProductivity(address user, uint value) external returns (bool);
    function increaseLenderProductivity(address user, uint value) external returns (bool);
    function decreaseLenderProductivity(address user, uint value) external returns (bool);
}

interface ISevenUpPool {
    function deposit(uint _amountDeposit, address _from) external;
    function withdraw(uint _amountWithdraw, address _from) external;
    function borrow(uint _amountCollateral, uint _expectBorrow, address _from) external;
    function repay(uint _amountCollateral, address _from) external returns(uint, uint);
    function liquidation(address _user, address _from) external returns (uint);
    function updatePledgeRate(uint _pledgeRate) external;
    function updatePledgePrice(uint _pledgePrice) external;
    function updateLiquidationRate(uint _liquidationRate) external;
}

interface ISevenUpFactory {
    function getPool(address _lendToken, address _collateralToken) external view returns (address);
}

contract SevenUpPlatform is Configable {
    function deposit(address _lendToken, address _collateralToken, uint _amountDeposit) external {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).deposit(_amountDeposit, msg.sender);
        if(_lendToken == IConfig(config).base()) {
            ISevenUpMint(IConfig(config).mint()).increaseLenderProductivity(msg.sender, _amountDeposit);
        }
    }
    
    function withdraw(address _lendToken, address _collateralToken, uint _amountWithdraw) external {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).withdraw(_amountWithdraw, msg.sender);
        if(_lendToken == IConfig(config).base()) {
            ISevenUpMint(IConfig(config).mint()).decreaseLenderProductivity(msg.sender, _amountWithdraw);
        }
    }
    
    function borrow(address _lendToken, address _collateralToken, uint _amountCollateral, uint _expectBorrow) external {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).borrow(_amountCollateral, _expectBorrow, msg.sender);
        if(_lendToken == IConfig(config).base()) {
            ISevenUpMint(IConfig(config).mint()).increaseBorrowerProductivity(msg.sender, _expectBorrow);
        }
    }
    
    function repay(address _lendToken, address _collateralToken, uint _amountCollateral) external {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        (uint repayAmount, ) = ISevenUpPool(pool).repay(_amountCollateral, msg.sender);
        if(_lendToken == IConfig(config).base()) {
            ISevenUpMint(IConfig(config).mint()).decreaseBorrowerProductivity(msg.sender, repayAmount);
        }
    }
    
    function liquidation(address _lendToken, address _collateralToken, address _user) external {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        uint borrowAmount = ISevenUpPool(pool).liquidation(_user, msg.sender);
        if(_lendToken == IConfig(config).base()) {
            ISevenUpMint(IConfig(config).mint()).decreaseBorrowerProductivity(_user, borrowAmount);
        }
    }

    function updatePledgeRate(address _lendToken, address _collateralToken, uint _pledgeRate) external onlyDeveloper
    {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).updatePledgeRate(_pledgeRate);
    }

    function updatePledgePrice(address _lendToken, address _collateralToken, uint _pledgePrice) external onlyDeveloper
    {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).updatePledgePrice(_pledgePrice);
    }

    function updateLiquidationRate(address _lendToken, address _collateralToken, uint _liquidationRate) external onlyDeveloper 
    {
        address pool = ISevenUpFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        ISevenUpPool(pool).updateLiquidationRate(_liquidationRate);
    }
}
