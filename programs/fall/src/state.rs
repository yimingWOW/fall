use anchor_lang::prelude::*;
use crate::constants::{BASE_RATE, MIN_COLLATERAL_RATIO_BASE};

#[account]
#[derive(Default)]
pub struct Amm {
    /// The primary key of the AMM
    pub id: Pubkey,

    /// Account that has admin authority over the AMM
    pub admin: Pubkey,
}

impl Amm {
    pub const LEN: usize = 8 + 32 + 32;
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

    /// The LP fee taken on each trade, in basis points
    pub fee: u16,

    /// 价格    
    pub price: u64,
}

impl Pool {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 2 + 8;

    // 计算 token A 的价值，返回token A等价于token B的数量
    #[inline(never)]  // 强制不内联
    pub fn calculate_token_a_value(
        &mut self,
        amount_a: u64,
    ) -> Result<u64> {
        // 计算价值: value = amount_b * pool_a_amount / pool_b_amount
        let token_a_value = (amount_a as u128)
        .checked_div(self.price as u128).ok_or(StateError::CalculationError)?;
        Ok(token_a_value as u64)
    }

    // 计算 token B 的价值，返回token B等价于token A的数量
    #[inline(never)]  // 强制不内联
    pub fn calculate_token_b_value(
        &mut self,
        amount_b: u64,
    ) -> Result<u64> {
        // 计算价值: value = amount_b * pool_a_amount / pool_b_amount
        let token_a_value = (amount_b as u128)
        .checked_mul(self.price as u128).ok_or(StateError::CalculationError)?;
        Ok(token_a_value as u64)
    }   
}


#[account]
#[derive(Default)]
pub struct LendingPool {
    /// 关联的 AMM 池子
    pub pool: Pubkey,

    pub mint_a: Pubkey,

    pub mint_b: Pubkey,

    /// 最小抵押率 (基点表示，20000 = 200%)
    pub min_collateral_ratio: u64,
    /// 记录上次借贷池interest_step更新时的区块高度
    pub borrow_interest_accumulator_block_height: u64,
    /// 借款累计利息，随着区块高度增加而增加，但是增加幅度与资金借出量正相关
    pub borrow_interest_accumulator: u64,

    /// 共享借贷累加器区块高度
    pub share_lending_block_height: u64,
    /// 共享借贷累加器，资金借出量的时间积分
    pub share_lending_accumulator: u64,
}

impl LendingPool {
    pub const LEN: usize = 8 +  // discriminator
        32 + // pool
        8 +  // min_collateral_ratio
        8 +  // borrow_interest_accumulator_block_height
        8 +  // borrow_interest_accumulator
        8 +  // share_lending_block_height
        8 ;  // share_lending_accumulator

    // 更新借贷池的累计利息 （基于区块高度和基础利率和借出资金计算lendingpool的实际累积利息）
    #[inline(never)]  // 强制不内联
    pub fn update_borrow_interest_accumulator(&mut self,  current_borrowed: u64) -> Result<()> {
        let current_block_height = Clock::get()?.slot;
        let blocks_passed = calculate_blocks_passed(self.borrow_interest_accumulator_block_height, current_block_height)?;
        
        // 计算lending pool实际累积利息: 区块数 * 基础利率  * 借出资金数
        let interest_increase = blocks_passed
            .checked_mul(BASE_RATE)
            .ok_or(ProgramError::ArithmeticOverflow)?
            .checked_mul(current_borrowed)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        // 更新区块高度和累计利息
        self.borrow_interest_accumulator_block_height = current_block_height;
        self.borrow_interest_accumulator = self.borrow_interest_accumulator
            .checked_add(interest_increase)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        Ok(())
    }

    // 更新共享借贷累加器（共享借贷累加器是lender存入资金基于时间计算的积分）
    #[inline(never)]  // 强制不内联
    pub fn get_updated_share_lending_accumulator(&mut self, current_lending_receipt_amount: u64) -> Result<u64> {
        let current_block_height = Clock::get()?.slot;
    
        // 计算区块增长数
        let blocks_passed = current_block_height
            .checked_sub(self.share_lending_block_height)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        // 计算lending pool实际累积资金时间成本: 区块数 * lending资金数
        let interest_lending_amount = blocks_passed
            .checked_mul(current_lending_receipt_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        
        // 更新区块高度和累计借出资金时间成本
        self.share_lending_block_height = current_block_height;
        self.share_lending_accumulator = self.share_lending_accumulator
            .checked_add(interest_lending_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    
        // 返回更新后的值
        Ok(self.share_lending_accumulator)
    }

    #[inline(never)]  // 强制不内联
    pub fn reduce_share_lending_accumulator(&mut self,  lender_redeem_lending_accumulator_amount: u64) -> Result<()> {
        self.share_lending_accumulator = self.share_lending_accumulator
            .checked_sub(lender_redeem_lending_accumulator_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;

        Ok(())
    }

    //  计算利息
    #[inline(never)]  // 强制不内联
    pub fn calculate_interest(&mut self, record_block_height: u64, borrowed_amount: u64,) -> Result<u64> {
        // 计算区块增长数
        let blocks_passed = Clock::get()?.slot
        .checked_sub(record_block_height)
        .ok_or(StateError::CalculationError)?;
            
        // 计算lending pool实际累积利息: 区块数 * 基础利率  * 借出资金数
        let mut interest = blocks_passed
        .checked_mul(BASE_RATE)
        .ok_or(StateError::CalculationError)?
        .checked_mul(borrowed_amount)
        .ok_or(StateError::CalculationError)?;
        if interest==0{
            interest = 1;
        }
        Ok(interest)
    }

    // 检查抵押率,返回是否满足抵押率,满足返回true,不满足返回false
    #[inline(never)]  // 强制不内联
    pub fn check_collateral_ratio(
        &mut self, 
        collateral_value_in_token_a: u64,
        borrow_amount: u64,
    ) -> Result<bool> {
        let required_collateral = (borrow_amount as u128)
            .checked_mul(self.min_collateral_ratio as u128)
            .ok_or(StateError::CalculationError)?
            .checked_div(MIN_COLLATERAL_RATIO_BASE as u128)
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
    #[msg("Invalid fee")]
    InvalidFee,
}
