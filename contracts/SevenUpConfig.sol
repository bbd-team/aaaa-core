// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import "./modules/Configable.sol";

contract SevenUpConfig is Configable {
    address public factory;
    address public platform;
    address public developer;
    address public mint;
    address public token;
    address public wallet;
    address public base;
    
    uint public developPercent = 5000;
    
    constructor() public {
        developer = msg.sender;
    }
    
    function initialize (address _platform, address _factory, address _wallet, address _mint, address _token, address _base) external onlyDeveloper {
        require(msg.sender == developer, "Config FORBIDDEN");
        wallet = _wallet;
        mint = _mint;
        platform = _platform;
        factory = _factory;
        token = _token;
        base = _base;
    }
    
    function setDevelopPercent(uint _value) external onlyDeveloper {
        require(_value <= 10000, "CONFIG INVALID VALUE");
        developPercent = _value;
    }
}