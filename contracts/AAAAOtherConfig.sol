// SPDX-License-Identifier: MIT
pragma solidity >=0.5.16;
import "./modules/Ownable.sol";

contract AAAAOtherConfig is Ownable {
    mapping(address=>bool) public isToken;

    function setToken(address _token, bool _value) onlyOwner external {
        isToken[_token] = _value;
    }

}