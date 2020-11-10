// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./interface/IERC20.sol";
import "./libraries/TransferHelper.sol";
import "./libraries/SafeMath.sol";
import "./modules/Configable.sol";

interface ICollateralStrategy {
    function invest(uint amount) external returns(uint);
    function withdraw(uint amount) external returns(uint);
    function interestToken() external returns (address);
    function collateralToken() external returns (address);
}

interface IMasterChef {
    function deposit(uint256 _pid, uint256 _amount) external;
    function withdraw(uint256 _pid, uint256 _amount) external;
    function pendingCake(uint256 _pid, address _user) external view returns (uint256);
}

contract CakeLPStrategy is ICollateralStrategy
{
    using SafeMath for uint;

    address override public interestToken;
    address override public collateralToken;

    address public poolAddress;
    address public masterChef;

    uint public lpPoolpid;

    constructor(address _interestToken, address _collateralToken, address _poolAddress, address _cakeMasterChef, uint _lpPoolpid) public
    {
        interestToken = _interestToken;
        collateralToken = _collateralToken;
        poolAddress = _poolAddress;
        masterChef = _cakeMasterChef;
        lpPoolpid = _lpPoolpid;
    }

    function invest(uint amount) external override returns(uint interests)
    {
        require(msg.sender == poolAddress, "INVALID CALLER");
        TransferHelper.safeTransferFrom(collateralToken, msg.sender, address(this), amount);
        IERC20(collateralToken).approve(masterChef, amount);
        IMasterChef(masterChef).deposit(lpPoolpid, amount);
        interests = IERC20(interestToken).balanceOf(address(this));
        if(interests > 0) TransferHelper.safeTransfer(interestToken, msg.sender, interests);
    }

    function withdraw(uint amount) external override returns(uint interests)
    {
        require(msg.sender == poolAddress, "INVALID CALLER");
        IMasterChef(masterChef).withdraw(lpPoolpid, amount);
        interests = IERC20(interestToken).balanceOf(address(this));
        TransferHelper.safeTransfer(collateralToken, msg.sender, amount);
        if(interests > 0) TransferHelper.safeTransfer(interestToken, msg.sender, interests);
    }
}