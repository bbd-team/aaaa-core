//SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IWasabiToken {
    function mint(address to) external returns (uint);
    function increaseProductivity(address user, uint value) external returns (uint);
    function decreaseProductivity(address user, uint value) external returns (uint);
}