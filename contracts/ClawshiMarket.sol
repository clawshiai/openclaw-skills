// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ClawshiMarket {
    address public owner;
    IERC20 public usdc;

    struct Market {
        uint256 clawshiId;
        string question;
        uint256 deadline;
        uint256 yesPool;
        uint256 noPool;
        bool resolved;
        bool outcome; // true = YES, false = NO
    }

    Market[] public markets;

    // marketIndex => user => amount
    mapping(uint256 => mapping(address => uint256)) public yesStakes;
    mapping(uint256 => mapping(address => uint256)) public noStakes;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event MarketCreated(uint256 indexed marketIndex, uint256 clawshiId, string question, uint256 deadline);
    event Staked(uint256 indexed marketIndex, address indexed user, bool isYes, uint256 amount);
    event MarketResolved(uint256 indexed marketIndex, bool outcome);
    event Claimed(uint256 indexed marketIndex, address indexed user, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    function createMarket(
        uint256 _clawshiId,
        string calldata _question,
        uint256 _deadline
    ) external onlyOwner returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in future");

        markets.push(Market({
            clawshiId: _clawshiId,
            question: _question,
            deadline: _deadline,
            yesPool: 0,
            noPool: 0,
            resolved: false,
            outcome: false
        }));

        uint256 idx = markets.length - 1;
        emit MarketCreated(idx, _clawshiId, _question, _deadline);
        return idx;
    }

    function stake(uint256 _marketIndex, bool _isYes, uint256 _amount) external {
        require(_marketIndex < markets.length, "Invalid market");
        Market storage m = markets[_marketIndex];
        require(!m.resolved, "Market resolved");
        require(block.timestamp < m.deadline, "Market closed");
        require(_amount > 0, "Amount must be > 0");

        require(usdc.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");

        if (_isYes) {
            yesStakes[_marketIndex][msg.sender] += _amount;
            m.yesPool += _amount;
        } else {
            noStakes[_marketIndex][msg.sender] += _amount;
            m.noPool += _amount;
        }

        emit Staked(_marketIndex, msg.sender, _isYes, _amount);
    }

    function resolve(uint256 _marketIndex, bool _outcomeIsYes) external onlyOwner {
        require(_marketIndex < markets.length, "Invalid market");
        Market storage m = markets[_marketIndex];
        require(!m.resolved, "Already resolved");

        m.resolved = true;
        m.outcome = _outcomeIsYes;

        emit MarketResolved(_marketIndex, _outcomeIsYes);
    }

    function claim(uint256 _marketIndex) external {
        require(_marketIndex < markets.length, "Invalid market");
        Market storage m = markets[_marketIndex];
        require(m.resolved, "Not resolved yet");
        require(!claimed[_marketIndex][msg.sender], "Already claimed");

        uint256 payout = 0;
        uint256 totalPot = m.yesPool + m.noPool;

        if (m.outcome && yesStakes[_marketIndex][msg.sender] > 0) {
            uint256 userStake = yesStakes[_marketIndex][msg.sender];
            payout = (userStake * totalPot) / m.yesPool;
        } else if (!m.outcome && noStakes[_marketIndex][msg.sender] > 0) {
            uint256 userStake = noStakes[_marketIndex][msg.sender];
            payout = (userStake * totalPot) / m.noPool;
        }

        require(payout > 0, "No winnings");
        claimed[_marketIndex][msg.sender] = true;

        require(usdc.transfer(msg.sender, payout), "USDC payout failed");
        emit Claimed(_marketIndex, msg.sender, payout);
    }

    function getMarket(uint256 _marketIndex) external view returns (
        uint256 clawshiId,
        string memory question,
        uint256 deadline,
        uint256 yesPool,
        uint256 noPool,
        bool resolved,
        bool outcome
    ) {
        require(_marketIndex < markets.length, "Invalid market");
        Market storage m = markets[_marketIndex];
        return (m.clawshiId, m.question, m.deadline, m.yesPool, m.noPool, m.resolved, m.outcome);
    }

    function getStake(uint256 _marketIndex, address _user) external view returns (
        uint256 yesAmount,
        uint256 noAmount
    ) {
        return (yesStakes[_marketIndex][_user], noStakes[_marketIndex][_user]);
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
