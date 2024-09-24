/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category InitializeProtocol
 * @category generated
 */
export const initializeProtocolStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'InitializeProtocolInstructionArgs'
)
/**
 * Accounts required by the _initializeProtocol_ instruction
 *
 * @property [_writable_, **signer**] payer
 * @property [_writable_] rtbProtocol
 * @category Instructions
 * @category InitializeProtocol
 * @category generated
 */
export type InitializeProtocolInstructionAccounts = {
  payer: web3.PublicKey
  rtbProtocol: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initializeProtocolInstructionDiscriminator = [
  188, 233, 252, 106, 134, 146, 202, 91,
]

/**
 * Creates a _InitializeProtocol_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitializeProtocol
 * @category generated
 */
export function createInitializeProtocolInstruction(
  accounts: InitializeProtocolInstructionAccounts,
  programId = new web3.PublicKey('6ZZ1sxKGuXUBL8HSsHqHaYCg92G9VhMNTcJv1gFURCop')
) {
  const [data] = initializeProtocolStruct.serialize({
    instructionDiscriminator: initializeProtocolInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.payer,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.rtbProtocol,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}