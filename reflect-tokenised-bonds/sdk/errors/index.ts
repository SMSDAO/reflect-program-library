/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

type ErrorWithCode = Error & { code: number }
type MaybeErrorWithCode = ErrorWithCode | null | undefined

const createErrorFromCodeLookup: Map<number, () => ErrorWithCode> = new Map()
const createErrorFromNameLookup: Map<string, () => ErrorWithCode> = new Map()

/**
 * InvalidVaultSeed: 'Vault PDA is derived with invalid vault seed.'
 *
 * @category Errors
 * @category generated
 */
export class InvalidVaultSeedError extends Error {
  readonly code: number = 0x1770
  readonly name: string = 'InvalidVaultSeed'
  constructor() {
    super('Vault PDA is derived with invalid vault seed.')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidVaultSeedError)
    }
  }
}

createErrorFromCodeLookup.set(0x1770, () => new InvalidVaultSeedError())
createErrorFromNameLookup.set(
  'InvalidVaultSeed',
  () => new InvalidVaultSeedError()
)

/**
 * InsufficientDeposit: 'Insufficient deposit amount.'
 *
 * @category Errors
 * @category generated
 */
export class InsufficientDepositError extends Error {
  readonly code: number = 0x1771
  readonly name: string = 'InsufficientDeposit'
  constructor() {
    super('Insufficient deposit amount.')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InsufficientDepositError)
    }
  }
}

createErrorFromCodeLookup.set(0x1771, () => new InsufficientDepositError())
createErrorFromNameLookup.set(
  'InsufficientDeposit',
  () => new InsufficientDepositError()
)

/**
 * LockupNotExpired: 'Lockup period has not expired.'
 *
 * @category Errors
 * @category generated
 */
export class LockupNotExpiredError extends Error {
  readonly code: number = 0x1772
  readonly name: string = 'LockupNotExpired'
  constructor() {
    super('Lockup period has not expired.')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, LockupNotExpiredError)
    }
  }
}

createErrorFromCodeLookup.set(0x1772, () => new LockupNotExpiredError())
createErrorFromNameLookup.set(
  'LockupNotExpired',
  () => new LockupNotExpiredError()
)

/**
 * InvalidMintAuthority: 'Invalid mint authority. Move mint authority of the receipt token to the vault PDA.'
 *
 * @category Errors
 * @category generated
 */
export class InvalidMintAuthorityError extends Error {
  readonly code: number = 0x1773
  readonly name: string = 'InvalidMintAuthority'
  constructor() {
    super(
      'Invalid mint authority. Move mint authority of the receipt token to the vault PDA.'
    )
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidMintAuthorityError)
    }
  }
}

createErrorFromCodeLookup.set(0x1773, () => new InvalidMintAuthorityError())
createErrorFromNameLookup.set(
  'InvalidMintAuthority',
  () => new InvalidMintAuthorityError()
)

/**
 * InvalidFreezeAuthority: 'Invalid freeze authority. Move freeze authority of the receipt token to the vault PDA, or remove it completely.'
 *
 * @category Errors
 * @category generated
 */
export class InvalidFreezeAuthorityError extends Error {
  readonly code: number = 0x1774
  readonly name: string = 'InvalidFreezeAuthority'
  constructor() {
    super(
      'Invalid freeze authority. Move freeze authority of the receipt token to the vault PDA, or remove it completely.'
    )
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, InvalidFreezeAuthorityError)
    }
  }
}

createErrorFromCodeLookup.set(0x1774, () => new InvalidFreezeAuthorityError())
createErrorFromNameLookup.set(
  'InvalidFreezeAuthority',
  () => new InvalidFreezeAuthorityError()
)

/**
 * NonZeroReceiptSupply: 'Supply of the receipt token has to be 0. Pre-minting is not allowed.'
 *
 * @category Errors
 * @category generated
 */
export class NonZeroReceiptSupplyError extends Error {
  readonly code: number = 0x1775
  readonly name: string = 'NonZeroReceiptSupply'
  constructor() {
    super(
      'Supply of the receipt token has to be 0. Pre-minting is not allowed.'
    )
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NonZeroReceiptSupplyError)
    }
  }
}

createErrorFromCodeLookup.set(0x1775, () => new NonZeroReceiptSupplyError())
createErrorFromNameLookup.set(
  'NonZeroReceiptSupply',
  () => new NonZeroReceiptSupplyError()
)

/**
 * Attempts to resolve a custom program error from the provided error code.
 * @category Errors
 * @category generated
 */
export function errorFromCode(code: number): MaybeErrorWithCode {
  const createError = createErrorFromCodeLookup.get(code)
  return createError != null ? createError() : null
}

/**
 * Attempts to resolve a custom program error from the provided error name, i.e. 'Unauthorized'.
 * @category Errors
 * @category generated
 */
export function errorFromName(name: string): MaybeErrorWithCode {
  const createError = createErrorFromNameLookup.get(name)
  return createError != null ? createError() : null
}
