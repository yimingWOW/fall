use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer},
};
use fixed::types::I64F64;
use crate::{
    constants::{AUTHORITY_SEED, LIQUIDITY_SEED, MINIMUM_LIQUIDITY,PERCENT_BASE},
    state::{Pool, Amm},
};


#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(
        seeds = [
            amm.id.as_ref()
        ],
        bump,
    )]
    pub amm: Box<Account<'info, Amm>>,

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

    pub mint_a: Box<Account<'info, Mint>>,
    pub mint_b: Box<Account<'info, Mint>>,
    
    /// The account paying for all rents
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [
            pool.key().as_ref(),
            LIQUIDITY_SEED,
        ],
        bump,
        mint::decimals = 6,
        mint::authority = pool_authority,
    )]
    pub liquidity_mint: Box<Account<'info, Mint>>,

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

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = liquidity_mint,
        associated_token::authority = depositor,
    )]
    pub depositor_account_liquidity: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = depositor,
    )]
    pub depositor_account_a: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = depositor,
    )]
    pub depositor_account_b: Box<Account<'info, TokenAccount>>,

    /// CHECK: Admin account from AMM state
    #[account(
        constraint = admin.key() == amm.admin
    )]
    pub admin: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = liquidity_mint,
        associated_token::authority = admin,  // Now using the admin AccountInfo
    )]
    pub admin_fee_account: Box<Account<'info, TokenAccount>>,

    /// The account paying for all rents
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Solana ecosystem accounts
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


pub fn deposit_liquidity(ctx: Context<DepositLiquidity>,amount_a: u64,amount_b: u64,) -> Result<()> {
    // Prevent depositing assets the depositor does not own
    let mut amount_a: u64 = if amount_a > ctx.accounts.depositor_account_a.amount {
        ctx.accounts.depositor_account_a.amount
    } else {
        amount_a
    };
    let mut amount_b = if amount_b > ctx.accounts.depositor_account_b.amount {
        ctx.accounts.depositor_account_b.amount
    } else {
        amount_b
    };
    // Making sure they are provided in the same proportion as existing liquidity
    let pool_a = &ctx.accounts.pool_account_a;
    let pool_b = &ctx.accounts.pool_account_b;

    // Defining pool creation like this allows attackers to frontrun pool creation with bad ratios
    let pool_creation = pool_a.amount == 0 && pool_b.amount == 0;
    (amount_a, amount_b) = if pool_creation {
        (amount_a, amount_b)
    } else {
        if pool_a.amount > pool_b.amount {
            let new_amount_a = amount_b
            .checked_mul(pool_a.amount)
            .ok_or(DepositError::NumberOverflow)?
            .checked_div(pool_b.amount)
            .ok_or(DepositError::NumberOverflow)?;
        (new_amount_a, amount_b)
        } else {
        // amount_b = amount_a * pool_b / pool_a
        let new_amount_b = amount_a
            .checked_mul(pool_b.amount)
            .ok_or(DepositError::NumberOverflow)?
            .checked_div(pool_a.amount)
            .ok_or(DepositError::NumberOverflow)?;
        (amount_a, new_amount_b)
        }
    };

    // Computing the amount of liquidity about to be deposited
    let mut liquidity = I64F64::from_num(amount_a)
        .checked_mul(I64F64::from_num(amount_b))
        .unwrap()
        .sqrt()
        .to_num::<u64>();

    // Lock some minimum liquidity on the first deposit
    if pool_creation {
        require!(MINIMUM_LIQUIDITY < liquidity, DepositError::DepositTooSmall);
        liquidity -= MINIMUM_LIQUIDITY;
    }

    // Calculate protocol fee - 修改这部分逻辑
    let user_liquidity = (liquidity as u64)
        .checked_mul((PERCENT_BASE - ctx.accounts.amm.protocol_fee_percentage as u64) as u64)
        .ok_or(DepositError::NumberOverflow)?
        .checked_div(PERCENT_BASE as u64)
        .ok_or(DepositError::NumberOverflow)? as u64;
    
    let protocol_fee = liquidity.checked_sub(user_liquidity).ok_or(DepositError::NumberOverflow)?;

    // Transfer tokens to the pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor_account_a.to_account_info(),
                to: ctx.accounts.pool_account_a.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        amount_a,
    )?;
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor_account_b.to_account_info(),
                to: ctx.accounts.pool_account_b.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Update pool state
    ctx.accounts.pool.token_a_amount = ctx.accounts.pool.token_a_amount.checked_add(amount_a).ok_or(DepositError::NumberOverflow)?;
    ctx.accounts.pool.token_b_amount = ctx.accounts.pool.token_b_amount.checked_add(amount_b).ok_or(DepositError::NumberOverflow)?;

    let authority_bump = ctx.bumps.pool_authority;
    let authority_seeds = &[
        &ctx.accounts.pool.amm.to_bytes(),
        &ctx.accounts.mint_a.key().to_bytes(),
        &ctx.accounts.mint_b.key().to_bytes(),
        AUTHORITY_SEED,
        &[authority_bump],
    ];
    let signer_seeds = &[&authority_seeds[..]];

    // Mint liquidity tokens to user
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.liquidity_mint.to_account_info(),
                to: ctx.accounts.depositor_account_liquidity.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
        user_liquidity,
    )?;

    // Mint protocol fee to admin if it's not zero
    if protocol_fee > 0 {
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.liquidity_mint.to_account_info(),
                    to: ctx.accounts.admin_fee_account.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
                signer_seeds,
            ),
            protocol_fee,
        )?;
    }

    Ok(())
}

#[error_code]
pub enum DepositError {
    #[msg("Deposit too small")]
    DepositTooSmall,
    #[msg("Number overflow")]
    NumberOverflow,
}
