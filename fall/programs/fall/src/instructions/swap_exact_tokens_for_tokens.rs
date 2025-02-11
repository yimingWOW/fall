use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::{
    constants::{AUTHORITY_SEED, PERCENT_BASE},
    state::{Amm, Pool},
};

#[derive(Accounts)]
pub struct SwapExactTokensForTokens<'info> {
    #[account(
        seeds = [
            amm.id.as_ref()
        ],
        bump,
    )]
    pub amm: Box<Account<'info, Amm>>,

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

    pub trader: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_a,
        associated_token::authority = trader,
    )]
    pub trader_account_a: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = trader,
    )]
    pub trader_account_b: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn swap_exact_tokens_for_tokens<'info>(
    ctx: Context<'_, '_, 'info, 'info, SwapExactTokensForTokens<'info>>,
    swap_a: bool,
    input_amount: u64,
    min_output_amount: u64,
) -> Result<()> {
    // Zero amount check
    require!(input_amount > 0, SwapError::InvalidInput);
    
    // Check pool is not empty
    require!(
        ctx.accounts.pool_account_a.amount > 0 && ctx.accounts.pool_account_b.amount > 0,
        SwapError::EmptyPool
    );

    // Prevent depositing assets the depositor does not own
    if swap_a {
        require!(ctx.accounts.trader_account_a.amount >= input_amount, SwapError::InsufficientBalance);
    } else {
        require!(ctx.accounts.trader_account_b.amount >= input_amount, SwapError::InsufficientBalance);
    }

    let pool_a = &ctx.accounts.pool_account_a;
    let pool_b = &ctx.accounts.pool_account_b;

    // Calculate raw output amount using u128 for better precision
    let raw_output = if swap_a {
        let new_pool_a: u128 = (pool_a.amount as u128)
            .checked_add(input_amount as u128)
            .ok_or(SwapError::MathOverflow)?;
        let k = (pool_a.amount as u128)
            .checked_mul(pool_b.amount as u128)
            .ok_or(SwapError::MathOverflow)?;
        (pool_b.amount as u128)
            .checked_sub(k.checked_div(new_pool_a).ok_or(SwapError::MathOverflow)?)
            .ok_or(SwapError::MathOverflow)?
    } else {
        let new_pool_b: u128 = (pool_b.amount as u128)
            .checked_add(input_amount as u128)
            .ok_or(SwapError::MathOverflow)?;
        let k = (pool_a.amount as u128)
            .checked_mul(pool_b.amount as u128)
            .ok_or(SwapError::MathOverflow)?;
        (pool_a.amount as u128)
            .checked_sub(k.checked_div(new_pool_b).ok_or(SwapError::MathOverflow)?)
            .ok_or(SwapError::MathOverflow)?
    };

    // Apply fee on output amount
    let fee_amount = raw_output
        .checked_mul(ctx.accounts.amm.liquidity_fee as u128)
        .ok_or(SwapError::MathOverflow)?
        .checked_div(PERCENT_BASE as u128)
        .ok_or(SwapError::MathOverflow)?;
    let output = raw_output
        .checked_sub(fee_amount)
        .ok_or(SwapError::MathOverflow)?;

    // Check output bounds
    require!(output <= u64::MAX as u128, SwapError::MathOverflow);
    let output = output as u64;

    // Slippage check
    require!(output >= min_output_amount, SwapError::ExcessiveSlippage);

    // Transfer tokens
    let authority_bump = ctx.bumps.pool_authority;
    let authority_seeds = &[
        &ctx.accounts.pool.amm.to_bytes(),
        &ctx.accounts.mint_a.key().to_bytes(),
        &ctx.accounts.mint_b.key().to_bytes(),
        AUTHORITY_SEED,
        &[authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    // Compute the invariant before the trade
    let old_invariant = (pool_a.amount as u128) * (pool_b.amount as u128);

    if swap_a {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_account_a.to_account_info(),
                    to: ctx.accounts.pool_account_a.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            ),
            input_amount,
        )?;
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_account_b.to_account_info(),
                    to: ctx.accounts.trader_account_b.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                signer_seeds,
            ),
            output,
        )?;

        // Update pool state
        ctx.accounts.pool.token_a_amount = ctx.accounts.pool.token_a_amount
            .checked_add(input_amount)
            .ok_or(SwapError::MathOverflow)?;
        ctx.accounts.pool.token_b_amount = ctx.accounts.pool.token_b_amount
            .checked_sub(output)
            .ok_or(SwapError::MathOverflow)?;
    } else {
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_account_a.to_account_info(),
                    to: ctx.accounts.trader_account_a.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                signer_seeds,
            ),
            output,
        )?;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.trader_account_b.to_account_info(),
                    to: ctx.accounts.pool_account_b.to_account_info(),
                    authority: ctx.accounts.trader.to_account_info(),
                },
            ),
            input_amount,
        )?;

        // Update pool state
        ctx.accounts.pool.token_a_amount = ctx.accounts.pool.token_a_amount
            .checked_sub(output)
            .ok_or(SwapError::MathOverflow)?;
        ctx.accounts.pool.token_b_amount = ctx.accounts.pool.token_b_amount
            .checked_add(input_amount)
            .ok_or(SwapError::MathOverflow)?;
    }

    // Verify the invariant
    let new_invariant = if swap_a {
        ((ctx.accounts.pool_account_a.amount + input_amount) as u128)
            .checked_mul((ctx.accounts.pool_account_b.amount - output) as u128)
            .ok_or(SwapError::MathOverflow)?
    } else {
        ((ctx.accounts.pool_account_a.amount - output) as u128)
            .checked_mul((ctx.accounts.pool_account_b.amount + input_amount) as u128)
            .ok_or(SwapError::MathOverflow)?
    };

    // New invariant should be less than old invariant (because of fees)
    require!(new_invariant <= old_invariant, SwapError::InvariantViolated);
    
    Ok(())
}

#[error_code]
pub enum SwapError {
    #[msg("Output too small")]
    OutputTooSmall,
    #[msg("Invariant violated")]
    InvariantViolated,
    #[msg("Invalid input amount")]
    InvalidInput,
    #[msg("Pool is empty")]
    EmptyPool,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Slippage tolerance exceeded")]
    ExcessiveSlippage,
}