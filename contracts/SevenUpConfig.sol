// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import "./modules/Configable.sol";

contract SevenUpConfig is Configable {
    address public factory;
    address public platform;
    address public developer;
    address public mint1;
    address public mint2;
    address public token;
    address public wallet;
    
    uint public developPercent = 5000;
    
    constructor() public {
        developer = msg.sender;
    }
    
    function initialize (address _platform, address _factory, address _wallet, address _mint1, address _mint2, address _token) external onlyDeveloper {
        require(msg.sender == developer, "Config FORBIDDEN");
        _wallet = wallet;
        _mint1 = mint1;
        _mint2 = mint2;
        platform = _platform;
        factory = _factory;
        _token = token;
    }
    
    function setDevelopPercent(uint _value) external onlyDeveloper {
        require(_value <= 10000, "CONFIG INVALID VALUE");
        developPercent = _value;
    }
}