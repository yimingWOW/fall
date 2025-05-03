# fall

### Introduction

Fall is a lending protocol built on Solana without relying on oracles.

![Fall](https://github.com/yimingWOW/fall/blob/main/images/fall.001.png)

The protocol establishes lending pools for any trading pair alongside corresponding swap liquidity pools. The liquidation mechanism for lending positions is based on the prices from these corresponding liquidity pools.

Fall conducts liquidations based on on-chain liquidity pool prices, without depending on oracle feeds, significantly lowering the barrier to establishing lending pools. This allows anyone to create lending pools through the contract.

The protocol serves four main participants:

1. **Lender**: Users who hold tokens and maintain long-term bullish positions can deposit their tokens into lending pools to earn steady yields, regardless of short-term price fluctuations.

2. **Borrower**: Users with bearish sentiment can provide collateral to borrow tokens for short selling.

3. **Liquidator**: Liquidation of positions is executed by liquidators. When a borrower's collateral value falls below the required threshold, liquidators can trigger the liquidation through dedicated interfaces and receive rewards.

4. **Arbitrageur**: Since Fall enables shorting of any token, the intense competition between long and short positions will affect liquidity pool prices. Arbitrageurs actively maintain price alignment between the liquidity pools and market prices.

By creating two opposing lending pools, users can go long or short on any token within them.

![Fall](https://github.com/yimingWOW/fall/blob/main/images/fall.002.png)



