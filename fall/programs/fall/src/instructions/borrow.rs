use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};
use crate::constants::{ LENDING_AUTHORITY_SEED, BORROWER_AUTHORITY_SEED, BORROW_TOKEN_SEED, COLLATERAL_TOKEN_SEED, BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED };
use crate::state::Pool;
use crate::instructions::utils::mint_and_freeze_token;

#[derive(Accounts)]
#[instruction(borrow_amount: u64)]  
pub struct Borrow<'info> {
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
        associated_token::mint = pool.mint_a,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_a: Box<Account<'info, TokenAccount>>,

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
        associated_token::mint = pool.mint_a,
        associated_token::authority = borrower,
    )]
    pub borrower_token_a: Box<Account<'info, TokenAccount>>,

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

    #[account(
        mut,
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

pub fn borrow(ctx: Context<Borrow>,borrow_amount: u64) -> Result<()> {
    // 1. 计算抵押品等价于token A的数量,检查抵押率,要求抵押品等价于token A的数量大于等于借出金额的min_collateral_ratio
    let collateral_value = ctx.accounts.pool.calculate_token_b_value(ctx.accounts.borrower_collateral_receipt_token.amount )?;
    
    require!(ctx.accounts.pool.check_collateral_ratio(collateral_value, borrow_amount)?,BorowError::Error10);

    require!(borrow_amount <= ctx.accounts.lending_pool_token_a.amount , BorowError::Error11);
    require!(borrow_amount <= ctx.accounts.pool.token_a_amount , BorowError::Error11);

    // 4 更新pool_interest和铸造 borrow token 铸造 borrower_borrow_block_height_mint receipt_token
    let authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        LENDING_AUTHORITY_SEED,
        &[ctx.bumps.lending_pool_authority],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    ctx.accounts.pool.update_borrow_interest_accumulator(ctx.accounts.borrow_receipt_token_mint.supply)?;
    mint_and_freeze_token(
        &ctx.accounts.token_program,
        &ctx.accounts.borrow_receipt_token_mint,
        &ctx.accounts.borrower_borrow_receipt_token,
        &ctx.accounts.lending_pool_authority,
        signer_seeds,
        borrow_amount,
    )?;
    let current_block_height: u64 = Clock::get()?.slot;
    mint_and_freeze_token(
        &ctx.accounts.token_program,
        &ctx.accounts.borrower_borrow_block_height_mint,
        &ctx.accounts.borrower_borrow_block_height_receipt_token,
        &ctx.accounts.lending_pool_authority,
        signer_seeds,
        current_block_height,
    )?;

    // 5. 转移借出的代币（token A）给借款人
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.lending_pool_token_a.to_account_info(),
                to: ctx.accounts.borrower_token_a.to_account_info(),
                authority: ctx.accounts.lending_pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        borrow_amount,
    )?;

    Ok(())
}

#[error_code]
pub enum BorowError {
    #[msg("Invalid collateral ratio")]
    Error10,
    #[msg("Insufficient borrow amount")]
    Error11,
}
