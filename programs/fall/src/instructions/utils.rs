use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

#[inline(never)]
pub fn mint_and_freeze_token<'info>(
    token_program: &Program<'info, Token>,
    mint: &Box<Account<'info, Mint>>,
    recipient: &Box<Account<'info, TokenAccount>>,
    authority: &AccountInfo<'info>,
    signer_seeds: &[&[&[u8]]],
    amount: u64,
) -> Result<()> {
    // 1. Mint tokens
    token::mint_to(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: recipient.to_account_info(),
                authority: authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    Ok(())
}

#[error_code]
pub enum UtilsError {
    #[msg("Calculation error")]
    CalculationError,
}
