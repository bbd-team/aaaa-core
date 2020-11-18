// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import "./modules/Configable.sol";
import "./modules/ConfigNames.sol";
import "./libraries/SafeMath.sol";
import "./libraries/TransferHelper.sol";

interface IAAAAMint {
    function getBorrowerProductivity(address user) external view returns (uint, uint);
    function getLenderProductivity(address user) external view returns (uint, uint);
    function increaseBorrowerProductivity(address user, uint value) external returns (bool);
    function decreaseBorrowerProductivity(address user, uint value) external returns (bool);
    function increaseLenderProductivity(address user, uint value) external returns (bool);
    function decreaseLenderProductivity(address user, uint value) external returns (bool);
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
        if(_amountDeposit > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).increaseLenderProductivity(msg.sender, _amountDeposit);
        }
    }
    
    function withdraw(address _lendToken, address _collateralToken, uint _amountWithdraw) external {
        require(IConfig(config).getValue(ConfigNames.WITHDRAW_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).withdraw(_amountWithdraw, msg.sender);
        if(_amountWithdraw > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).decreaseLenderProductivity(msg.sender, _amountWithdraw);
        }
    }
    
    function borrow(address _lendToken, address _collateralToken, uint _amountCollateral, uint _expectBorrow) external {
        require(IConfig(config).getValue(ConfigNames.BORROW_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        IAAAAPool(pool).borrow(_amountCollateral, _expectBorrow, msg.sender);
        if(_expectBorrow > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).increaseBorrowerProductivity(msg.sender, _expectBorrow);
        }
    }
    
    function repay(address _lendToken, address _collateralToken, uint _amountCollateral) external {
        require(IConfig(config).getValue(ConfigNames.REPAY_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        (uint repayAmount, ) = IAAAAPool(pool).repay(_amountCollateral, msg.sender);
        if(repayAmount > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).decreaseBorrowerProductivity(msg.sender, repayAmount);
        }
    }
    
    function liquidation(address _lendToken, address _collateralToken, address _user) external {
        require(IConfig(config).getValue(ConfigNames.LIQUIDATION_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        uint borrowAmount = IAAAAPool(pool).liquidation(_user, msg.sender);
        if(borrowAmount > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).decreaseBorrowerProductivity(_user, borrowAmount);
        }
    }

    function reinvest(address _lendToken, address _collateralToken) external {
        require(IConfig(config).getValue(ConfigNames.REINVEST_ENABLE) == 1, "NOT ENABLE NOW");
        address pool = IAAAAFactory(IConfig(config).factory()).getPool(_lendToken, _collateralToken);
        require(pool != address(0), "POOL NOT EXIST");
        uint reinvestAmount = IAAAAPool(pool).reinvest(msg.sender);

        if(reinvestAmount > 0 && IConfig(config).isMintToken(_lendToken)) {
            IAAAAMint(IConfig(config).mint()).increaseLenderProductivity(msg.sender, reinvestAmount);
        }
    } 

    function recalculteProdutivity(address[] calldata _users) external onlyDeveloper {
        for(uint i = 0;i < _users.length;i++) {
            address _user = _users[i];
            uint count = IAAAAFactory(IConfig(config).factory()).countPools();
            (uint oldLendProdutivity, ) = IAAAAMint(IConfig(config).mint()).getLenderProductivity(_user);
            (uint oldBorrowProdutivity, ) = IAAAAMint(IConfig(config).mint()).getBorrowerProductivity(_user);
            uint newLendProdutivity;
            uint newBorrowProdutivity;
            for(uint j = 0;j < count;j++) {
                address pool = IAAAAFactory(IConfig(config).factory()).allPools(j);
                (uint amountSupply, , , , ) = IAAAAPool(pool).supplys(_user);
                (, , , uint amountBorrow, ) = IAAAAPool(pool).borrows(_user);

                newLendProdutivity = newLendProdutivity.add(amountSupply);
                newBorrowProdutivity = newBorrowProdutivity.add(amountBorrow);
            }

            if(oldLendProdutivity > 0) {
                IAAAAMint(IConfig(config).mint()).decreaseLenderProductivity(_user, oldLendProdutivity);
            }

            if(oldBorrowProdutivity > 0) {
                IAAAAMint(IConfig(config).mint()).decreaseBorrowerProductivity(_user, oldBorrowProdutivity);
            }

            if(newLendProdutivity > 0) {
                IAAAAMint(IConfig(config).mint()).increaseLenderProductivity(_user, newLendProdutivity);
            }

            if(newBorrowProdutivity > 0) {
                IAAAAMint(IConfig(config).mint()).increaseBorrowerProductivity(_user, newBorrowProdutivity);
            }
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
