use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::{
    constants::{LENDING_AUTHORITY_SEED, LENDING_TOKEN_SEED,LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,BORROWER_AUTHORITY_SEED},
    state::Pool,
};
use crate::instructions::utils::mint_and_freeze_token;


#[derive(Accounts)]
pub struct Lend<'info> {
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
            LENDING_TOKEN_SEED,
        ],
        bump,
        mint::authority = lending_pool_authority,
    )]
    pub lending_receipt_token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
        ],
        bump,
    )]
    pub lender_lending_block_height_mint: Box<Account<'info, Mint>>,

    pub lender: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = pool.mint_a,
        associated_token::authority = lender,
    )]
    pub lender_token_a: Box<Account<'info, TokenAccount>>,

    /// CHECK: Read only authority
    #[account(
        seeds = [
            pool.key().as_ref(),
            lender.key().as_ref(),
            BORROWER_AUTHORITY_SEED,
        ],
        bump,
    )]
    pub lender_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = lending_receipt_token_mint,
        associated_token::authority = lender_authority,
    )]
    pub lender_lend_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = lender_lending_block_height_mint,
        associated_token::authority = lender_authority,
    )]
    pub lender_lending_block_height_receipt_token: Box<Account<'info, TokenAccount>>,

    /// The account paying for all rents
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Solana ecosystem accounts
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn lend(ctx: Context<Lend>,lender_lending_amount: u64,) -> Result<()> {
    //  todo: 限制lender_lending_amount最小额度
     require!(
         ctx.accounts.lender_token_a.amount >= lender_lending_amount,
         LendError::InsufficientBalance
     );
 
    //  2. 转移 token A 到借贷池
     token::transfer(
         CpiContext::new(
             ctx.accounts.token_program.to_account_info(),
             Transfer {
                 from: ctx.accounts.lender_token_a.to_account_info(),
                 to: ctx.accounts.lending_pool_token_a.to_account_info(),
                 authority: ctx.accounts.lender.to_account_info(),
             },
         ),
         lender_lending_amount,
     )?;

     // 3. 获取token A 收据
     // 3.1 更新 当前lending资金时间积分 share_lending_accumulator, 编码 lending_receipt_amount
     ctx.accounts.pool.get_updated_share_lending_accumulator(ctx.accounts.lending_receipt_token_mint.supply)?;

     // 3.2 铸造 lender_lend_receipt_token
     let authority_seeds = &[
         &ctx.accounts.pool.key().to_bytes(),
         LENDING_AUTHORITY_SEED,
         &[ctx.bumps.lending_pool_authority],
     ];
     let signer_seeds = &[&authority_seeds[..]];
     mint_and_freeze_token(
        &ctx.accounts.token_program,
        &ctx.accounts.lending_receipt_token_mint,
        &ctx.accounts.lender_lend_receipt_token,
        &ctx.accounts.lending_pool_authority,
        signer_seeds,
        lender_lending_amount,
    )?;

    //  3.3 铸造 share_lending_accumulator_receipt_token
    let current_block_height: u64 = Clock::get()?.slot;
    mint_and_freeze_token(
        &ctx.accounts.token_program,
        &ctx.accounts.lender_lending_block_height_mint,
        &ctx.accounts.lender_lending_block_height_receipt_token,
        &ctx.accounts.lending_pool_authority,
        signer_seeds,
        current_block_height,
    )?;
    Ok(())
}

#[error_code]
pub enum LendError {
    #[msg("Existing lending")]
    ExistingLending,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}