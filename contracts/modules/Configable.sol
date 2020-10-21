// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
pragma experimental ABIEncoderV2;

interface IConfig {
    struct Params {
        uint pledgeRate;
        uint pledgePrice;
        uint liquidationRate;
        uint256 baseInterests;
        uint256 marketFrenzy;
    }
    function developer() external view returns (address);
    function platform() external view returns (address);
    function factory() external view returns (address);
    function mint() external view returns (address);
    function token() external view returns (address);
    function developPercent() external view returns (uint);
    function wallet() external view returns (address);
    function base() external view returns (address);
    function share() external view returns (address);
    function poolParams(address pool) external view returns (Params memory);
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
        require(msg.sender == owner, '7UP: OWNER FORBIDDEN');
        _;
    }
    
    modifier onlyDeveloper() {
        require(msg.sender == IConfig(config).developer(), '7UP: DEVELOPER FORBIDDEN');
        _;
    }
    
    modifier onlyPlatform() {
        require(msg.sender == IConfig(config).platform(), '7UP: PLATFORM FORBIDDEN');
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == IConfig(config).factory(), '7UP: FACTORY FORBIDDEN');
        _;
    }
}