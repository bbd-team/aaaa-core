// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

interface IConfig {
    function developer() external view returns (address);
    function platform() external view returns (address);
    function factory() external view returns (address);
    function mint() external view returns (address);
    function token() external view returns (address);
    function developPercent() external view returns (uint);
    function wallet() external view returns (address);
}

contract Configable {
    address public config;
    address public owner;

    event OwnerChanged(address indexed _oldOwner, address indexed _newOwner);

    constructor() public {
        owner = msg.sender;
    }
    
    function setupConfig(address _config) external onlyOwner {
        config = _config;
        owner = IConfig(config).developer();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'OWNER FORBIDDEN');
        _;
    }
    
    modifier onlyDeveloper() {
        require(msg.sender == IConfig(config).developer(), 'DEVELOPER FORBIDDEN');
        _;
    }
    
    modifier onlyPlatform() {
        require(msg.sender == IConfig(config).platform(), 'PLATFORM FORBIDDEN');
        _;
    }
}