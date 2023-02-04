// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import './IERC20.sol';
import './Ownable.sol';

contract PreSale is Ownable {
    IERC20 public tokenPreSale;

    uint public totalTokenPreSale;
    uint public maxAmountTokenCanBuy;
    uint public minAmountTokenCanBuy;

    uint public openSaleTime;
    uint public endSaleTime;

    uint public pricePerToken;

    mapping(address => uint) public amountTokenBoughtOf;
    mapping(address => unlockInfo[]) public unlockInfoOf;

    event Buy      (address buyer,     uint amountTokenBuy);
    event Claim    (address claimer,   uint amountTokenClaim );
    event Withdraw (address owner,     uint amountWithdraw );

    struct unlockInfo {
        uint claimTime;
        uint tokenUnlockPercent;
        bool claimed;
    }

    unlockInfo[] public unlockInfos;

    constructor(
        address _tokenPreSale,
        uint _pricePerToken,
        uint _maxAmountTokenCanBuy,
        uint _minAmountTokenCanBuy,
        uint _openSaleTime,
        uint _endSaleTime

    ) {
        tokenPreSale = IERC20(_tokenPreSale);
        pricePerToken = _pricePerToken;
        maxAmountTokenCanBuy = _maxAmountTokenCanBuy;
        minAmountTokenCanBuy = _minAmountTokenCanBuy;
        openSaleTime = _openSaleTime;
        endSaleTime = _endSaleTime;
        _initClaimTime();
    }

    fallback() external payable {}
    receive() external payable {}


    function updateTotalTokenPreSale(
        uint _totalTokenPreSale
    ) external onlyOwner returns (bool) {
        require(block.timestamp < openSaleTime, "PreSale: update after openSaleTime");
        require(_totalTokenPreSale > 0, "PreSale: _totalTokenPreSale is zero");
        require(_totalTokenPreSale <= tokenPreSale.totalSupply(), "PreSale: _totalTokenPreSale > totalSupply token");
        
        tokenPreSale.transferFrom(msg.sender, address(this), _totalTokenPreSale);
        _updateTotalTokenPreSale(_totalTokenPreSale);

        return(true);
    }

    function withDraw() external onlyOwner returns (bool) {
        require(block.timestamp >= endSaleTime, "PreSale: withDraw before endSaleTime");

        address payable to =  payable(msg.sender);
        to.transfer(address(this).balance);

        emit Withdraw(msg.sender, address(this).balance);
        return(true);
    }

    function buy() external payable returns (bool) {
        require(block.timestamp >= openSaleTime, "PreSale: buy before openSaleTime");
        require(block.timestamp < endSaleTime, "PreSale: buy after endSaleTime");
        require(totalTokenPreSale > 0, "PreSale: totalTokenPreSale is zero");
        require(msg.value > 0, "PreSale: msg.sender is zero");

        uint amountTokenWillBuy = (msg.value/pricePerToken)*(10**18);
        require(amountTokenWillBuy <= totalTokenPreSale, "PreSale: amountTokenWillBuy > totalTokenPreSale");

        uint amountTokenBuy = amountTokenBoughtOf[msg.sender] + amountTokenWillBuy;
        require(amountTokenBuy <= maxAmountTokenCanBuy, "PreSale: amountTokenBuy > maxAmountTokenCanBuy");
        require(amountTokenWillBuy >= minAmountTokenCanBuy, "PreSale: amountTokenWillBuy < minAmountTokenCanBuy");


        amountTokenBoughtOf[msg.sender] = amountTokenBuy;
        totalTokenPreSale -= amountTokenWillBuy;

        unlockInfoOf[msg.sender] = unlockInfos;

        emit Buy(msg.sender, amountTokenWillBuy);

        return(true);
    }

    function claim() external returns (bool) {
        require(block.timestamp >= endSaleTime, "PreSale: claim before endSaleTime");
        require(amountTokenBoughtOf[msg.sender] > 0, "PreSale: amountTokenBoughtOf[msg.sender] is zero");

        uint claimAmountPercent = 0;
        uint currentTime = block.timestamp;

        unlockInfo[] storage infos = unlockInfoOf[msg.sender];

        for(uint index = 0; index < infos.length; index++){
            unlockInfo storage info = infos[index];
            if (info.claimed == false && info.claimTime <= currentTime) {
                claimAmountPercent += info.tokenUnlockPercent;
                info.claimed = true;
            }
        }

        require(claimAmountPercent > 0, "PreSale: claimAmountPercent is zero");
        uint amountClaim = (amountTokenBoughtOf[msg.sender]/100)*claimAmountPercent;
        tokenPreSale.transfer(msg.sender, amountClaim);

        return(true);
    }

    function _updateTotalTokenPreSale(
        uint _totalTokenPreSale
    )  private {
        totalTokenPreSale += _totalTokenPreSale;
    }

    function _initClaimTime() private {

        unlockInfo memory _02Mar2023_8pm = unlockInfo(1677762000, 50, false);
        unlockInfo memory _02Apr2023_8pm = unlockInfo(1680440400, 10, false);
        unlockInfo memory _02May2023_8pm = unlockInfo(1683032400, 10, false);
        unlockInfo memory _02Jun2023_8pm = unlockInfo(1685710800, 10, false);
        unlockInfo memory _02Jul2023_8pm = unlockInfo(1688302800, 10, false);
        unlockInfo memory _02Aug2023_8pm = unlockInfo(1690894800, 10, false);

        unlockInfos.push(_02Aug2023_8pm);
        unlockInfos.push(_02Mar2023_8pm);
        unlockInfos.push(_02Apr2023_8pm);
        unlockInfos.push(_02May2023_8pm);
        unlockInfos.push(_02Jun2023_8pm);
        unlockInfos.push(_02Jul2023_8pm);
    }
}