use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer, Burn},
    associated_token::AssociatedToken,
};
use crate::constants::*;
use crate::state::*;


#[derive(Accounts)]
pub struct Repay<'info> {
    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,

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
            pool.amm.as_ref(),
            mint_a.key().as_ref(),
            mint_b.key().as_ref(),
            AUTHORITY_SEED,
        ],
        bump,
    )]
    pub pool_authority: AccountInfo<'info>,

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
        associated_token::mint = mint_a,
        associated_token::authority = lending_pool_authority,
    )]
    pub lending_pool_token_a: Box<Account<'info, TokenAccount>>,

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
        associated_token::mint = mint_a,
        associated_token::authority = borrower,
    )]
    pub borrower_token_a: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint_b,
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
        mut,
        associated_token::mint = borrow_receipt_token_mint,
        associated_token::authority = borrower_authority,
    )]
    pub borrower_borrow_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = collateral_receipt_token_mint ,
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



pub fn repay(ctx: Context<Repay>) -> Result<()> {
    // 1. 更新利息
    ctx.accounts.pool.update_borrow_interest_accumulator(ctx.accounts.borrow_receipt_token_mint.supply)?;

    // 2 还款 token a, 销毁 borrow receipt token
    let borrowed_amount = ctx.accounts.borrower_borrow_receipt_token.amount;
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.borrower_token_a.to_account_info(),
                to: ctx.accounts.lending_pool_token_a.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ),
        borrowed_amount,
    )?;

    let authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        LENDING_AUTHORITY_SEED,
        &[ctx.bumps.lending_pool_authority],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    // borrower_authority 的 seeds (用于 burn)
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
        borrowed_amount,
    )?;

    // 3. 计算需要返还的抵押品，返还抵押品 销毁 collateral_receipt_token
    let collateral_amount = ctx.accounts.borrower_collateral_receipt_token.amount;
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
        collateral_amount,
    )?; 

    // 4.计算应付利息 销毁 borrower_borrow_block_height_receipt_token
    let record_block_height = ctx.accounts.borrower_borrow_block_height_receipt_token.amount;
    token::burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.borrower_borrow_block_height_mint.to_account_info(),
                from: ctx.accounts.borrower_borrow_block_height_receipt_token.to_account_info(),
                authority: ctx.accounts.borrower_authority.to_account_info(),
            },
            borrower_signer_seeds,
        ),
        record_block_height,
    )?;

    // 扣除利息后，将剩余抵押物转给borrower
    let interest_token_a_amount = calculate_interest(record_block_height, borrowed_amount)?;
    let interest_token_b_amount = ctx.accounts.pool.calculate_token_a_value(interest_token_a_amount)?;

    if collateral_amount>interest_token_b_amount{
        let collateral_to_return: u64 = collateral_amount.checked_sub(interest_token_b_amount).ok_or(RepayError::CalculationError)?;
        if ctx.accounts.lending_pool_token_b.amount >= collateral_to_return{
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.lending_pool_token_b.to_account_info(),
                        to: ctx.accounts.borrower_token_b.to_account_info(),
                        authority: ctx.accounts.lending_pool_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                collateral_to_return,
            )?;
        }
    }

    Ok(())
}

#[error_code]
pub enum RepayError {
    #[msg("Calculation error")]
    CalculationError,
}

// todo: 小数==0的问题
//  计算利息
#[inline(never)]  // 强制不内联
fn calculate_interest(record_block_height: u64, borrowed_amount: u64,) -> Result<u64> {
    // 计算区块增长数
    let blocks_passed = Clock::get()?.slot
    .checked_sub(record_block_height)
    .ok_or(StateError::CalculationError)?;
        
    // 计算lending pool实际累积利息: 区块数 * 基础利率  * 借出资金数
    let interest = blocks_passed
    .checked_mul(borrowed_amount)
    .ok_or(StateError::CalculationError)?
    .checked_mul(BASE_INTEREST_RATE)
    .ok_or(StateError::CalculationError)?
    .checked_div(PERCENT_BASE)
    .ok_or(StateError::CalculationError)?;
    Ok(interest)
}