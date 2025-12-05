use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub authority: Pubkey,      // 32
    pub external_id: String,    // 4 + len
    pub total_yes: u64,         // 8
    pub total_no: u64,          // 8
    pub resolved: bool,         // 1
    pub outcome: Option<bool>,  // 2 (1 + 1)
    pub bump: u8,               // 1
}

impl Market {
    // Calculate space needed: 8 (discriminator) + 32 + (4 + 32) + 8 + 8 + 1 + 2 + 1 = ~100 bytes roughly
    // Using a generous buffer for external_id string length
    pub const MAX_SIZE: usize = 8 + 32 + (4 + 50) + 8 + 8 + 1 + 2 + 1; 
}

#[account]
pub struct UserBet {
    pub owner: Pubkey,          // 32
    pub amount_yes: u64,        // 8
    pub amount_no: u64,         // 8
    pub claimed: bool,          // 1
    pub bump: u8,               // 1
}

impl UserBet {
    pub const SIZE: usize = 8 + 32 + 8 + 8 + 1 + 1;
}

