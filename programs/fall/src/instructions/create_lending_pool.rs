use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{
    constants::{ LENDING_SEED,LENDING_AUTHORITY_SEED},
    state::{ Pool,LendingPool},
};

#[derive(Accounts)]
pub struct CreateLendingPool<'info> {
    #[account(
        seeds = [
            pool.amm.as_ref(),
            pool.mint_a.key().as_ref(),
            pool.mint_b.key().as_ref(),
        ],
        bump,
        has_one = mint_a,
        has_one = mint_b,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        constraint = mint_a.key() == pool.mint_a
    )]
    pub mint_a: Box<Account<'info, Mint>>,
    #[account(
        constraint = mint_b.key() == pool.mint_b
    )]
    pub mint_b: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        space = LendingPool::LEN,
        seeds = [
            pool.key().as_ref(),
            LENDING_SEED,
        ],
        bump,
    )]
    pub lending_pool: Box<Account<'info, LendingPool>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            pool.key().as_ref(),
            LENDING_AUTHORITY_SEED,
        ],
        bump,
    )]
    pub lending_pool_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_a,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_b: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn create_lending_pool(ctx: Context<CreateLendingPool>) -> Result<()> {
    let lending_pool = &mut ctx.accounts.lending_pool;
    lending_pool.pool = ctx.accounts.pool.key();
    lending_pool.min_collateral_ratio = 20000;
    lending_pool.borrow_interest_accumulator_block_height = 0;
    lending_pool.borrow_interest_accumulator = 0;
    lending_pool.share_lending_block_height = 0;
    lending_pool.share_lending_accumulator = 0;
    // lending_pool.mint_a = ctx.accounts.mint_a.key();
    // lending_pool.mint_b = ctx.accounts.mint_b.key();

    Ok(())
}