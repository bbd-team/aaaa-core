//SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IWasabi {
    function getOffer(address  _lpToken,  uint index) external view returns (address offer);
    function getOfferLength(address _lpToken) external view returns (uint length);
    function pool(address _token) external view returns (uint);
    function increaseProductivity(uint amount) external;
    function decreaseProductivity(uint amount) external;
    function decreaseProductivityAll() external;
    function tokenAddress() external view returns(address);
    function addTakerOffer(address _offer, address _user) external returns (uint);
    function getUserOffer(address _user, uint _index) external view returns (address);
    function getUserOffersLength(address _user) external view returns (uint length);
    function getTakerOffer(address _user, uint _index) external view returns (address);
    function getTakerOffersLength(address _user) external view returns (uint length);
    function offerStatus() external view returns(uint amountIn, address masterChef, uint sushiPid);
    function cancel(address _from, address _sushi, uint amountWasabi) external ;
    function take(address taker,uint amountWasabi) external;
    function payback(address _from) external;
    function close(address _from, uint8 _state, address _sushi) external  returns (address tokenToOwner, address tokenToTaker, uint amountToOwner, uint amountToTaker);
    function upgradeGovernance(address _newGovernor) external;
    function acceptToken() external view returns(address);
    function rewardAddress() external view returns(address);
    function getTokensLength() external view returns (uint);
    function tokens(uint _index) external view returns(address);
    function offers(address _offer) external view returns(address tokenIn, address tokenOut, uint amountIn, uint amountOut, uint expire, uint interests, uint duration);
    function getRateForOffer(address _offer) external view returns (uint offerFeeRate, uint offerInterestrate);
}
