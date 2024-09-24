/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
export type BoostRewardsArgs = {
  lockupId: beet.bignum
  minUsdValue: beet.bignum
  boostBps: beet.bignum
}

/**
 * @category userTypes
 * @category generated
 */
export const boostRewardsArgsBeet = new beet.BeetArgsStruct<BoostRewardsArgs>(
  [
    ['lockupId', beet.u64],
    ['minUsdValue', beet.u64],
    ['boostBps', beet.u64],
  ],
  'BoostRewardsArgs'
)
