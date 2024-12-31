use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};
use crate::{
    constants::{LENDING_TOKEN_SEED,BORROW_TOKEN_SEED,LENDING_AUTHORITY_SEED,COLLATERAL_TOKEN_SEED,LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED},
    state::Pool,
};

#[derive(Accounts)]
pub struct InitLendingPool<'info> {
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

    #[account(
        init,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = lending_pool_authority,
        mint::freeze_authority = lending_pool_authority,
    )]
    pub lender_lending_block_height_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = lending_pool_authority,
        mint::freeze_authority = lending_pool_authority,
    )]
    pub borrower_borrow_block_height_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn init_lending_pool(_ctx: Context<InitLendingPool>) -> Result<()> {
    Ok(())
}