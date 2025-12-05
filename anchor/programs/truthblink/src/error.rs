use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The market is already resolved.")]
    MarketResolved,
    #[msg("The market is not resolved yet.")]
    MarketNotResolved,
    #[msg("The betting period has ended.")]
    BettingEnded,
    #[msg("Insufficient funds to place bet.")]
    InsufficientFunds,
    #[msg("User has already claimed winnings.")]
    AlreadyClaimed,
    #[msg("You lost the bet.")]
    YouLost,
    #[msg("Unauthorized access.")]
    Unauthorized,
}

