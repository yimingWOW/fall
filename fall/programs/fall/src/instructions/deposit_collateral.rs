use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};
use crate::constants::{ LENDING_AUTHORITY_SEED, BORROWER_AUTHORITY_SEED, COLLATERAL_TOKEN_SEED,BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED};
use crate::state::Pool;
use crate::instructions::utils::mint_and_freeze_token;

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
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
        mut,
        associated_token::mint = pool.mint_b,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            COLLATERAL_TOKEN_SEED,
        ],
        bump,
    )]
    pub collateral_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED,
        ],
        bump,
    )]
    pub borrower_borrow_block_height_mint: Box<Account<'info, Mint>>,

    pub borrower: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = pool.mint_b,
        associated_token::authority = borrower,
    )]
    pub borrower_token_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            pool.key().as_ref(),
            borrower.key().as_ref(),
            BORROWER_AUTHORITY_SEED,
        ],
        bump,
    )]
    pub borrower_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = collateral_receipt_token_mint,
        associated_token::authority = borrower_authority,
    )]
    pub borrower_collateral_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = borrower_borrow_block_height_mint,
        associated_token::authority = borrower_authority,
    )]
    pub borrower_borrow_block_height_receipt_token: Box<Account<'info, TokenAccount>>,
    

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_collateral(
    ctx: Context<DepositCollateral>,
    collateral_amount: u64,  // 抵押的 token B 数量
) -> Result<()> {
    // 转移抵押物（token B）到借贷池 铸造抵押物 collateral_receipt_token
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.borrower_token_b.to_account_info(),
                to: ctx.accounts.lending_pool_token_b.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ),
        collateral_amount,
    )?;
    let authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        LENDING_AUTHORITY_SEED,
        &[ctx.bumps.lending_pool_authority],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    mint_and_freeze_token(
        &ctx.accounts.token_program,
        &ctx.accounts.collateral_receipt_token_mint,
        &ctx.accounts.borrower_collateral_receipt_token,
        &ctx.accounts.lending_pool_authority,
        signer_seeds,
        collateral_amount,
    )?;
    
    Ok(())
}
