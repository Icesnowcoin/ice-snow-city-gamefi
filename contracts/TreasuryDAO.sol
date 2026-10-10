// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TreasuryDAO
 * @dev 冰雪城市国库 DAO 管理合约
 * 管理国库资金（如 69% 铸造收益与 10% 交易佣金），支持提案、投票与资金安全划拨。
 * 国库永久地址：0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TreasuryDAO is Ownable, ReentrancyGuard {
    // ISC 代币接口
    IERC20 public immutable iscToken;

    // 国库官方地址
    address public constant TREASURY_ADDRESS = 0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019;

    // 提案结构
    struct Proposal {
        uint256 id;
        address proposer;
        address recipient;
        uint256 amount;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    // 提案列表与计数器
    uint256 private proposalCounter;
    mapping(uint256 => Proposal) public proposals;

    // 投票权重/治理成员映射
    mapping(address => bool) public isGovernor;
    uint256 public governorCount;

    // 投票配置
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM_THRESHOLD = 3; // 至少需要 3 票通过

    // 事件
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address recipient,
        uint256 amount,
        string description,
        uint256 endTime
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount);
    event ProposalCanceled(uint256 indexed proposalId);
    event GovernorUpdated(address indexed governor, bool status);

    modifier onlyGovernor() {
        require(isGovernor[msg.sender] || msg.sender == owner(), "Only governor can call");
        _;
    }

    constructor(address _iscToken, address[] memory initialGovernors) {
        require(_iscToken != address(0), "Invalid ISC token address");
        iscToken = IERC20(_iscToken);

        // 设置部署者为初始管理员
        isGovernor[msg.sender] = true;
        governorCount = 1;

        for (uint256 i = 0; i < initialGovernors.length; i++) {
            if (initialGovernors[i] != address(0) && !isGovernor[initialGovernors[i]]) {
                isGovernor[initialGovernors[i]] = true;
                governorCount++;
                emit GovernorUpdated(initialGovernors[i], true);
            }
        }
    }

    /**
     * @dev 添加或移除治理成员
     */
    external onlyOwner {
        // syntax helper
    }

    function setGovernor(address governor, bool status) external onlyOwner {
        require(governor != address(0), "Invalid address");
        if (isGovernor[governor] != status) {
            isGovernor[governor] = status;
            if (status) {
                governorCount++;
            } else {
                governorCount = governorCount > 0 ? governorCount - 1 : 0;
            }
            emit GovernorUpdated(governor, status);
        }
    }

    /**
     * @dev 创建国库资金支出提案
     */
    function createProposal(
        address recipient,
        uint256 amount,
        string calldata description
    ) external onlyGovernor returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(iscToken.balanceOf(address(this)) >= amount || iscToken.balanceOf(TREASURY_ADDRESS) >= amount, "Insufficient treasury funds");

        uint256 proposalId = proposalCounter++;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.recipient = recipient;
        p.amount = amount;
        p.description = description;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + VOTING_PERIOD;
        p.yesVotes = 0;
        p.noVotes = 0;
        p.executed = false;
        p.canceled = false;

        emit ProposalCreated(proposalId, msg.sender, recipient, amount, description, p.endTime);
        return proposalId;
    }

    /**
     * @dev 对提案进行投票
     */
    function vote(uint256 proposalId, bool support) external onlyGovernor {
        Proposal storage p = proposals[proposalId];
        require(p.startTime > 0, "Proposal does not exist");
        require(block.timestamp <= p.endTime, "Voting has ended");
        require(!p.executed, "Proposal already executed");
        require(!p.canceled, "Proposal was canceled");
        require(!p.hasVoted[msg.sender], "Already voted");

        p.hasVoted[msg.sender] = true;
        if (support) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }

        emit Voted(proposalId, msg.sender, support, 1);
    }

    /**
     * @dev 执行已通过的提案
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.startTime > 0, "Proposal does not exist");
        require(block.timestamp > p.endTime, "Voting still in progress");
        require(!p.executed, "Proposal already executed");
        require(!p.canceled, "Proposal was canceled");
        require(p.yesVotes >= QUORUM_THRESHOLD, "Quorum not reached");
        require(p.yesVotes > p.noVotes, "Proposal rejected");

        p.executed = true;

        // 如果资金在 DAO 合约中直接转账，否则从国库地址转出
        if (iscToken.balanceOf(address(this)) >= p.amount) {
            require(iscToken.transfer(p.recipient, p.amount), "Treasury transfer failed");
        } else {
            require(iscToken.transferFrom(TREASURY_ADDRESS, p.recipient, p.amount), "Treasury allowance transfer failed");
        }

        emit ProposalExecuted(proposalId, p.recipient, p.amount);
    }

    /**
     * @dev 获取国库当前 ISC 余额
     */
    function getTreasuryBalance() external view returns (uint256) {
        return iscToken.balanceOf(address(this)) + iscToken.balanceOf(TREASURY_ADDRESS);
    }
}
