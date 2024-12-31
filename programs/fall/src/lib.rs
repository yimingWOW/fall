#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
mod constants;
mod instructions;
mod state;

declare_id!("Ar3ubGqirD9CqQyhSdYiZh7cyJZEXic3W8yRpSdELRpe");


#[program]
pub mod fall {
    pub use super::instructions::*;
    use super::*;

    pub fn create_amm(ctx: Context<CreateAmm>, id: Pubkey) -> Result<()> {
        instructions::create_amm(ctx, id)
    }

    pub fn create_pool(ctx: Context<CreatePool>, fee: u16) -> Result<()> {
        instructions::create_pool(ctx, fee)
    }

    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount_a: u64,
        amount_b: u64,
    ) -> Result<()> {
        instructions::deposit_liquidity(ctx, amount_a, amount_b)
    }

    pub fn withdraw_liquidity(ctx: Context<WithdrawLiquidity>, amount: u64) -> Result<()> {
        instructions::withdraw_liquidity(ctx, amount)
    }

    pub fn swap_exact_tokens_for_tokens<'info>(
        ctx: Context<'_, '_, 'info, 'info, SwapExactTokensForTokens<'info>>,
        swap_a: bool,
        input_amount: u64,
        min_output_amount: u64,
    ) -> Result<()> {
        instructions::swap_exact_tokens_for_tokens(ctx, swap_a, input_amount, min_output_amount)
    }

    pub fn price(ctx: Context<Price>) -> Result<PriceResult> {
        instructions::price(ctx)    
    }

    pub fn create_lending_pool(ctx: Context<CreateLendingPool>) -> Result<()> {
        instructions::create_lending_pool(ctx)
    }

    pub fn init_lending_pool(ctx: Context<InitLendingPool>) -> Result<()> {
        instructions::init_lending_pool(ctx)
    }

    pub fn lend(ctx: Context<Lend>, user_lending_amount: u64) -> Result<()> {
        instructions::lend(ctx, user_lending_amount)
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        instructions::redeem(ctx)
    }

    pub fn borrow(
        ctx: Context<Borrow>,
        borrow_amount: u64,      // 要借的 token A 数量
    ) -> Result<()> {
        instructions::borrow(ctx, borrow_amount)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        instructions::deposit_collateral(ctx, amount)
    }


    pub fn repay(ctx: Context<Repay>) -> Result<()> {
        instructions::repay(ctx)
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidate(ctx)
    }

}
