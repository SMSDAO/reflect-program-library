// src/lib.rs
use anchor_lang::prelude::*;
pub use instructions::bid_manager::{self, PlaceBid, place_bid};
pub use instructions::initialize_ob::{self, InitializeOrderBook};

pub mod instructions;
pub mod states;
pub mod errors;
pub mod utils;

declare_id!("2saZdaCQioYutAv8aFXyLgnJWs2QSnMEFtvKGeUc4PUj");

#[program]
pub mod solana_stake_market {
    use super::*;
    use crate::instructions::initialize_ob::{InitializeOrderBook, handler as initialize_order_book_handler};

    pub fn place_bid(
        ctx: Context<PlaceBid>,
        rate: u64,
        amount: u64
    ) -> Result<()> {
        instructions::place_bid(ctx, rate, amount)
    }

    pub fn initialize_order_book_wrapper(
        ctx: Context<InitializeOrderBook>
    ) -> Result<()> {
        initialize_order_book_handler(ctx)
    }
}

pub use instructions::*;
pub use states::*;
