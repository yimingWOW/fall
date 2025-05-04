import fallIdl from '../idl/fall.json';
export const CONFIG = {
  fallIdl
} as const;


export const AUTHORITY_SEED= "a"; // authority
export const LIQUIDITY_SEED= "b"; // liquidity
export const LENDING_AUTHORITY_SEED= "d"; // lending_authority
export const LENDING_TOKEN_SEED= "e"; // lending_token
export const BORROW_TOKEN_SEED= "f"; // borrow_token
export const BORROWER_AUTHORITY_SEED= "g"; // borrower_authority
export const COLLATERAL_TOKEN_SEED= "h"; // collateral_token
export const LENDER_LENDING_BLOCK_HEIGHT_TOKEN_SEED= "i"; // lending_height_token
export const BORROWER_BORROW_BLOCK_HEIGHT_TOKEN_SEED= "j"; // borrow_height_token   

// Constants
export const MINIMUM_LIQUIDITY = 100;
export const PRICE_SCALE = 1_000_000_000; 
export const MIN_COLLATERAL_RATIO = 10000;
export const BASE_RATE = 10000;

export const EXCLUDED_PUBLIC_KEY = 'GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5';
export const ADMIN_PUBLIC_KEY = 'EisXsrG1aCoaJTFSDdXTBRAEAZP46wPWkKJpF7RfC3DV';