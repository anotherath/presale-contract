// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import './IERC20.sol';
import './Ownable.sol';

contract MewToken is IERC20, Ownable {
    uint   public totalSupply;
    string public name;
    string public symbol;
    uint8  public decimals;

    mapping(address => uint)                     public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    constructor() {
        name        = "Mew Token";
        symbol      = "MEW";
        decimals    = 18;
        totalSupply = 1000_000_000 * 10 ** 18;

        balanceOf[msg.sender] = totalSupply;
    }

    function approve(address spender, uint amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return(true);
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return(true);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint    amount
    ) external returns (bool) {
        uint256 currentAllowance = allowance[sender][msg.sender];
        require(currentAllowance >= amount, "MewToken: transfer amount exceeds allowance");

        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);

        return(true);
    }

    function _transfer(
        address sender,
        address spender,
        uint    amount
    ) private {
        require(sender != address(0), "MewToken: transfer from the zero address");
        require(spender != address(0), "MewToken: transfer to the zero address");

        uint256 senderBalance = balanceOf[sender];
        require(senderBalance >= amount, "MewToken: transfer amount exceeds balance");

        balanceOf[sender] -= amount;
        balanceOf[spender] += amount;

        emit Transfer(sender, spender, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint    amount
    ) private {
        require(owner != address(0), "MewToken: approve from the zero address");
        require(spender != address(0), "MewToken: approve to the zero address");

        allowance[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
