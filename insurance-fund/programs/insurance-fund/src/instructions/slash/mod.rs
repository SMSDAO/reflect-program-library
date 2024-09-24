// Initializes slash account.
pub mod initialize_slash;
pub use initialize_slash::*;

// Slashes the pool.
pub mod slash_pool;
pub use slash_pool::*;

// Slashes individual pools.
pub mod slash_deposits;
pub use slash_deposits::*;