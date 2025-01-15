use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};
use crate::{
    constants::{BORROW_TOKEN_SEED,COLLATERAL_TOKEN_SEED,LENDING_AUTHORITY_SEED,LENDING_TOKEN_SEED},
    state::Pool,
};

#[derive(Accounts)]
pub struct InitLendingPool2<'info> {
    /// CHECK: Read only authority
    #[account(
        seeds = [
            pool.amm.as_ref(),
            pool.mint_a.key().as_ref(),
            pool.mint_b.key().as_ref(),
        ],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

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
        init_if_needed,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            LENDING_TOKEN_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = lending_pool_authority,
        mint::freeze_authority = lending_pool_authority,
    )]
    pub lending_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            BORROW_TOKEN_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = lending_pool_authority,
        mint::freeze_authority = lending_pool_authority,
    )]
    pub borrow_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            COLLATERAL_TOKEN_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = lending_pool_authority,
        mint::freeze_authority = lending_pool_authority,
    )]
    pub collateral_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn init_lending_pool_2(_ctx: Context<InitLendingPool2>) -> Result<()> {
    Ok(())
}