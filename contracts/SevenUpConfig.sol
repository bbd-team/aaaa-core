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
    address public governor;
    
    uint public developPercent = 5000;
    
    mapping (address => mapping (bytes32 => uint)) public poolParams;
    mapping (uint => uint) public params;

    event ParameterChange(uint key, uint value);
    
    constructor() public {
        developer = msg.sender;
    }
    
    function initialize (address _platform, address _factory, address _wallet, address _mint, address _token, address _base, address _share, address _governor) external {
        require(msg.sender == developer, "Config FORBIDDEN");
        wallet      = _wallet;
        mint        = _mint;
        platform    = _platform;
        factory     = _factory;
        token       = _token;
        base        = _base;
        share       = _share;
        governor    = _governor;
    }
    
    function setDevelopPercent(uint _value) external {
        require(msg.sender == governor, "Config FORBIDDEN");
        require(_value <= 10000, "CONFIG INVALID VALUE");
        developPercent = _value;
    }

    function setParameter(uint[] calldata _keys, uint[] calldata _values) external
    {
        require(msg.sender == governor, "7UP: ONLY DEVELOPER");
        require(_keys.length == _values.length ,"7UP: LENGTH MISMATCH");
        for(uint i = 0; i < _keys.length; i ++)
        {
            params[_keys[i]] = _values[i];
        }
    }
    
    function setPoolParameter(address _pool, bytes32 _key, uint _value) external {
        require(msg.sender == governor || msg.sender == _pool || msg.sender == platform, "7UP: FORBIDDEN");
        poolParams[_pool][_key] = _value;
    }
}