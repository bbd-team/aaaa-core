// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./libraries/SafeMath.sol";
import './modules/ConfigNames.sol';

interface IERC20 {
    function balanceOf(address owner) external view returns (uint);
}

interface IAAAAPool {
    function collateralToken() external view returns(address);
}

contract AAAAConfig {
    using SafeMath for uint;
    address public factory;
    address public platform;
    address public developer;
    address public mint;
    address public token;
    address public share;
    address public governor;

    address[] public mintTokenList;

    uint public lastPriceBlock;

    uint constant public DAY = 28800;
    uint constant public HOUR = 1200;
    
    struct ConfigItem {
        uint min;
        uint max;
        uint span;
        uint value;
    }
    
    mapping (address => mapping (bytes32 => ConfigItem)) public poolParams;
    mapping (bytes32 => ConfigItem) public params;
    mapping (bytes32 => address) public wallets;

    event ParameterChange(bytes32 key, uint value);
    event PoolParameterChange(address pool, bytes32 key, uint value);
    
    constructor() public {
        developer = msg.sender;
    }
    
    function initialize (address _platform, address _factory, address _mint, address _token, address _share, address _governor) external {
        require(msg.sender == developer, "AAAA: Config FORBIDDEN");
        mint        = _mint;
        platform    = _platform;
        factory     = _factory;
        token       = _token;
        share       = _share;
        governor    = _governor;
    }

    function addMintToken(address _token) external {
        require(msg.sender == developer, "AAAA: Config FORBIDDEN");
        mintTokenList.push(_token);
    }

    function isMintToken(address _token) public view returns (bool)  {
        for(uint i = 0;i < mintTokenList.length;i++) {
            if(_token == mintTokenList[i]) {
                return true;
            }
        }
        return false;
    }


    function changeDeveloper(address _developer) external {
        require(msg.sender == developer, "AAAA: Config FORBIDDEN");
        developer = _developer;
    }

    function setWallets(bytes32[] calldata _names, address[] calldata _wallets) external {
        require(msg.sender == developer, "AAAA: ONLY DEVELOPER");
        require(_names.length == _wallets.length ,"AAAA: WALLETS LENGTH MISMATCH");
        for(uint i = 0; i < _names.length; i ++)
        {
            wallets[_names[i]] = _wallets[i];
        }
    }

    function initParameter() external {
        require(msg.sender == developer, "AAAA: Config FORBIDDEN");
        _setParams(ConfigNames.PROPOSAL_VOTE_DURATION ,   1*DAY,  7*DAY , 1*DAY,  1*DAY);
        _setParams(ConfigNames.PROPOSAL_EXECUTE_DURATION, 1*HOUR, 48*HOUR, 1*HOUR, 1*HOUR);
        _setParams(ConfigNames.PROPOSAL_CREATE_COST, 0, 10000 * 1e18, 100 * 1e18, 0);
        _setParams(ConfigNames.STAKE_LOCK_TIME, 0, 7*DAY, 1*DAY, 0);
        _setParams(ConfigNames.MINT_AMOUNT_PER_BLOCK, 0, 10000 * 1e18, 1e17, 1e17);
        _setParams(ConfigNames.INTEREST_PLATFORM_SHARE, 0, 1e18, 1e17, 1e17);
        _setParams(ConfigNames.INTEREST_BUYBACK_SHARE, 10000, 10000, 0, 10000);
        _setParams(ConfigNames.CHANGE_PRICE_DURATION, 100, 500, 100, 500);
        _setParams(ConfigNames.CHANGE_PRICE_PERCENT, 1, 100, 1, 20);
        _setParams(ConfigNames.MINT_BORROW_PERCENT, 0, 10000, 1000, 5000);

        _setParams(ConfigNames.AAAA_MAX_SUPPLY, 0, 0, 0, 10000 * 1e18);
        _setParams(ConfigNames.AAAA_USER_MINT, 0, 0, 0, 3000);
        _setParams(ConfigNames.AAAA_TEAM_MINT, 0, 0, 0, 7142);
        _setParams(ConfigNames.AAAA_REWAED_MINT, 0, 0, 0, 5000);
        _setParams(ConfigNames.DEPOSIT_ENABLE, 0, 0, 0, 1);
        _setParams(ConfigNames.WITHDRAW_ENABLE, 0, 0, 0, 1);
        _setParams(ConfigNames.BORROW_ENABLE, 0, 0, 0, 1);
        _setParams(ConfigNames.REPAY_ENABLE, 0, 0, 0, 1);
        _setParams(ConfigNames.LIQUIDATION_ENABLE, 0, 0, 0, 1);
        _setParams(ConfigNames.REINVEST_ENABLE, 0, 0, 0, 1);
    }

    function initPoolParams(address _pool) external {
        require(msg.sender == factory, "Config FORBIDDEN");
        _setPoolParams(_pool, ConfigNames.POOL_BASE_INTERESTS, 0, 1e18, 1e16, 2e17);
        _setPoolParams(_pool, ConfigNames.POOL_MARKET_FRENZY, 0, 1e18, 1e16, 2e17);
        _setPoolParams(_pool, ConfigNames.POOL_PLEDGE_RATE, 0, 1e18, 1e16, 6e17);
        _setPoolParams(_pool, ConfigNames.POOL_PRICE, 0, 0, 0, 2e16);
        _setPoolParams(_pool, ConfigNames.POOL_LIQUIDATION_RATE, 0, 1e18, 1e16, 9e17);
    }

    function _setPoolValue(address _pool, bytes32 _key, uint _value) internal {
        poolParams[_pool][_key].value = _value;
        emit PoolParameterChange(_pool, _key, _value);
    }

    function _setParams(bytes32 _key, uint _min, uint _max, uint _span, uint _value) internal {
        params[_key] = ConfigItem(_min, _max, _span, _value);
        emit ParameterChange(_key, _value);
    }

    function _setPoolParams(address _pool, bytes32 _key, uint _min, uint _max, uint _span, uint _value) internal {
        poolParams[_pool][_key] = ConfigItem(_min, _max, _span, _value);
        emit PoolParameterChange(_pool, _key, _value);
    }

    function setPoolPrice(address[] calldata _pools, uint[] calldata _prices) external {
        uint duration = params[ConfigNames.CHANGE_PRICE_DURATION].value;
        uint maxPercent = params[ConfigNames.CHANGE_PRICE_PERCENT].value;
        require(block.number >= lastPriceBlock.add(duration), "AAAA: Price Duration");
        require(msg.sender == wallets[bytes32("price")], "AAAA: Config FORBIDDEN");
        require(_pools.length == _prices.length ,"AAAA: PRICES LENGTH MISMATCH");

        for(uint i = 0; i < _pools.length; i++)
        {
            address cToken = IAAAAPool(_pools[i]).collateralToken();
            uint balance = IERC20(cToken).balanceOf(_pools[i]);
            if(balance == 0) {
                _setPoolValue(_pools[i], ConfigNames.POOL_PRICE, _prices[i]);
            } else {
                uint currentPrice = poolParams[_pools[i]][ConfigNames.POOL_PRICE].value;
                if(_prices[i] > currentPrice) {
                    uint maxPrice = currentPrice.add(currentPrice.mul(maxPercent).div(10000));
                    _setPoolValue(_pools[i], ConfigNames.POOL_PRICE, _prices[i] > maxPrice ? maxPrice: _prices[i]);
                    poolParams[_pools[i]][ConfigNames.POOL_PRICE].value = _prices[i] > maxPrice ? maxPrice: _prices[i];
                } else {
                    uint minPrice = currentPrice.sub(currentPrice.mul(maxPercent).div(10000));
                    _setPoolValue(_pools[i], ConfigNames.POOL_PRICE, _prices[i] < minPrice ? minPrice: _prices[i]);
                }
            } 
        }

        lastPriceBlock = block.number;
    }
    
    function setValue(bytes32 _key, uint _value) external {
        require(msg.sender == governor || msg.sender == platform || msg.sender == developer, "AAAA: ONLY DEVELOPER");
        params[_key].value = _value;
        emit ParameterChange(_key, _value);
    }
    
    function setPoolValue(address _pool, bytes32 _key, uint _value) external {
        require(msg.sender == governor || msg.sender == platform || msg.sender == developer, "AAAA: FORBIDDEN");
        _setPoolValue(_pool, _key, _value);
    }
    
    function getValue(bytes32 _key) external view returns (uint){
        return params[_key].value;
    }
    
    function getPoolValue(address _pool, bytes32 _key) external view returns (uint) {
        return poolParams[_pool][_key].value;
    } 

    function setParams(bytes32 _key, uint _min, uint _max, uint _span, uint _value) external {
        require(msg.sender == governor || msg.sender == platform || msg.sender == developer, "AAAA: FORBIDDEN");
        _setParams(_key, _min, _max, _span, _value);
    }

    function setPoolParams(address _pool, bytes32 _key, uint _min, uint _max, uint _span, uint _value) external {
        require(msg.sender == governor || msg.sender == platform || msg.sender == developer, "AAAA: FORBIDDEN");
        _setPoolParams(_pool, _key, _min, _max, _span, _value);
    }

    function getParams(bytes32 _key) external view returns (uint, uint, uint, uint) {
        ConfigItem memory item = params[_key];
        return (item.min, item.max, item.span, item.value);
    }

    function getPoolParams(address _pool, bytes32 _key) external view returns (uint, uint, uint, uint) {
        ConfigItem memory item = poolParams[_pool][_key];
        return (item.min, item.max, item.span, item.value);
    }
}