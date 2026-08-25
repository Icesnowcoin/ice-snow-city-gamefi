// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TaxSystem
 * @notice Ice Snow City 的税费计算与结算模块。
 * @dev ISC 是已放弃所有权、代理和控制权的普通 ERC-20；本合约不会尝试
 *      暂停、升级、增发、改税或从 ISC 合约侧强制扣款。玩家必须先主动
 *      approve 本合约，并在 collectTaxes 交易中承担 Gas。
 *
 *      本合约的税费属于游戏场景消费，按既定规则 60% 进入国库、40%进入营销钱包。
 *      NFT 铸造的 1%销毁、69%国库、30%营销不由本合约处理，应由独立铸造合约执行。
 */
contract TaxSystem is ReentrancyGuard {
    IERC20 public immutable iscToken;
    address public immutable treasury;
    address public immutable marketingWallet;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant TREASURY_BPS = 6_000;
    uint256 public constant MARKETING_BPS = 4_000;

    // 0.5% annual property tax and 10% annual income tax, expressed in BPS.
    uint256 public constant PROPERTY_TAX_BPS = 50;
    uint256 public constant INCOME_TAX_BPS = 1_000;

    // Utility rates are immutable whole-ISC units per usage unit.
    uint256 public immutable electricityRate;
    uint256 public immutable waterRate;

    error InvalidAddress();
    error InvalidRate();
    error EmptyTax();
    error TransferFailed();
    error TotalMismatch(uint256 expected, uint256 actual);

    event TaxesCollected(
        address indexed payer,
        uint256 indexed referenceId,
        uint256 total,
        uint256 treasuryAmount,
        uint256 marketingAmount,
        uint256 propertyTax,
        uint256 incomeTax,
        uint256 electricityFee,
        uint256 waterFee
    );

    constructor(
        address iscTokenAddress,
        address treasuryAddress,
        address marketingWalletAddress,
        uint256 electricityRateInIsc,
        uint256 waterRateInIsc
    ) {
        if (
            iscTokenAddress == address(0) ||
            treasuryAddress == address(0) ||
            marketingWalletAddress == address(0)
        ) revert InvalidAddress();
        if (electricityRateInIsc == 0 || waterRateInIsc == 0) revert InvalidRate();

        iscToken = IERC20(iscTokenAddress);
        treasury = treasuryAddress;
        marketingWallet = marketingWalletAddress;
        electricityRate = electricityRateInIsc;
        waterRate = waterRateInIsc;
    }

    function calculatePropertyTax(uint256 propertyValue) public pure returns (uint256) {
        return (propertyValue * PROPERTY_TAX_BPS) / BPS_DENOMINATOR;
    }

    function calculateIncomeTax(uint256 taxableIncome) public pure returns (uint256) {
        return (taxableIncome * INCOME_TAX_BPS) / BPS_DENOMINATOR;
    }

    function calculateElectricityFee(uint256 usageUnits) public view returns (uint256) {
        return usageUnits * electricityRate;
    }

    function calculateWaterFee(uint256 usageUnits) public view returns (uint256) {
        return usageUnits * waterRate;
    }

    function previewTaxes(
        uint256 propertyValue,
        uint256 taxableIncome,
        uint256 electricityUnits,
        uint256 waterUnits
    ) public view returns (uint256 total, uint256 treasuryAmount, uint256 marketingAmount) {
        uint256 propertyTax = calculatePropertyTax(propertyValue);
        uint256 incomeTax = calculateIncomeTax(taxableIncome);
        uint256 electricityFee = calculateElectricityFee(electricityUnits);
        uint256 waterFee = calculateWaterFee(waterUnits);
        total = propertyTax + incomeTax + electricityFee + waterFee;
        treasuryAmount = (total * TREASURY_BPS) / BPS_DENOMINATOR;
        marketingAmount = total - treasuryAmount;
    }

    /**
     * @notice 由玩家主动调用并结算已确认的税费。
     * @param expectedTotal 前端展示并由玩家确认的总额，用于防止参数/界面不一致。
     * @param referenceId 游戏账本中的税费周期或账单 ID。
     */
    function collectTaxes(
        uint256 referenceId,
        uint256 propertyValue,
        uint256 taxableIncome,
        uint256 electricityUnits,
        uint256 waterUnits,
        uint256 expectedTotal
    ) external nonReentrant {
        (uint256 total, uint256 treasuryAmount, uint256 marketingAmount) = previewTaxes(
            propertyValue,
            taxableIncome,
            electricityUnits,
            waterUnits
        );
        if (total == 0) revert EmptyTax();
        if (total != expectedTotal) revert TotalMismatch(expectedTotal, total);

        if (!iscToken.transferFrom(msg.sender, treasury, treasuryAmount)) revert TransferFailed();
        if (!iscToken.transferFrom(msg.sender, marketingWallet, marketingAmount)) revert TransferFailed();

        emit TaxesCollected(
            msg.sender,
            referenceId,
            total,
            treasuryAmount,
            marketingAmount,
            calculatePropertyTax(propertyValue),
            calculateIncomeTax(taxableIncome),
            calculateElectricityFee(electricityUnits),
            calculateWaterFee(waterUnits)
        );
    }
}
