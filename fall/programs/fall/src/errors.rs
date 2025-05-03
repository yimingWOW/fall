use anchor_lang::prelude::*;

#[error_code]
pub enum FallError {
    #[msg("Invalid fee value")]
    InvalidFee,

    #[msg("Invalid mint for the pool")]
    InvalidMint,

    #[msg("Depositing too little liquidity")]
    DepositTooSmall,

    #[msg("Output is below the minimum expected")]
    OutputTooSmall,

    #[msg("Invariant does not hold")]
    InvariantViolated,

    #[msg("Calculation error")]
    CalculationError,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Number overflow")]
    NumberOverflow,

    #[msg("lender already has active lending")]
    ExistingLending,
    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Error1")]
    Error1,

    #[msg("Error2")]
    Error2,

    #[msg("Error3")]
    Error3,

    #[msg("Error4")]
    Error4,

    #[msg("Error5")]
    Error5,

    #[msg("Error6")]
    Error6,

    #[msg("Error7")]
    Error7,

    #[msg("Error8")]
    Error8,

    #[msg("Error9")]
    Error9,

    #[msg("Error10")]
    Error10,

    #[msg("Error11")]
    Error11,

    #[msg("Error12")]
    Error12,

    #[msg("Error13")]
    Error13,
}