// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BlessingPool
 * @notice Wish'lere USDC ile micro-blessing gönderilmesini ve claim edilmesini yönetir.
 *         Arc Testnet (chainId: 5042002) üzerinde deploy edilecek.
 *         Relayer veya ajan, registerWish ile wish sahipliğini on-chain'e kaydeder.
 *         Kullanıcılar bless() ile USDC gönderir; wish sahibi claimBlessings() ile toplar.
 */
contract BlessingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public relayer;

    struct BlessingInfo {
        address blesser;
        uint256 amount;
        string message;
        bytes32 agentId; // AI ajan tarafından yapılmışsa ajan kimliği
        uint256 timestamp;
    }

    // wishTokenId => wish sahibi adresi
    mapping(uint256 => address) public wishOwners;
    // wishTokenId => toplam blessing miktarı
    mapping(uint256 => uint256) public totalBlessed;
    // wishTokenId => claim edilmiş miktar
    mapping(uint256 => uint256) public totalClaimed;
    // wishTokenId => blessing listesi
    mapping(uint256 => BlessingInfo[]) public blessings;

    event WishRegistered(uint256 indexed wishTokenId, address indexed owner);
    event Blessed(uint256 indexed wishTokenId, address indexed blesser, uint256 amount, string message, bytes32 agentId);
    event Claimed(uint256 indexed wishTokenId, address indexed owner, uint256 amount);

    modifier onlyOwnerOrRelayer() {
        require(msg.sender == owner() || msg.sender == relayer, "BP: not authorized");
        _;
    }

    constructor(address _usdc, address _relayer) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        relayer = _relayer;
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    /**
     * @notice Wish'i on-chain'e kaydeder (yalnızca owner veya relayer çağırabilir)
     */
    function registerWish(uint256 wishTokenId, address wishOwner) external onlyOwnerOrRelayer {
        require(wishOwners[wishTokenId] == address(0), "BP: already registered");
        wishOwners[wishTokenId] = wishOwner;
        emit WishRegistered(wishTokenId, wishOwner);
    }

    /**
     * @notice Bir wish'e USDC blessing gönderir
     * @param wishTokenId NFT token ID
     * @param amount USDC miktarı (6 decimal)
     * @param message Opsiyonel mesaj
     * @param agentId AI ajan tarafından yapılmışsa ajan hash'i, yoksa bytes32(0)
     */
    function bless(
        uint256 wishTokenId,
        uint256 amount,
        string calldata message,
        bytes32 agentId
    ) external nonReentrant {
        require(wishOwners[wishTokenId] != address(0), "BP: wish not registered");
        require(amount > 0, "BP: amount must be > 0");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        blessings[wishTokenId].push(BlessingInfo({
            blesser: msg.sender,
            amount: amount,
            message: message,
            agentId: agentId,
            timestamp: block.timestamp
        }));

        totalBlessed[wishTokenId] += amount;

        emit Blessed(wishTokenId, msg.sender, amount, message, agentId);
    }

    /**
     * @notice Wish sahibi birikmiş USDC'yi çeker
     */
    function claimBlessings(uint256 wishTokenId) external nonReentrant {
        require(wishOwners[wishTokenId] == msg.sender, "BP: not wish owner");
        uint256 claimable = totalBlessed[wishTokenId] - totalClaimed[wishTokenId];
        require(claimable > 0, "BP: nothing to claim");

        totalClaimed[wishTokenId] = totalBlessed[wishTokenId];
        usdc.safeTransfer(msg.sender, claimable);

        emit Claimed(wishTokenId, msg.sender, claimable);
    }

    /**
     * @notice Relayer aracılığıyla telefon cüzdanı sahibi adına claim yapar
     */
    function claimForOwner(uint256 wishTokenId) external onlyOwnerOrRelayer nonReentrant {
        address wishOwner = wishOwners[wishTokenId];
        require(wishOwner != address(0), "BP: wish not registered");
        uint256 claimable = totalBlessed[wishTokenId] - totalClaimed[wishTokenId];
        require(claimable > 0, "BP: nothing to claim");

        totalClaimed[wishTokenId] = totalBlessed[wishTokenId];
        usdc.safeTransfer(wishOwner, claimable);

        emit Claimed(wishTokenId, wishOwner, claimable);
    }

    /**
     * @notice Bir wish'e yapılan blessing sayısını döner
     */
    function getBlessingCount(uint256 wishTokenId) external view returns (uint256) {
        return blessings[wishTokenId].length;
    }

    /**
     * @notice Claim edilebilir bakiyeyi sorgular
     */
    function claimable(uint256 wishTokenId) external view returns (uint256) {
        return totalBlessed[wishTokenId] - totalClaimed[wishTokenId];
    }
}
