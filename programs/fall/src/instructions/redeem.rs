use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer, ThawAccount, Burn},
    associated_token::AssociatedToken,
};
use crate::constants::*;
use crate::state::*;



#[derive(Accounts)]
pub struct Redeem<'info> {
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
        seeds = [
            pool.key().as_ref(),
            LENDING_SEED,
        ],
        bump
    )]
    pub lending_pool: Box<Account<'info, LendingPool>>,

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
            LENDING_TOKEN_SEED,
        ],
        bump,
    )]
    pub lending_receipt_token_mint: Box<Account<'info, Mint>>,

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
            LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED,
        ],
        bump,
    )]
    pub lender_lending_block_height_mint: Box<Account<'info, Mint>>,

    pub lender: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = lender,
    )]
    pub lender_token_a: Box<Account<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint_b,
        associated_token::authority = lender,
    )]
    pub lender_token_b: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = lending_receipt_token_mint,
        associated_token::authority = lender,
    )]
    pub lender_lending_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = lender_lending_block_height_mint,
        associated_token::authority = lender,
    )]
    pub lender_lending_block_height_receipt_token: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // 4. Programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
    // 1. 解码 lending receipt token 数量
    let lending_receipt_amount = ctx.accounts.lender_lending_receipt_token.amount;
    // todo: 限制redeem时间间隔，如果redeem时间间隔小于*天，则不能redeem（可以通过限制share_lending_accumulator来实现）

    // 2. 计算lender实际累积资金时间成本: 区块数 * lending资金数
    let last_lending_block_height = ctx.accounts.lender_lending_block_height_receipt_token.amount;
    let current_lending_block_height = Clock::get()?.slot;
    let blocks_passed = current_lending_block_height.checked_sub(last_lending_block_height).ok_or(ProgramError::ArithmeticOverflow)?;
    let lender_asset_accumulator = blocks_passed.checked_mul(lending_receipt_amount).ok_or(ProgramError::ArithmeticOverflow)?;

    // 计算lendingpool实际累积资金时间成本
    let last_share_lending_accumulator = ctx.accounts.lending_pool.share_lending_accumulator;
    let current_share_lending_accumulator =ctx.accounts.lending_pool.get_updated_share_lending_accumulator(ctx.accounts.lending_receipt_token_mint.supply)?;
    let lendingpool_asset_accumulator = current_share_lending_accumulator.checked_sub(last_share_lending_accumulator).ok_or(RedeemError::CalculationError)?;

    // 计算利息: lender_asset_accumulator/lendingpool_asset_accumulator*borrow_interest_accumulator
    let borrow_interest_accumulator = ctx.accounts.lending_pool.borrow_interest_accumulator;
    let mut lending_pool_token_b_amount = ctx.accounts.lending_pool_token_b.amount;

    if lendingpool_asset_accumulator!=0{
        let earn_interest = lender_asset_accumulator.checked_mul(borrow_interest_accumulator).ok_or(RedeemError::CalculationError)?
        .checked_div(lendingpool_asset_accumulator).ok_or(RedeemError::CalculationError)?;
        // 3. 转移利息
        if earn_interest > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.lending_pool_token_b.to_account_info(),
                        to: ctx.accounts.lender_token_b.to_account_info(),
                        authority: ctx.accounts.lending_pool_authority.to_account_info(),
                    },
                ),
                earn_interest,
            )?;
            lending_pool_token_b_amount = lending_pool_token_b_amount.checked_sub(earn_interest).ok_or(RedeemError::CalculationError)?; 
        }
    }

    // 4. 解冻、销毁 lending receipt token
    let authority_seeds = &[
        &ctx.accounts.pool.key().to_bytes(),
        LENDING_AUTHORITY_SEED,
        &[ctx.bumps.lending_pool_authority],
    ];
    let signer_seeds = &[&authority_seeds[..]];
    token::thaw_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            ThawAccount {
                mint: ctx.accounts.lending_receipt_token_mint.to_account_info(),
                account: ctx.accounts.lender_lending_receipt_token.to_account_info(),
                authority: ctx.accounts.lending_pool_authority.to_account_info(),
            },
            signer_seeds,
        ),
    )?;
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lending_receipt_token_mint.to_account_info(),
                from: ctx.accounts.lender_lending_receipt_token.to_account_info(),
                authority: ctx.accounts.lender.to_account_info(),
            }, 
        ),
        lending_receipt_amount,
    )?;

    // 更新lendingpool资金成本，因为lender已经将他的资金和利息提走了
    ctx.accounts.lending_pool.reduce_share_lending_accumulator(lender_asset_accumulator)?;
    let pool_authority_seeds = &[
        &ctx.accounts.pool.amm.to_bytes(),
        &ctx.accounts.mint_a.key().to_bytes(),
        &ctx.accounts.mint_b.key().to_bytes(),
        AUTHORITY_SEED,
        &[ctx.bumps.pool_authority],
    ];
    let pool_signer_seeds = &[&pool_authority_seeds[..]];
    token::thaw_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            ThawAccount {
                mint: ctx.accounts.lender_lending_block_height_mint.to_account_info(),
                account: ctx.accounts.lender_lending_block_height_receipt_token.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            pool_signer_seeds,
        ),
    )?;
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.lender_lending_block_height_mint.to_account_info(),
                from: ctx.accounts.lender_lending_block_height_receipt_token.to_account_info(),
                authority: ctx.accounts.lender.to_account_info(),
            }, 
        ),
        last_lending_block_height,
    )?;

    // 5. 提取本金
     // 计算lender借出的token b 等价于抵押品token a的数量 todo: 取整方向
     let token_b_value_denominated_in_token_a = ctx.accounts.pool.calculate_token_a_value(
        lending_pool_token_b_amount)?;
    // 抵押物token b价值小于已经借出的token a价值，则lender只能赎回部份token a或者等额的usdt
    if token_b_value_denominated_in_token_a >= ctx.accounts.borrow_receipt_token_mint.supply  {
        if ctx.accounts.lending_pool_token_a.amount >= lending_receipt_amount{
            // 如果借贷池中的token a 数量大于等于用户借出的token a 数量，则直接转移
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.lending_pool_token_a.to_account_info(),
                        to: ctx.accounts.lender_token_a.to_account_info(),
                        authority: ctx.accounts.lending_pool_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                lending_receipt_amount,
            )?;
        }else{
            // 如果借贷池中的token a 数量小于用户借出的token a 数量，则需要得到token a+usdt
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.lending_pool_token_a.to_account_info(),
                        to: ctx.accounts.lender_token_a.to_account_info(),
                        authority: ctx.accounts.lending_pool_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                ctx.accounts.lending_pool_token_a.amount,
            )?;
            // 计算差额的token a 数量
            let remaining_a = lending_receipt_amount-ctx.accounts.lending_pool_token_a.amount;
            let token_b_amount = ctx.accounts.pool.calculate_token_a_value(
                remaining_a)?;
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.lending_pool_token_b.to_account_info(),
                        to: ctx.accounts.lender_token_b.to_account_info(),
                        authority: ctx.accounts.lending_pool_authority.to_account_info(),
                    },
                    signer_seeds,
                ),
                token_b_amount,
            )?;
        }  
    }else{
        // 如果借贷池中的token b 价值小于已经借出的token a 价值，说明token a价格快速上涨，lending pool中只剩下token b
        // 此时lender只能按照存款比例赎回token b
        let token_b_amount = lending_pool_token_b_amount.checked_mul(lending_receipt_amount)
        .ok_or(RedeemError::CalculationError)?
        .checked_div(ctx.accounts.lender_lending_receipt_token.amount)
        .ok_or(RedeemError::CalculationError)?;
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.lending_pool_token_b.to_account_info(),
                    to: ctx.accounts.lender_token_b.to_account_info(),
                    authority: ctx.accounts.lending_pool_authority.to_account_info(),
                },
                signer_seeds,
            ),
            token_b_amount,
        )?;
    }
   
    Ok(())
}

#[error_code]
pub enum RedeemError {
    #[msg("Calculation error")]
    CalculationError,
}