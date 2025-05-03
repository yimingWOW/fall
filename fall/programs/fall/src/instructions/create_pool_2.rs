use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::{
    constants::{AUTHORITY_SEED,LIQUIDITY_SEED},
    state::{Amm, Pool},
};

#[derive(Accounts)]
pub struct CreatePool2<'info> {
    #[account(
        seeds = [
            amm.id.as_ref()
        ],
        bump,
    )]
    pub amm: Box<Account<'info, Amm>>,

    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,
    
    #[account(
        mut,
        seeds = [
            amm.key().as_ref(),
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
        ],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            amm.key().as_ref(),
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
            AUTHORITY_SEED,
        ],
        bump,
    )]
    pub pool_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [
            pool.key().as_ref(),
            LIQUIDITY_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = pool_authority,
    )]
    pub liquidity_mint: Box<Account<'info, Mint>>,
    
    /// CHECK: Admin account from AMM state
    #[account(
        constraint = admin.key() == amm.admin
    )]
    pub admin: AccountInfo<'info>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = liquidity_mint,
        associated_token::authority = admin,  // Now using the admin AccountInfo
    )]
    pub admin_fee_account: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn create_pool_2(_ctx: Context<CreatePool2>) -> Result<()> {
    Ok(())
}

#[error_code]
pub enum PoolError {
    #[msg("Invalid fee")]
    InvalidFee,
}