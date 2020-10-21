// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

contract SevenUpConfig {
    address public factory;
    address public platform;
    address public developer;
    address public mint;
    address public token;
    address public wallet;
    address public base;
    address public share;
    
    uint public developPercent = 5000;
    
    struct Params {
        uint pledgeRate;
        uint pledgePrice;
        uint liquidationRate;
        uint256 baseInterests;
        uint256 marketFrenzy;
    }
    
    mapping (address => Params) poolParams;
    
    constructor() public {
        developer = msg.sender;
    }
    
    function initialize (address _platform, address _factory, address _wallet, address _mint, address _token, address _base, address _share) external {
        require(msg.sender == developer, "Config FORBIDDEN");
        wallet = _wallet;
        mint = _mint;
        platform = _platform;
        factory = _factory;
        token = _token;
        base = _base;
        share = _share;
    }
    
    function setDevelopPercent(uint _value) external {
        require(msg.sender == developer, "Config FORBIDDEN");
        require(_value <= 10000, "CONFIG INVALID VALUE");
        developPercent = _value;
    }
    
    function setPoolParams(address _pool, uint _pledgeRate, uint _pledgePrice, uint _liquidationRate, uint _baseInterests, uint _marketFrenzy) external {
        require(msg.sender == developer, "Config FORBIDDEN");
        poolParams[_pool] = Params(_pledgeRate, _pledgePrice, _liquidationRate, _baseInterests, _marketFrenzy);
    }
}