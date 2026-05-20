// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice AI Matchmaker Ajanlarının on-chain kaydı.
 *         Her ajan bir Circle cüzdanına sahiptir ve otonom USDC bless yetkisi vardır.
 *         Arc Testnet üzerinde deploy edilecek.
 */
contract AgentRegistry is Ownable {
    struct AgentInfo {
        address walletAddress;
        string name;
        string criteria; // JSON string — kategori, max tutarlar vs.
        bool active;
        uint256 createdAt;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => AgentInfo) public agents;
    mapping(address => uint256) public walletToAgent;

    event AgentRegistered(uint256 indexed agentId, address indexed wallet, string name);
    event AgentDeactivated(uint256 indexed agentId);
    event AgentReactivated(uint256 indexed agentId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Yeni bir AI ajan kaydeder (yalnızca owner)
     * @param walletAddress Circle cüzdan adresi
     * @param name Ajan adı
     * @param criteria JSON formatında eşleşme kriterleri
     */
    function registerAgent(
        address walletAddress,
        string calldata name,
        string calldata criteria
    ) external onlyOwner returns (uint256) {
        require(walletToAgent[walletAddress] == 0, "AR: wallet already registered");

        uint256 agentId = nextAgentId++;
        agents[agentId] = AgentInfo({
            walletAddress: walletAddress,
            name: name,
            criteria: criteria,
            active: true,
            createdAt: block.timestamp
        });
        walletToAgent[walletAddress] = agentId;

        emit AgentRegistered(agentId, walletAddress, name);
        return agentId;
    }

    function deactivateAgent(uint256 agentId) external onlyOwner {
        require(agents[agentId].createdAt > 0, "AR: agent not found");
        agents[agentId].active = false;
        emit AgentDeactivated(agentId);
    }

    function reactivateAgent(uint256 agentId) external onlyOwner {
        require(agents[agentId].createdAt > 0, "AR: agent not found");
        agents[agentId].active = true;
        emit AgentReactivated(agentId);
    }

    function isActive(uint256 agentId) external view returns (bool) {
        return agents[agentId].active;
    }

    function getAgent(uint256 agentId) external view returns (AgentInfo memory) {
        return agents[agentId];
    }
}
