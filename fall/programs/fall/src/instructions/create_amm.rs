use anchor_lang::prelude::*;
use crate::state::Amm;

#[derive(Accounts)]
#[instruction(id: Pubkey)]
pub struct CreateAmm<'info> {
    #[account(
        init,
        payer = payer,
        space = Amm::LEN,
        seeds = [
            id.as_ref()
        ],
        bump,
    )]
    pub amm: Box<Account<'info, Amm>>,

    /// CHECK: Read only, delegatable creation
    pub admin: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}


pub fn create_amm(ctx: Context<CreateAmm>, id: Pubkey) -> Result<()> {
    let amm = &mut ctx.accounts.amm;
    amm.id = id;
    amm.admin = ctx.accounts.admin.key();
    amm.liquidity_fee = 10; // 0.1%
    amm.protocol_fee_percentage = 10; // 0.1%

    Ok(())
}