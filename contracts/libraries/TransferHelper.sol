//SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

library SushiHelper {
    function deposit(address masterChef, uint256 pid, uint256 amount) internal {
        (bool success, bytes memory data) = masterChef.call(abi.encodeWithSelector(0xe2bbb158, pid, amount));
        require(success && data.length == 0, "SushiHelper: DEPOSIT FAILED");
    }

    function withdraw(address masterChef, uint256 pid, uint256 amount) internal {
        (bool success, bytes memory data) = masterChef.call(abi.encodeWithSelector(0x441a3e70, pid, amount));
        require(success && data.length == 0, "SushiHelper: WITHDRAW FAILED");
    }

    function pendingSushi(address masterChef, uint256 pid, address user) internal returns (uint256 amount) {
        (bool success, bytes memory data) = masterChef.call(abi.encodeWithSelector(0x195426ec, pid, user));
        require(success && data.length != 0, "SushiHelper: WITHDRAW FAILED");
        amount = abi.decode(data, (uint256));
    }

    uint public constant _nullID = 0xffffffffffffffffffffffffffffffff;
    function nullID() internal pure returns(uint) {
        return _nullID;
    }
}


library TransferHelper {
    function safeApprove(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: APPROVE_FAILED');
    }

    function safeTransfer(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferFrom(address token, address from, address to, uint value) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    }

    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call{value:value}(new bytes(0));
        require(success, 'TransferHelper: ETH_TRANSFER_FAILED');
    }
}
