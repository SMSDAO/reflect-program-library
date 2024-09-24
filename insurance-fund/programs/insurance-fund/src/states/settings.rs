use anchor_lang::{prelude::*};
use anchor_spl::token::{
    Transfer,
    transfer
};

use crate::errors::InsuranceFundError;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Copy, PartialEq)]
pub struct SharesConfig {
    pub hot_wallet_share_bps: u64,
    pub cold_wallet_share_bps: u64
}

impl SharesConfig {
    pub const SIZE: usize = 2 * 8;
}

#[account]
pub struct Settings {
    pub bump: u8,
    pub superadmin: Pubkey,
    pub cold_wallet: Pubkey,
    pub lockups: u64,
    pub shares_config: SharesConfig,
    pub frozen: bool,
}

impl Settings {
    pub const SIZE: usize = 8 + 1 + 2 * 32 + 8 + 1 + SharesConfig::SIZE;

    pub fn freeze(&mut self) {
        self.frozen = true;
    }

    pub fn calculate_cold_wallet_deposit(
        &self,
        amount: u64
    ) -> u64 {
        amount * self.shares_config.cold_wallet_share_bps / 10_000
    }

    pub fn calculate_hot_wallet_deposit(
        &self,
        amount: u64
    ) -> u64 {
        amount * self.shares_config.hot_wallet_share_bps / 10_000
    }
}