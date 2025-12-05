use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

pub mod constants;
pub mod error;
pub mod state;

use constants::*;
use error::ErrorCode;
use state::*;

declare_id!("BMLPwQE7THXBWM72ihnEJ63mjvw2Bmg7Ert2oXbpj9sX");

#[program]
pub mod truthblink {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        external_id: String,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.authority = ctx.accounts.authority.key();
        market.external_id = external_id;
        market.total_yes = 0;
        market.total_no = 0;
        market.resolved = false;
        market.outcome = None;
        market.bump = ctx.bumps.market;
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        side_yes: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        // Check if market is active
        require!(!market.resolved, ErrorCode::MarketResolved);

        // Transfer USDC from User to Vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update State
        if side_yes {
            market.total_yes = market.total_yes.checked_add(amount).unwrap();
            user_bet.amount_yes = user_bet.amount_yes.checked_add(amount).unwrap();
        } else {
            market.total_no = market.total_no.checked_add(amount).unwrap();
            user_bet.amount_no = user_bet.amount_no.checked_add(amount).unwrap();
        }

        if user_bet.owner == Pubkey::default() {
            user_bet.owner = ctx.accounts.user.key();
            user_bet.bump = ctx.bumps.user_bet;
        }

        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome_yes: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(!market.resolved, ErrorCode::MarketResolved);
        
        market.resolved = true;
        market.outcome = Some(outcome_yes);
        
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(market.resolved, ErrorCode::MarketNotResolved);
        require!(!user_bet.claimed, ErrorCode::AlreadyClaimed);

        let outcome_yes = market.outcome.unwrap();
        let total_pool = market.total_yes.checked_add(market.total_no).unwrap();
        
        let payout: u64;

        if outcome_yes {
            // Winner is YES
            if user_bet.amount_yes > 0 {
                // Formula: (UserYes / TotalYes) * TotalPool
                // We do multiplication first to avoid precision loss
                // Warning: In production, use fixed-point math libraries for better precision
                payout = (user_bet.amount_yes as u128)
                    .checked_mul(total_pool as u128).unwrap()
                    .checked_div(market.total_yes as u128).unwrap() as u64;
            } else {
                return Err(ErrorCode::YouLost.into());
            }
        } else {
             // Winner is NO
             if user_bet.amount_no > 0 {
                payout = (user_bet.amount_no as u128)
                    .checked_mul(total_pool as u128).unwrap()
                    .checked_div(market.total_no as u128).unwrap() as u64;
             } else {
                return Err(ErrorCode::YouLost.into());
             }
        }

        // Transfer Payout from Vault to User
        let external_id = &market.external_id;
        let seeds = &[
            MARKET_SEED,
            external_id.as_bytes(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: market.to_account_info(), // Market PDA owns the Vault
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, payout)?;

        user_bet.claimed = true;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(external_id: String)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = Market::MAX_SIZE,
        seeds = [MARKET_SEED, external_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = market
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserBet::SIZE,
        seeds = [BET_SEED, market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub market: Account<'info, Market>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [BET_SEED, market.key().as_ref(), user.key().as_ref()],
        bump = user_bet.bump,
        has_one = owner
    )]
    pub user_bet: Account<'info, UserBet>,

    #[account(
        mut,
        seeds = [VAULT_SEED, market.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    /// CHECK: Just checking the owner matches
    pub owner: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

