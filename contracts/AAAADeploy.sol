// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import './modules/ConfigNames.sol';

interface IConfigable {
    function setupConfig(address config) external;
}

interface IConfig {
    function developer() external view returns (address);
    function platform() external view returns (address);
    function factory() external view returns (address);
    function mint() external view returns (address);
    function token() external view returns (address);
    function share() external view returns (address);
    function governor() external view returns (address);
    function initialize (address _platform, address _factory, address _mint, address _token, address _share, address _governor) external;
    function initParameter() external;
    function addMintToken(address _token) external;
    function setWallets(bytes32[] calldata _names, address[] calldata _wallets) external;
    function isMintToken(address _token) external view returns (bool);
    function changeDeveloper(address _developer) external;
}

interface IAAAAMint {
    function initialize() external;
    function changeBorrowPower(uint _value) external;
    function changeInterestRatePerBlock(uint value) external returns (bool);
}

interface IAAAAShare {
    function setShareToken(address _shareToken) external;
}

interface IAAAAToken {
    function initialize() external;
}

interface IAAAAFactory {
    function countPools() external view returns(uint);
    function countBallots() external view returns(uint);
    function allBallots(uint index) external view returns(address);
    function allPools(uint index) external view returns(address);
    function isPool(address addr) external view returns(bool);
    function getPool(address lend, address collateral) external view returns(address);
    function createPool(address _lendToken, address _collateralToken) external returns (address pool);
    function changeBallotByteHash(bytes32 _hash) external;
}

interface IMasterChef {
    function cake() external view returns(address);
}

interface ICakeLPStrategy {
    function initialize(address _interestToken, address _collateralToken, address _poolAddress, address _cakeMasterChef, uint _lpPoolpid) external;
}

interface ICakeLPStrategyFactory {
    function createStrategy(address _collateralToken, address _poolAddress, uint _lpPoolpid) external returns (address _strategy);
}

interface IAAAAPlatform {
    function switchStrategy(address _lendToken, address _collateralToken, address _collateralStrategy) external;
}

contract AAAADeploy {
    address public owner;
    address public config;
    address public cakeLPStrategyFactory;
    bool public cakeLPStrategyCanMint;

    modifier onlyOwner() {
        require(msg.sender == owner, 'OWNER FORBIDDEN');
        _;
    }
 
    constructor() public {
        owner = msg.sender;
    }
    
    function setupConfig(address _config) onlyOwner external {
        require(_config != address(0), "ZERO ADDRESS");
        config = _config;
    }

    function changeDeveloper(address _developer) onlyOwner external {
        IConfig(config).changeDeveloper(_developer);
    }
    
    function setCakeMasterchef(address _cakeLPStrategyFactory, bool _cakeLPStrategyCanMint) onlyOwner external {
        cakeLPStrategyFactory = _cakeLPStrategyFactory;
        cakeLPStrategyCanMint = _cakeLPStrategyCanMint;
    }

    function initialize() onlyOwner public {
        require(config != address(0), "ZERO ADDRESS");
        IAAAAMint(IConfig(config).mint()).initialize();
        IAAAAToken(IConfig(config).token()).initialize();
    }

    function createPoolForCake(address _lendToken, address _collateralToken, uint _lpPoolpid) onlyOwner public {
        if(cakeLPStrategyCanMint) {
            require(IConfig(config).isMintToken(_lendToken), 'REQUEST ADD MINT TOKEN FIRST');
        }
        address pool = IAAAAFactory(IConfig(config).factory()).createPool(_lendToken, _collateralToken);
        address strategy = ICakeLPStrategyFactory(cakeLPStrategyFactory).createStrategy(_collateralToken, pool, _lpPoolpid);
        IAAAAPlatform(IConfig(config).platform()).switchStrategy(_lendToken, _collateralToken, strategy);
    }

    function changeBallotByteHash(bytes32 _hash) onlyOwner external {
        IAAAAFactory(IConfig(config).factory()).changeBallotByteHash(_hash);
    }

    function addMintToken(address _token) onlyOwner external {
        IConfig(config).addMintToken(_token);
    }

  }