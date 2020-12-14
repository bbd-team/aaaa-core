// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./libraries/TransferHelper.sol";
import "./libraries/SafeMath.sol";
import "./modules/BaseShareField.sol";

interface ICollateralStrategy {
    function invest(address user, uint amount) external; 
    function withdraw(address user, uint amount) external;
    function liquidation(address user) external;
    function claim(address user, uint amount, uint total) external;
    function exit(uint amount) external;
    function migrate(address old) external;
    function query() external view returns (uint);
    function mint() external;

    function interestToken() external returns (address);
    function collateralToken() external returns (address);
}

interface ISushiBar {
    function enter(uint256 _amount) external;
    function leave(uint256 _share) external;
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract SushibarStrategy is ICollateralStrategy, BaseShareField
{
    event Mint(address indexed user, uint amount);
    using SafeMath for uint;

    address override public interestToken;
    address override public collateralToken;

    address public poolAddress;
    address public sushiBar;
    address public old;

    address public factory;

    uint public totalInvest;

    constructor() public {
        factory = msg.sender;
    }

    function initialize(address _sushiToken, address _poolAddress, address _sushiBar) public
    {
        require(msg.sender == factory, 'STRATEGY FORBIDDEN');
        interestToken = _sushiToken;
        collateralToken = _sushiToken;
        poolAddress = _poolAddress;
        sushiBar = _sushiBar;
        _setShareToken(_sushiToken);
    }

    function migrate(address _old) external override 
    {
        require(msg.sender == poolAddress, "INVALID CALLER");
        if(_old != address(0)) {
            uint amount = IERC20(collateralToken).balanceOf(address(this));
            if(amount > 0) {
                IERC20(collateralToken).approve(sushiBar, amount);
                ISushiBar(sushiBar).enter(amount);
            }

            totalProductivity = BaseShareField(_old).totalProductivity();
            totalInvest = totalProductivity;
            old = _old;
        }
    }

    function invest(address user, uint amount) external override
    {
        _sync(user);

        require(msg.sender == poolAddress, "INVALID CALLER");
        TransferHelper.safeTransferFrom(collateralToken, msg.sender, address(this), amount);
        IERC20(collateralToken).approve(sushiBar, amount);
        ISushiBar(sushiBar).enter(amount);

        totalInvest = totalInvest.add(amount);
        _increaseProductivity(user, amount);
    }

    function withdraw(address user, uint amount) external override
    {
        _sync(user);

        require(msg.sender == poolAddress, "INVALID CALLER");
        uint amountShare = ISushiBar(sushiBar).balanceOf(address(this));
        ISushiBar(sushiBar).leave(amount.mul(amountShare).div(totalProductivity));
        TransferHelper.safeTransfer(collateralToken, msg.sender, amount);

        totalInvest = totalInvest.sub(amount);
        _decreaseProductivity(user, amount);
    }

    function liquidation(address user) external override {
        _sync(user);
        _sync(msg.sender);

        require(msg.sender == poolAddress, "INVALID CALLER");
        uint amount = users[user].amount;
        _decreaseProductivity(user, amount);

        uint reward = users[user].rewardEarn;
        users[msg.sender].rewardEarn = users[msg.sender].rewardEarn.add(reward);
        users[user].rewardEarn = 0;
        _increaseProductivity(msg.sender, amount);
    }

    function claim(address user, uint amount, uint total) external override {
        _sync(msg.sender);

        require(msg.sender == poolAddress, "INVALID CALLER");
        uint amountShare = ISushiBar(sushiBar).balanceOf(address(this));
        ISushiBar(sushiBar).leave(amount.mul(amountShare).div(totalProductivity));
        TransferHelper.safeTransfer(collateralToken, msg.sender, amount);
        totalInvest = totalInvest.sub(amount);
        _decreaseProductivity(msg.sender, amount);
    
        uint claimAmount = users[msg.sender].rewardEarn.mul(amount).div(total);
        users[user].rewardEarn = users[user].rewardEarn.add(claimAmount);
        users[msg.sender].rewardEarn = users[msg.sender].rewardEarn.sub(claimAmount);
    }

    function exit(uint amount) external override {
        require(msg.sender == poolAddress, "INVALID CALLER");
        uint amountShare = ISushiBar(sushiBar).balanceOf(address(this));
        ISushiBar(sushiBar).leave(amount.mul(amountShare).div(totalProductivity));
        TransferHelper.safeTransfer(collateralToken, msg.sender, amount);
    }

    function _sync(address user) internal 
    {
        if(old != address(0) && users[user].initialize == false) {
            (uint amount, ) = BaseShareField(old).getProductivity(user);
            users[user].amount = amount;
            users[user].initialize = true;
        } 
    }

    function _what() public view returns(uint) {
        uint amountShare = ISushiBar(sushiBar).balanceOf(address(this));
        return amountShare.mul(IERC20(collateralToken).balanceOf(sushiBar)).div(ISushiBar(sushiBar).totalSupply()).sub(totalInvest);
    }

    function _currentReward() internal override view returns (uint) {
         return mintedShare.add(IERC20(shareToken).balanceOf(address(this))).add(_what()).sub(totalShare);
    }

    function query() external override view returns (uint){
        return _takeWithAddress(msg.sender);
    }

    function mint() external override {
        _sync(msg.sender);
        
        uint amountShare = ISushiBar(sushiBar).balanceOf(address(this));
        ISushiBar(sushiBar).leave(amountShare);
        IERC20(collateralToken).approve(sushiBar, totalProductivity);
        ISushiBar(sushiBar).enter(totalProductivity);

        uint amount = _mint(msg.sender);
        emit Mint(msg.sender, amount);
    }
}