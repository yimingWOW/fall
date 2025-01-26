use anchor_lang::prelude::*;

#[constant]
pub const MINIMUM_LIQUIDITY: u64 = 10;

#[constant]
pub const AUTHORITY_SEED: &[u8] = b"a"; // authority

#[constant]
pub const LIQUIDITY_SEED: &[u8] = b"b"; // liquidity

#[constant]
pub const LENDING_AUTHORITY_SEED: &[u8] = b"d"; // lending_authority

#[constant]
pub const LENDING_TOKEN_SEED: &[u8] = b"e"; // lending_token

#[constant]
pub const BORROW_TOKEN_SEED: &[u8] = b"f"; // borrow_token

#[constant]
pub const BORROWER_AUTHORITY_SEED: &[u8] = b"g"; // borrower_authority

#[constant]
pub const COLLATERAL_TOKEN_SEED: &[u8] = b"h"; // collateral_token

#[constant]
pub const LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED: &[u8] = b"i"; // lending_height_token

#[constant]
pub const BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED: &[u8] = b"j"; // borrow_height_token   


#[constant]
pub const PERCENT_BASE: u64 = 10000; // 100%

#[constant]
pub const BASE_INTEREST_RATE: u64 = 5; // 0.05%

#[constant]
pub const MIN_COLLATERAL_RATIO: u64 = 10000; // 100%