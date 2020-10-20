//SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IWasabiOffer {
    function tokenIn() external view returns (address);
    function tokenOut() external view returns (address);
    function amountIn() external view returns (uint);
    function amountOut() external view returns (uint);
    function expire() external view returns (uint);
    function interests() external view returns (uint);
    function duration() external view returns (uint);
    function owner() external view returns (address);
    function taker() external view returns (address);
    function state() external view returns (uint);
    function pool() external view returns (address);
    function getEstimatedWasabi() external view returns(uint amount);
    function getEstimatedSushi() external view returns(uint amount);
}
