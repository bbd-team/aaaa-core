// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./interface/IERC20.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/SafeMath.sol";
import "./modules/Configable.sol";

contract SevenUpPool is Configable
{
    using SafeMath for uint;

    address public dev;
    address public factory;
    address public supplyToken;
    address public collateralToken;

    struct SupplyStruct {
        uint amountSupply;
        uint interestSettled;
        uint liquidationSettled;

        uint interests;
        uint liquidation;
    }

    struct BorrowStruct {
        uint amountCollateral;
        uint interestSettled;
        uint amountBorrow;
        uint interests;
    }

    mapping(address => SupplyStruct) public supplys;
    mapping(address => BorrowStruct) public borrows;

    uint public interestPerSupply;
    uint public liquidationPerSupply;
    uint public interestPerBorrow;

    uint public totalLiquidation;
    uint public totalLiquidationSupplyAmount;

    uint public totalBorrow;
    uint public totalPledge;

    uint public remainSupply;

    uint public pledgeRate;
    uint public pledgePrice;
    uint public liquidationRate;
    uint256 public baseInterests;
    uint256 public marketFrenzy;

    uint public lastInterestUpdate;

    event Deposit(address indexed _user, uint _amount, uint _collateralAmount);
    event Withdraw(address indexed _user, uint _supplyAmount, uint _collateralAmount, uint _interestAmount);
    event Borrow(address indexed _user, uint _supplyAmount, uint _collateralAmount);
    event Repay(address indexed _user, uint _supplyAmount, uint _collateralAmount, uint _interestAmount);
    event Liquidation(address indexed _liquidator, address indexed _user, uint _supplyAmount, uint _collateralAmount);
    event PledgeRateChanged(uint from, uint to);
    event PledgePriceChanged(uint from, uint to);
    event LiquidationRateChanged(uint from, uint to);

    constructor() public 
    {
        factory = msg.sender;
    }

    function updatePledgeRate(uint _pledgeRate) external onlyPlatform
    {
        uint oldValue = pledgeRate;
        pledgeRate = _pledgeRate;

        emit PledgeRateChanged(oldValue, pledgeRate);
    }

    function updatePledgePrice(uint _pledgePrice) external onlyPlatform
    {
        uint oldValue = pledgePrice;
        pledgePrice = _pledgePrice;

        emit PledgePriceChanged(oldValue, pledgePrice);
    }

    function updateLiquidationRate(uint _liquidationRate) external onlyPlatform 
    {
        uint oldValue = liquidationRate;
        liquidationRate = _liquidationRate;

        emit LiquidationRateChanged(oldValue, liquidationRate);
    }

    function init(address _supplyToken,  address _collateralToken) external onlyFactory
    {
        // require(msg.sender == factory, "7UP: ONLY FACTORY");
        supplyToken = _supplyToken;
        collateralToken = _collateralToken;

        baseInterests = 2 * 1e17;
        marketFrenzy  = 1e18;

        pledgeRate = 5000;
        pledgePrice = 200;
        liquidationRate = 9000;

        lastInterestUpdate = block.number;
    }

    function updateInterests() internal
    {
        uint totalSupply = totalBorrow + remainSupply;
        uint interestPerBlock = getInterests();

        interestPerSupply = interestPerSupply.add(totalSupply == 0 ? 0 : interestPerBlock.mul(block.number - lastInterestUpdate).mul(totalBorrow).div(totalSupply));
        interestPerBorrow = interestPerBorrow.add(interestPerBlock.mul(block.number - lastInterestUpdate));
        lastInterestUpdate = block.number;
    }

    function getInterests() public view returns(uint interestPerBlock)
    {
        uint totalSupply = totalBorrow + remainSupply;
        uint apy = totalSupply == 0 ? 0 : baseInterests.add(totalBorrow.mul(marketFrenzy).div(totalSupply));
        apy = apy.div(365 * 28800);
        interestPerBlock = apy;
    }

    function updateLiquidation(uint _liquidation) internal
    {
        uint totalSupply = totalBorrow + remainSupply;
        liquidationPerSupply = liquidationPerSupply.add(totalSupply == 0 ? 0 : _liquidation.mul(1e18).div(totalSupply));
    }

    function deposit(uint amountDeposit, address from) public onlyPlatform
    {
        require(amountDeposit > 0, "7UP: INVALID AMOUNT");
        TransferHelper.safeTransferFrom(supplyToken, from, address(this), amountDeposit);

        updateInterests();

        uint addLiquidation = liquidationPerSupply.mul(supplys[from].amountSupply).div(1e18).sub(supplys[from].liquidationSettled);

        // supplys[msg.sender].interests   += interestPerSupply * supplys[msg.sender].amountSupply / decimal - supplys[msg.sender].interestSettled;
        supplys[from].interests = supplys[from].interests.add(
            interestPerSupply.mul(supplys[from].amountSupply).div(1e18).sub(supplys[from].interestSettled));
        supplys[from].liquidation = supplys[from].liquidation.add(addLiquidation);

        supplys[from].amountSupply = supplys[from].amountSupply.add(amountDeposit);
        remainSupply = remainSupply.add(amountDeposit);

        // updateLiquidation(addLiquidation);

        supplys[from].interestSettled = interestPerSupply.mul(supplys[from].amountSupply).div(1e18);
        supplys[from].liquidationSettled = liquidationPerSupply.mul(supplys[from].amountSupply).div(1e18);
        emit Deposit(from, amountDeposit, addLiquidation);
    }

    function withdraw(uint amountWithdraw, address from) public onlyPlatform
    {
        require(amountWithdraw > 0, "7UP: INVALID AMOUNT");
        require(amountWithdraw <= supplys[from].amountSupply, "7UP: NOT ENOUGH BALANCE");

        updateInterests();

        uint addLiquidation = liquidationPerSupply.mul(supplys[from].amountSupply).div(1e18).sub(supplys[from].liquidationSettled);

        supplys[from].interests = supplys[from].interests.add(
            interestPerSupply.mul(supplys[from].amountSupply).div(1e18).sub(supplys[from].interestSettled));
        supplys[from].liquidation = supplys[from].liquidation.add(addLiquidation);

        uint withdrawLiquidation = supplys[from].liquidation.mul(amountWithdraw).div(supplys[from].amountSupply);
        uint withdrawInterest = supplys[from].interests.mul(amountWithdraw).div(supplys[from].amountSupply);

        uint withdrawLiquidationSupplyAmount = totalLiquidation == 0 ? 0 : withdrawLiquidation.mul(totalLiquidationSupplyAmount).div(totalLiquidation);
        uint withdrawSupplyAmount = amountWithdraw.sub(withdrawLiquidationSupplyAmount).add(withdrawInterest);
        
        require(withdrawSupplyAmount <= remainSupply, "7UP: NOT ENOUGH POOL BALANCE");
        require(withdrawLiquidation <= totalLiquidation, "7UP: NOT ENOUGH LIQUIDATION");

        remainSupply = remainSupply.sub(withdrawSupplyAmount);
        totalLiquidation = totalLiquidation.sub(withdrawLiquidation);
        totalLiquidationSupplyAmount = totalLiquidationSupplyAmount.sub(withdrawLiquidationSupplyAmount);

        supplys[from].interests = supplys[from].interests.sub(withdrawInterest);
        supplys[from].liquidation = supplys[from].liquidation.sub(withdrawLiquidation);
        supplys[from].amountSupply = supplys[from].amountSupply.sub(amountWithdraw);

        // updateLiquidation(withdrawLiquidation);

        supplys[from].interestSettled = supplys[from].amountSupply == 0 ? 0 : interestPerSupply.mul(supplys[from].amountSupply).div(1e18);
        supplys[from].liquidationSettled = supplys[from].amountSupply == 0 ? 0 : liquidationPerSupply.mul(supplys[from].amountSupply).div(1e18);

        TransferHelper.safeTransfer(supplyToken, from, withdrawSupplyAmount);
        TransferHelper.safeTransfer(collateralToken, from, withdrawLiquidation);

        emit Withdraw(from, withdrawSupplyAmount, withdrawLiquidation, withdrawInterest);
    }

    function getMaximumBorrowAmount(uint amountCollateral) external view returns(uint amountBorrow)
    {
        amountBorrow = pledgePrice * amountCollateral * pledgeRate / 100000000;        
    }

    function borrow(uint amountCollateral, uint expectBorrow, address from) public onlyPlatform
    {
        require(amountCollateral > 0, "7UP: INVALID AMOUNT");
        require(amountCollateral <= uint(-1) && expectBorrow <= uint(-1), '7UP: OVERFLOW');
        TransferHelper.safeTransferFrom(collateralToken, from, address(this), amountCollateral);

        updateInterests();

        uint amountBorrow = pledgePrice.mul(amountCollateral).mul(pledgeRate).div(100000000);
        require(expectBorrow <= amountBorrow && expectBorrow <= remainSupply, "7UP: INVALID BORROW");

        totalBorrow = totalBorrow.add(expectBorrow);
        totalPledge = totalPledge.add(amountCollateral);
        remainSupply = remainSupply.sub(expectBorrow);

        borrows[from].interests = borrows[from].interests.add(
            interestPerBorrow.mul(borrows[from].amountBorrow).div(1e18).sub(borrows[from].interestSettled));
        borrows[from].amountCollateral = borrows[from].amountCollateral.add(amountCollateral);
        borrows[from].amountBorrow = borrows[from].amountBorrow.add(expectBorrow);
        borrows[from].interestSettled = interestPerBorrow.mul(borrows[from].amountBorrow).div(1e18);

        if(expectBorrow > 0) TransferHelper.safeTransfer(supplyToken, from, expectBorrow);

        emit Borrow(from, expectBorrow, amountCollateral);
    }

    function repay(uint amountCollateral, address from) public onlyPlatform returns(uint repayAmount, uint repayInterest)
    {
        require(amountCollateral <= borrows[from].amountCollateral, "7UP: NOT ENOUGH COLLATERAL");
        require(amountCollateral > 0, "7UP: INVALID AMOUNT");

        updateInterests();

        borrows[from].interests = borrows[from].interests.add(
            interestPerBorrow.mul(borrows[from].amountBorrow).div(1e18).sub(borrows[from].interestSettled));

        repayAmount = borrows[from].amountBorrow.mul(amountCollateral).div(borrows[from].amountCollateral);
        repayInterest = borrows[from].interests.mul(amountCollateral).div(borrows[from].amountCollateral);

        totalPledge = totalPledge.sub(amountCollateral);
        totalBorrow = totalBorrow.sub(repayAmount);
        
        borrows[from].amountCollateral = borrows[from].amountCollateral.sub(amountCollateral);
        borrows[from].amountBorrow = borrows[from].amountBorrow.sub(repayAmount);
        borrows[from].interests = borrows[from].interests.sub(repayInterest);
        borrows[from].interestSettled = borrows[from].amountBorrow == 0 ? 0 : interestPerBorrow.mul(borrows[from].amountBorrow).div(1e18);

        remainSupply = remainSupply.add(repayAmount.add(repayInterest));

        TransferHelper.safeTransfer(collateralToken, from, amountCollateral);
        TransferHelper.safeTransferFrom(supplyToken, from, address(this), repayAmount + repayInterest);

        emit Repay(from, repayAmount, amountCollateral, repayInterest);
    }

    function liquidation(address _user, address from) public onlyPlatform returns(uint borrowAmount)
    {
        require(supplys[from].amountSupply > 0, "7UP: ONLY SUPPLIER");

        updateInterests();

        borrows[_user].interests = borrows[_user].interests.add(
            interestPerBorrow.mul(borrows[_user].amountBorrow).div(1e18).sub(borrows[_user].interestSettled));

        uint collateralValue = borrows[_user].amountCollateral.mul(pledgePrice).div(10000);
        uint expectedRepay = borrows[_user].amountBorrow.add(borrows[_user].interests);

        require(expectedRepay >= collateralValue.mul(liquidationRate).div(10000), '7UP: NOT LIQUIDABLE');

        updateLiquidation(borrows[_user].amountCollateral);

        totalLiquidation = totalLiquidation.add(borrows[_user].amountCollateral);
        totalLiquidationSupplyAmount = totalLiquidationSupplyAmount.add(expectedRepay);
        totalBorrow = totalBorrow.sub(borrows[_user].amountBorrow);

        borrowAmount = borrows[_user].amountBorrow;
        
        emit Liquidation(from, _user, borrows[_user].amountBorrow, borrows[_user].amountCollateral);

        borrows[_user].amountCollateral = 0;
        borrows[_user].amountBorrow = 0;
        borrows[_user].interests = 0;
        borrows[_user].interestSettled = 0;
    }
}