# fall

### Introduction

Fall is a lending protocol without oracle built on the Solana. 

![Fall](https://github.com/yimingWOW/fall/blob/main/images/fall.png)

The protocol establishes lending pools for any trading pair alongside corresponding swap liquidity pools. The liquidation mechanism for lending instruments is based on the prices from these corresponding liquidity pools.

Fall conducts liquidations based on on-chain liquidity pool prices, without relying on oracle feeds, significantly lowering the barrier to establishing lending pools. This allows anyone to create lending pools through the contract.

The protocol serves four main participants:

1. **Lender**: Users who hold tokens and maintain long-term bullish positions can deposit their tokens into lending pools to earn steady yields, regardless of short-term price fluctuations.

2. **Borrower**: Users with bearish sentiment can provide collateral assets to borrow tokens for short selling.

3. **Liquidator**: Position liquidation is executed by liquidators. When a borrower's collateral value falls below the required threshold, liquidators can trigger liquidation through dedicated interfaces and receive rewards.

4. **Arbitrageur**: As Fall enables shorting for any token, the intense competition between long and short positions will affect liquidity pool prices. Arbitrageurs actively maintain price alignment between the liquidity pools and market prices.
