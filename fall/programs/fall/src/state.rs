use anchor_lang::prelude::*;
use crate::constants::{BASE_INTEREST_RATE, PERCENT_BASE, MIN_COLLATERAL_RATIO};

#[account]
#[derive(Default)]
pub struct Amm {
    /// Primary key of the AMM
    pub id: Pubkey,

    /// Account that has admin authority over the AMM
    pub admin: Pubkey,

    /// liquidity fee percentage: 100000 = 100%
    pub liquidity_fee: u16, 

    /// Protocol fee percentage of the liquidity fee (0-100)
    /// e.g., 10000 means 100% of liquidity fee goes to protocol
    pub protocol_fee_percentage: u16,
}

impl Amm {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 2;
}

#[account]
#[derive(Default)]
pub struct Pool {
    /// Primary key of the AMM
    pub amm: Pubkey,

    /// Mint of token A
    pub mint_a: Pubkey,

    /// Mint of token B
    pub mint_b: Pubkey,

    /// 借贷池中token a的数量
    pub token_a_amount :u64,
    /// 借贷池中token b的数量
    pub token_b_amount :u64,

    // lending pool
    /// 记录上次借贷池interest_step更新时的区块高度
    pub borrow_interest_accumulator_block_height: u64,
    /// 借款累计利息，随着区块高度增加而增加，但是增加幅度与资金借出量正相关
    pub borrow_interest_accumulator: u64,
    /// 共享借贷累加器区块高度
    pub share_lending_block_height: u64,
    /// 共享借贷累加器，资金借出量的时间积分
    pub share_lending_accumulator: u64,
}

impl Pool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8;

    // 计算 token A 的价值，返回token A等价于token B的数量
    #[inline(never)]
    pub fn calculate_token_a_value(&mut self, amount_a: u64) -> Result<u64> {
        // 计算价值: value = amount_b * pool_a_amount / pool_b_amount
        let token_a_value = (amount_a as u128)
        .checked_mul(self.token_a_amount as u128)
        .ok_or(StateError::CalculationError)?;
        if token_a_value > u64::MAX as u128 {
            return Err(StateError::CalculationError1.into());
        }
        let res=token_a_value.checked_div(self.token_b_amount as u128)
        .ok_or(StateError::CalculationError1)?;
        Ok(res as u64)
    }

    // 计算 token B 的价值，返回token B等价于token A的数量
    #[inline(never)]  // 强制不内联
    pub fn calculate_token_b_value(
        &mut self,
        amount_b: u64,
    ) -> Result<u64> {
        // 计算价值: value = amount_b * pool_a_amount / pool_b_amount
        let token_b_value = (amount_b as u128)
        .checked_mul(self.token_a_amount as u128)
        .ok_or(StateError::CalculationError)?;
        if token_b_value > u64::MAX as u128 {
            return Err(StateError::CalculationError1.into());
        }
        let res=token_b_value.checked_div(self.token_b_amount as u128)
        .ok_or(StateError::CalculationError1)?;
        Ok(res as u64)
    }   

    // 更新借贷池的累计利息 （基于区块高度和基础利率和借出资金计算lendingpool的实际累积利息）
    #[inline(never)]  // 强制不内联
    pub fn update_borrow_interest_accumulator(&mut self,  current_borrowed: u64) -> Result<()> {
        let current_block_height = Clock::get()?.slot;
        let blocks_passed = calculate_blocks_passed(self.borrow_interest_accumulator_block_height, current_block_height)?;
        
        // todo: 计算interest_increase过程中的溢出问题
        // 计算lending pool实际累积利息: 区块数* 借出资金数 * 基础利率  
        let interest_increase = (blocks_passed as u128)
            .checked_mul(current_borrowed as u128)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .checked_mul(BASE_INTEREST_RATE as u128)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .checked_div(PERCENT_BASE as u128)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        // 更新区块高度和累计利息
        self.borrow_interest_accumulator_block_height = current_block_height;
        if (self.borrow_interest_accumulator as u128).checked_add(interest_increase).ok_or(ProgramError::ArithmeticOverflow)? > u64::MAX as u128 {
            self.borrow_interest_accumulator=u64::MAX;
        }else{
            self.borrow_interest_accumulator = self.borrow_interest_accumulator
                .checked_add(interest_increase as u64)
                .ok_or(ProgramError::ArithmeticOverflow)?;
        }
        Ok(())
    }

    // 更新共享借贷累加器（共享借贷累加器是lender存入资金基于时间计算的积分）
    #[inline(never)]  // 强制不内联
    pub fn get_updated_share_lending_accumulator(&mut self, current_lending_receipt_amount: u64) -> Result<u64> {
        let current_block_height = Clock::get()?.slot;
    
        // 计算区块增长数
        let blocks_passed = calculate_blocks_passed(self.share_lending_block_height, current_block_height)?;

        // todo: 计算 interest_lending_amount 过程中的溢出问题
        // 计算lending pool实际累积资金时间成本: 区块数 * lending资金数
        let interest_lending_amount = blocks_passed
            .checked_mul(current_lending_receipt_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        // 更新区块高度和累计借出资金时间成本
        self.share_lending_block_height = current_block_height;
        if (self.share_lending_accumulator as u128).checked_add(interest_lending_amount as u128).ok_or(ProgramError::ArithmeticOverflow)? > u64::MAX as u128 {   
            self.share_lending_accumulator=u64::MAX;
        }else{
            self.share_lending_accumulator = self.share_lending_accumulator
                .checked_add(interest_lending_amount)
                .ok_or(ProgramError::ArithmeticOverflow)?;
        }
    
        // 返回更新后的值
        Ok(self.share_lending_accumulator)
    }

    #[inline(never)]  // 强制不内联
    pub fn reduce_share_lending_accumulator(&mut self,  lender_redeem_lending_accumulator_amount: u64) -> Result<()> {
        if (self.share_lending_accumulator as u128)<(lender_redeem_lending_accumulator_amount as u128) {
            self.share_lending_accumulator=0;
        }else{
            self.share_lending_accumulator = self.share_lending_accumulator
                .checked_sub(lender_redeem_lending_accumulator_amount)
                .ok_or(ProgramError::ArithmeticOverflow)?;
        }

        Ok(())
    }

    // 检查抵押率,返回是否满足抵押率,满足返回true,不满足返回false
    #[inline(never)]
    pub fn check_collateral_ratio(&mut self, collateral_value_in_token_a: u64,borrow_amount: u64,
    ) -> Result<bool> {
        let required_collateral = (borrow_amount as u128)
            .checked_mul(MIN_COLLATERAL_RATIO as u128)
            .ok_or(StateError::CalculationError)?
            .checked_div(PERCENT_BASE as u128)
            .ok_or(StateError::CalculationError)? as u64;
        Ok(collateral_value_in_token_a >= required_collateral)
    }
}


#[inline(never)]
pub fn calculate_blocks_passed(borrow_interest_accumulator_block_height: u64, 
    current_block_height: u64) -> Result<u64> {
    current_block_height
        .checked_sub(borrow_interest_accumulator_block_height)
        .ok_or(ProgramError::ArithmeticOverflow.into())
}

#[error_code]
pub enum StateError {
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Calculation error")]
    CalculationError1,
    #[msg("Invalid fee")]
    InvalidFee,
}
