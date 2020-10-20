// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./interface/IERC20.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/SafeMath.sol";

contract SevenUpPool
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

    constructor() public 
    {
        factory = msg.sender;
    }

    function updatePledgeRate(uint _pledgeRate) public 
    {
        require(msg.sender == factory, "7UP: INVALID AUTHORITY");
        pledgeRate = _pledgeRate;
    }

    function updatePledgePrice(uint _pledgePrice) public
    {
        require(msg.sender == factory, "7UP: INVALID AUTHORITY");
        pledgePrice = _pledgePrice;
    }

    function updateLiquidationRate(uint _liquidationRate) public
    {
        require(msg.sender == factory, "7UP: INVALID AUTHORITY");
        liquidationRate = _liquidationRate;
    }

    function init(address _supplyToken,  address _collateralToken) public
    {
        require(msg.sender == factory, "7UP: ONLY FACTORY");
        supplyToken = _supplyToken;
        collateralToken = _collateralToken;

        baseInterests = 2 * (10 ** 17);
        marketFrenzy  = 10 ** 18;

        pledgeRate = 6000;
        pledgePrice = 200;
        liquidationRate = 9000;

        lastInterestUpdate = block.number;
    }

    function updateInterests() internal
    {
        uint totalSupply = totalBorrow + remainSupply;
        uint apy = totalSupply == 0 ? 0 : baseInterests.add(totalBorrow.mul(marketFrenzy).div(totalSupply));
        uint interestPerBlock = apy;//.div(365 * 28800);

        interestPerSupply = interestPerSupply.add(totalSupply == 0 ? 0 : interestPerBlock.mul(block.number - lastInterestUpdate).mul(totalBorrow).div(totalSupply));
        interestPerBorrow = interestPerBorrow.add(interestPerBlock.mul(block.number - lastInterestUpdate));
        lastInterestUpdate = block.number;
    }

    function getInterests() external view returns(uint interestPerBlock)
    {
        uint totalSupply = totalBorrow + remainSupply;
        uint apy = totalSupply == 0 ? 0 : baseInterests.add(totalBorrow.mul(marketFrenzy).div(totalSupply));
        interestPerBlock = apy;//.div(365 * 28800);
    }

    function updateLiquidation(uint _liquidation) internal
    {
        uint totalSupply = totalBorrow + remainSupply;
        liquidationPerSupply = liquidationPerSupply.add(totalSupply == 0 ? 0 : _liquidation.div(totalSupply));
    }

    function deposit(uint amountDeposit) public
    {
        require(amountDeposit > 0, "7UP: INVALID AMOUNT");
        TransferHelper.safeTransferFrom(supplyToken, msg.sender, address(this), amountDeposit);

        updateInterests();

        uint addLiquidation = liquidationPerSupply.mul(supplys[msg.sender].amountSupply.sub(supplys[msg.sender].liquidationSettled));

        // supplys[msg.sender].interests   += interestPerSupply * supplys[msg.sender].amountSupply / decimal - supplys[msg.sender].interestSettled;
        supplys[msg.sender].interests = supplys[msg.sender].interests.add(
            interestPerSupply.mul(supplys[msg.sender].amountSupply).div(10 ** 18).sub(supplys[msg.sender].interestSettled));
        supplys[msg.sender].liquidation = supplys[msg.sender].liquidation.add(addLiquidation);

        supplys[msg.sender].amountSupply = supplys[msg.sender].amountSupply.add(amountDeposit);
        remainSupply = remainSupply.add(amountDeposit);

        updateLiquidation(addLiquidation);

        supplys[msg.sender].interestSettled = interestPerSupply.mul(supplys[msg.sender].amountSupply).div(10 ** 18);
        supplys[msg.sender].liquidationSettled = liquidationPerSupply.mul(supplys[msg.sender].amountSupply);
        emit Deposit(msg.sender, amountDeposit, addLiquidation);
    }

    function withdraw(uint amountWithdraw) public
    {
        require(amountWithdraw > 0, "7UP: INVALID AMOUNT");
        require(amountWithdraw <= supplys[msg.sender].amountSupply, "7UP: NOT ENOUGH BALANCE");

        updateInterests();

        uint addLiquidation = liquidationPerSupply.mul(supplys[msg.sender].amountSupply).sub(supplys[msg.sender].liquidationSettled);

        supplys[msg.sender].interests = supplys[msg.sender].interests.add(
            interestPerSupply.mul(supplys[msg.sender].amountSupply).div(10 ** 18).sub(supplys[msg.sender].interestSettled));
        supplys[msg.sender].liquidation = supplys[msg.sender].liquidation.add(addLiquidation);

        uint withdrawLiquidation = supplys[msg.sender].liquidation.mul(amountWithdraw).div(supplys[msg.sender].amountSupply);
        uint withdrawInterest = supplys[msg.sender].interests.mul(amountWithdraw).div(supplys[msg.sender].amountSupply);

        uint withdrawLiquidationSupplyAmount = totalLiquidation == 0 ? 0 : withdrawLiquidation.mul(totalLiquidationSupplyAmount).div(totalLiquidation);
        uint withdrawSupplyAmount = amountWithdraw.sub(withdrawLiquidationSupplyAmount).add(withdrawInterest);
        
        require(withdrawSupplyAmount <= remainSupply, "7UP: NOT ENOUGH POOL BALANCE");
        require(withdrawLiquidation <= totalLiquidation, "7UP: NOT ENOUGH LIQUIDATION");

        remainSupply = remainSupply.sub(withdrawSupplyAmount);
        totalLiquidation = totalLiquidation.sub(withdrawLiquidation);
        totalLiquidationSupplyAmount = totalLiquidationSupplyAmount.sub(withdrawLiquidationSupplyAmount);

        supplys[msg.sender].interests = supplys[msg.sender].interests.sub(withdrawInterest);
        supplys[msg.sender].liquidation = supplys[msg.sender].liquidation.sub(withdrawLiquidation);
        supplys[msg.sender].amountSupply = supplys[msg.sender].amountSupply.sub(amountWithdraw);

        updateLiquidation(withdrawLiquidation);

        supplys[msg.sender].interestSettled = interestPerSupply.mul(supplys[msg.sender].amountSupply).div(10 ** 18);
        supplys[msg.sender].liquidationSettled = liquidationPerSupply.mul(supplys[msg.sender].amountSupply);

        TransferHelper.safeTransfer(supplyToken, msg.sender, withdrawSupplyAmount);
        TransferHelper.safeTransfer(collateralToken, msg.sender, withdrawLiquidation);

        emit Withdraw(msg.sender, withdrawSupplyAmount, withdrawLiquidation, withdrawInterest);
    }

    function getMaximumBorrowAmount(uint amountCollateral) external view returns(uint amountBorrow)
    {
        amountBorrow = pledgePrice * amountCollateral * pledgeRate / 100000000;        
    }

    function borrow(uint amountCollateral, uint expectBorrow) public
    {
        require(amountCollateral > 0, "7UP: INVALID AMOUNT");
        TransferHelper.safeTransferFrom(collateralToken, msg.sender, address(this), amountCollateral);

        updateInterests();

        uint amountBorrow = pledgePrice.mul(amountCollateral).mul(pledgeRate).div(100000000);
        require(expectBorrow <= amountBorrow, "7UP: INVALID BORROW");

        totalBorrow = totalBorrow.add(expectBorrow);
        totalPledge = totalPledge.add(amountCollateral);
        remainSupply = remainSupply.sub(expectBorrow);

        require(totalBorrow <= remainSupply, "7UP: NOT ENOUGH SUPPLY");

        borrows[msg.sender].interests = borrows[msg.sender].interests.add(
            interestPerBorrow.mul(borrows[msg.sender].amountBorrow).div(10 ** 18).sub(borrows[msg.sender].interestSettled));
        borrows[msg.sender].amountCollateral = borrows[msg.sender].amountCollateral.add(amountCollateral);
        borrows[msg.sender].amountBorrow = borrows[msg.sender].amountBorrow.add(expectBorrow);
        borrows[msg.sender].interestSettled = interestPerBorrow.mul(borrows[msg.sender].amountBorrow).div(10 ** 18);

        if(expectBorrow > 0) TransferHelper.safeTransfer(supplyToken, msg.sender, expectBorrow);

        emit Borrow(msg.sender, expectBorrow, amountCollateral);
    }

    function repay(uint amountCollateral) public
    {
        require(amountCollateral <= borrows[msg.sender].amountCollateral, "7UP: NOT ENOUGH COLLATERAL");
        require(amountCollateral > 0, "7UP: INVALID AMOUNT");

        updateInterests();

        borrows[msg.sender].interests = borrows[msg.sender].interests.add(
            interestPerBorrow.mul(borrows[msg.sender].amountBorrow).div(10 ** 18).sub(borrows[msg.sender].interestSettled));

        uint repayAmount = borrows[msg.sender].amountBorrow.mul(amountCollateral).div(borrows[msg.sender].amountCollateral);
        uint repayInterest = borrows[msg.sender].interests.mul(amountCollateral).div(borrows[msg.sender].amountCollateral);

        totalPledge = totalPledge.sub(amountCollateral);
        totalBorrow = totalBorrow.sub(repayAmount);
        
        borrows[msg.sender].amountCollateral = borrows[msg.sender].amountCollateral.sub(amountCollateral);
        borrows[msg.sender].amountBorrow = borrows[msg.sender].amountBorrow.sub(repayAmount);
        borrows[msg.sender].interests = borrows[msg.sender].interests.sub(repayInterest);
        borrows[msg.sender].interestSettled = interestPerBorrow.mul(borrows[msg.sender].amountBorrow).div(10 ** 18);

        remainSupply = remainSupply.add(repayAmount.add(repayInterest));

        TransferHelper.safeTransfer(collateralToken, msg.sender, amountCollateral);
        TransferHelper.safeTransferFrom(supplyToken, msg.sender, address(this), repayAmount + repayInterest);

        emit Repay(msg.sender, repayAmount + repayInterest, amountCollateral, repayInterest);
    }

    function liquidation(address _user) public
    {
        require(supplys[msg.sender].amountSupply > 0, "7UP: ONLY SUPPLIER");

        updateInterests();

        borrows[_user].interests = borrows[_user].interests.add(
            interestPerBorrow.mul(borrows[_user].amountBorrow).div(10 ** 18).sub(borrows[_user].interestSettled));

        uint collateralValue = borrows[_user].amountCollateral.mul(pledgePrice).div(10000);
        uint expectedRepay = borrows[_user].amountBorrow.add(borrows[_user].interests);

        require(expectedRepay >= collateralValue.mul(liquidationRate).div(10000), '7UP: NOT LIQUIDABLE');

        updateLiquidation(borrows[_user].amountCollateral);

        totalLiquidation = totalLiquidation.add(borrows[_user].amountCollateral);
        totalLiquidationSupplyAmount = totalLiquidationSupplyAmount.add(expectedRepay);
        totalBorrow = totalBorrow.sub(borrows[_user].amountBorrow);
        
        emit Liquidation(msg.sender, _user, borrows[_user].amountBorrow, borrows[_user].amountCollateral);

        borrows[_user].amountCollateral = 0;
        borrows[_user].amountBorrow = 0;
        borrows[_user].interests = 0;
        borrows[_user].interestSettled = 0;
    }
}