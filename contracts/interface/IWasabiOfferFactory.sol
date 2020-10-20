//SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IWasabiOfferFactory {

    function create(
        address[4] calldata addresses, 
        uint[4] calldata values
    ) external returns (address offerAddr, uint productivity);
}