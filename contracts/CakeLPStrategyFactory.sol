// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;

import './CakeLPStrategy.sol';


interface ICakeLPStrategy {
    function initialize(address _interestToken, address _collateralToken, address _poolAddress, address _cakeMasterChef, uint _lpPoolpid) external;
}

contract CakeLPStrategyFactory  {
    address public owner;
    address public masterchef;
    address[] public strategies;

    event StrategyCreated(address indexed _strategy, address indexed _collateralToken, address indexed _poolAddress, uint _lpPoolpid);

    constructor(address _masterchef) public {
        owner = msg.sender;
        masterchef = _masterchef;
    }

    function createStrategy(address _collateralToken, address _poolAddress, uint _lpPoolpid) external returns (address _strategy) {
        require(msg.sender == owner, 'OWNER FORBIDDEN');
        bytes memory bytecode = type(CakeLPStrategy).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_collateralToken, _poolAddress, _lpPoolpid, block.number));
        assembly {
            _strategy := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        address _interestToken = IMasterChef(masterchef).cake();
        ICakeLPStrategy(_strategy).initialize(_interestToken, _collateralToken, _poolAddress, masterchef, _lpPoolpid);
        emit StrategyCreated(_strategy, _collateralToken, _poolAddress, _lpPoolpid);
        strategies.push(_strategy);
        return _strategy;
    }

    function countStrategy() external view returns(uint) {
        return strategies.length;
    }

}
