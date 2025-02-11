use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Burn, Transfer},
};
use crate::constants::BORROW_TOKEN_SEED;
use crate::constants::COLLATERAL_TOKEN_SEED;
use crate::constants::LENDING_AUTHORITY_SEED;
use crate::constants::BORROWER_AUTHORITY_SEED;

use crate::{
    constants::AUTHORITY_SEED,
    state:: Pool,
};

pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
    // 1. 计算抵押品等价于token A的数量,检查抵押率,要求抵押品等价于token A的数量大于等于借出金额的min_collateral_ratio
    let collateral_value = ctx.accounts.pool.calculate_token_b_value(
        ctx.accounts.borrower_collateral_receipt_token.amount
    )?;
    require!(collateral_value >= ctx.accounts.borrower_borrow_receipt_token.amount, FallError::InsufficientCollateral);

    let rewards = ctx.accounts.borrower_collateral_receipt_token.amount.checked_div(100).ok_or(FallError::CalculationError1)?;

    let authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        LENDING_AUTHORITY_SEED,
        &[ctx.bumps.lending_pool_authority],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.lending_pool_token_b.to_account_info(),
                to: ctx.accounts.trader_account_b.to_account_info(),
                authority: ctx.accounts.lending_pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        rewards,
    )?;
    
    let borrower_authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        &ctx.accounts.borrower.key().to_bytes(),
        BORROWER_AUTHORITY_SEED,
        &[ctx.bumps.borrower_authority],
    ];
    let borrower_signer_seeds = &[&borrower_authority_seeds[..]];
    token::burn(            
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.borrow_receipt_token_mint.to_account_info(),
                from: ctx.accounts.borrower_borrow_receipt_token.to_account_info(),
                authority: ctx.accounts.borrower_authority.to_account_info(),
            },
            borrower_signer_seeds,
        ),      
        ctx.accounts.borrower_borrow_receipt_token.amount,          
    )?;
    token::burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.collateral_receipt_token_mint.to_account_info(),
                from: ctx.accounts.borrower_collateral_receipt_token.to_account_info(),
                authority: ctx.accounts.borrower_authority.to_account_info(),
            },
            borrower_signer_seeds,
        ),
        ctx.accounts.borrower_collateral_receipt_token.amount,
    )?;

    // 更新pool_interest
    ctx.accounts.pool.update_borrow_interest_accumulator(ctx.accounts.borrow_receipt_token_mint.supply)?;
    
    Ok(())
}



#[derive(Accounts)]
pub struct Liquidate<'info> {
    
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

    /// CHECK: Read only authority
    #[account(
        seeds = [
            pool.amm.as_ref(),
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
            AUTHORITY_SEED,
        ],
        bump,
    )]
    pub pool_authority: AccountInfo<'info>,

    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = pool_authority,
    )]
    pub pool_account_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = pool_authority,
    )]
    pub pool_account_b: Box<Account<'info, TokenAccount>>,

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
        associated_token::mint = mint_b,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            BORROW_TOKEN_SEED,
        ],
        bump,
    )]
    pub borrow_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            COLLATERAL_TOKEN_SEED,
        ],
        bump,
    )]
    pub collateral_receipt_token_mint: Box<Account<'info, Mint>>,

    // The account doing the swap
    pub trader: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = trader,
    )]
    pub trader_account_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: Read only authority
    pub borrower: AccountInfo<'info>, 

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
        mut,
        associated_token::mint = borrow_receipt_token_mint,
        associated_token::authority = borrower_authority,
    )]
    pub borrower_borrow_receipt_token: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        associated_token::mint = collateral_receipt_token_mint,
        associated_token::authority = borrower_authority,
    )]
    pub borrower_collateral_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


#[error_code]
pub enum FallError {
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("Calculation error")]
    CalculationError1,
}