import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InsuranceFund } from "../target/types/insurance_fund";
import {
    PublicKey,
    Keypair,
    SystemProgram,
    LAMPORTS_PER_SOL,
    SYSVAR_CLOCK_PUBKEY,
    TransactionMessage
} from "@solana/web3.js";
import {before} from "mocha";
import {Deposit, Lockup, Settings, Slash} from "../sdk/generated";
import {expect} from "chai";
import createToken from "./helpers/createToken";
import BN from "bn.js";
import {
    createAssociatedTokenAccountInstruction, getAccount,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import sleep from "./helpers/sleep";
import mintTokens from "./helpers/mintTokens";
import signAndSendTransaction from "./helpers/signAndSendTransaction";

describe("insurance-fund", () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);
    const program = anchor.workspace.InsuranceFund as Program<InsuranceFund>;

    let coldWallet: PublicKey;
    let settings: PublicKey;
    let user: Keypair;

    const lsts: PublicKey[] = [];

    before(async () => {
        coldWallet = Keypair.generate().publicKey;
        user  = Keypair.generate();

        [settings] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("settings")
            ],
            program.programId
        );

        await provider.connection.requestAirdrop(
            user.publicKey,
            LAMPORTS_PER_SOL * 10
        );
    })

    it("Initializes insurance fund.", async () => {
        await program
            .methods
            .initializeInsuranceFund({
                coldWallet,
                coldWalletShareBps: new BN(0.7 * 10_000),
                hotWalletShareBps: new BN(0.3 * 10_000)
            })
            .accounts({
                superadmin: provider.publicKey,
                settings,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const {
            coldWallet: setColdWallet,
            superadmin,
            bump,
            lockups,
            assets,
            depositsLocked
        } = await Settings.fromAccountAddress(
            provider.connection,
            settings
        );

        expect(setColdWallet.toString()).eq(coldWallet.toString());
        expect(lockups.toString()).eq("0");
        expect(superadmin.toString()).eq(provider.publicKey.toString());
        expect(assets.length).eq(0);
        expect(depositsLocked).eq(false);
    });

    it("Mints and adds assets to insurance pool.", async () => {
        for (let i = 0; i < 3; i ++) {
            const token = await createToken(
                provider.connection,
                provider
            );

            lsts.push(token);

            await program
                .methods
                .addAsset()
                .accounts({
                    asset: token,
                    settings,
                    superadmin: provider.publicKey,
                    // Just to pass the test
                    oracle: new PublicKey("CLAwKhTHcq2f6gKYYyNP6hTYvqBmQkPsoF9oEGJTfNWn")
                })
                .rpc()
        }

        const {
            assets,
        } = await Settings.fromAccountAddress(
            provider.connection,
            settings
        );

        for (let asset of assets) {
            // Skipping checking oracle for now.
            expect(lsts.map(l => l.toString())).include(asset.mint.toString());
            expect(asset.tvl.toString()).eq("0");
        }
    });

    it("Initializes lockups", async () => {
        for (let [j, mint] of lsts.entries()) {
            const MONTH = 30 * 24 * 60 * 60;

            for (let i = 0; i < 4; i ++) {
                const duration = new BN((i + 1) * 3 * MONTH);

                const lockupId = j * 4 + i;
                const [lockup] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("lockup"),
                        new BN(lockupId).toArrayLike(Buffer, "le", 8)
                    ],
                    program.programId
                );

                const [assetLockup] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("vault"),
                        lockup.toBuffer(),
                        mint.toBuffer(),
                    ],
                    program.programId
                );

                await program
                    .methods
                    .initializeLockup({
                        asset: mint,
                        minDeposit: new BN(1), // 1 token for now
                        duration,
                        yieldBps: new BN(i * 3 * 100),
                        boosts: [],
                        yieldMode: {
                            single: { 0: [new BN(1)] } // 1 rUSD per 1 unit of deposit [lamport] per one lockup period
                        },
                        depositCap: new BN(LAMPORTS_PER_SOL * 100_000)
                    })
                    .accounts({
                        superadmin: provider.publicKey,
                        settings,
                        lockup,
                        assetMint: mint,
                        assetLockup,
                        tokenProgram: TOKEN_PROGRAM_ID
                    })
                    .rpc();

                const {
                    asset,
                    bump,
                    duration: setDuration,
                    yieldBps,
                    minDeposit,
                    yieldMode,
                    index,
                    deposits,
                    depositCap,
                    rewardBoosts,
                    slashState
                } = await Lockup.fromAccountAddress(
                    provider.connection,
                    lockup
                );

                expect(asset.toString()).eq(mint.toString());
                expect(setDuration.toString()).eq(duration.toString());
                expect(yieldBps.toString()).eq(`${ i * 3 * 100 }`);
                expect(minDeposit.toString()).eq("1");
                expect(yieldMode.__kind).eq("Single");
                expect(yieldMode.fields.length).eq(1);
                expect(yieldMode.fields[0].toString()).eq("1");
                expect(index.toString()).eq(lockupId.toString());
                expect(deposits.toString()).eq("0");
                expect(depositCap.toString()).eq(`${ LAMPORTS_PER_SOL * 100_000 }`);
                expect(rewardBoosts.length.toString()).eq("0");
                expect(slashState.index.toString()).eq("0");
                expect(slashState.amount.toString()).eq("0");
            }
        }
    });

    it("Lock-ups tokens.", async () => {
        const lockupId = new BN(0);

        const [lockup] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("lockup"),
                lockupId.toArrayLike(Buffer, "le", 8)
            ],
            program.programId
        );

        const lockupData = await Lockup.fromAccountAddress(
            provider.connection,
            lockup
        );

        const [assetLockup] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),
                lockup.toBuffer(),
                lockupData.asset.toBuffer(),
            ],
            program.programId
        );

        const amount = new BN(LAMPORTS_PER_SOL * 1_000);
        await mintTokens(
            lockupData.asset,
            provider,
            amount.toNumber(),
            user.publicKey
        );

        const [deposit] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("deposit"),
                lockup.toBuffer(),
                new BN(lockupData.deposits).toArrayLike(Buffer, "le", 8)
            ],
            program.programId
        );

        const coldWalletVault = getAssociatedTokenAddressSync(
            lockupData.asset,
            coldWallet,
            true
        );

        const userAssetAta = getAssociatedTokenAddressSync(
            lockupData.asset,
            user.publicKey
        );

        const [lockupAssetVault] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),
                lockup.toBuffer(),
                lockupData.asset.toBuffer(),
            ],
            program.programId
        );

        const coldWalletAtaIx = createAssociatedTokenAccountInstruction(
            user.publicKey,
            coldWalletVault,
            coldWallet,
            lockupData.asset
        );

        const ix = await program
            .methods
            .restake({
                lockupId,
                amount
            })
            .accounts({
                user: user.publicKey,
                settings,
                lockup,
                deposit,
                coldWallet,
                coldWalletVault,
                assetMint: lockupData.asset,
                userAssetAta,
                lockupAssetVault,
                clock: SYSVAR_CLOCK_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .instruction();

        const { lastValidBlockHeight, blockhash } = await provider.connection.getLatestBlockhash();
        const message = new TransactionMessage({
            payerKey: user.publicKey,
            instructions: [coldWalletAtaIx, ix],
            recentBlockhash: blockhash
        }).compileToV0Message();

        const transactionTimestamp = Math.floor(Date.now() / 1000);
        await signAndSendTransaction(
            message,
            provider.connection,
            false,
            [user]
        );

        const lockupVaultData = await getAccount(
            provider.connection,
            lockupAssetVault
        );

        const coldWalletVaultData = await getAccount(
            provider.connection,
            coldWalletVault
        );

        expect(parseInt(lockupVaultData.amount.toString()))
            .approximately(
                Math.floor(0.3 * amount.toNumber()),
                1000
            );

        expect(parseInt(coldWalletVaultData.amount.toString()))
            .approximately(
                Math.floor(0.7 * amount.toNumber()),
                1000
            );

        const {
            user: userPointer,
            lockup: lockupPointer,
            amount: depositedAmount,
            initialUsdValue,
            lastSlashed,
            amountSlashed,
            unlockTs
        } = await Deposit.fromAccountAddress(
            provider.connection,
            deposit
        );

        expect(userPointer.toString()).eq(user.publicKey.toString());
        expect(lockupPointer.toString()).eq(lockup.toString());
        expect(depositedAmount.toString()).eq(amount.toString());
        // expect(initialUsdValue).eq("");
        expect(lastSlashed).eq(null);
        expect(amountSlashed.toString()).eq("0");
        expect(parseInt(unlockTs.toString()))
            .approximately(
                transactionTimestamp + parseInt(lockupData.duration.toString()),
                10 // 10 seconds delta
            );
    });

    it("Slashes lockup", async () => {
        const lockupId = new BN(0);

        const [lockup] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("lockup"),
                lockupId.toArrayLike(Buffer, "le", 8)
            ],
            program.programId
        );

        const lockupData = await Lockup.fromAccountAddress(
            provider.connection,
            lockup
        );

        const [assetLockup] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),
                lockup.toBuffer(),
                lockupData.asset.toBuffer(),
            ],
            program.programId
        );

        const slashId = new BN(lockupData.slashState.index);
        const slashAmount = new BN(LAMPORTS_PER_SOL * 200);

        const assetLockupData = await getAccount(
            provider.connection,
            assetLockup
        );

        expect(parseInt(assetLockupData.amount.toString()))
            .gte(slashAmount.toNumber());

        const [slash] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("slash"),
                lockup.toBuffer(),
                slashId.toArrayLike(Buffer, "le", 8)
            ],
            program.programId
        );

        // Initialize slash
        await program
            .methods
            .initializeSlash({
                amount: slashAmount,
                lockupId
            })
            .accounts({
                settings,
                superadmin: provider.publicKey,
                lockup,
                assetMint: lockupData.asset,
                assetLockup,
                slash,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            })
            .rpc();

        const {
            slashedAccounts: initialSlashedAccounts,
            slashedAmount: initialSlashedAmount,
            targetAccounts: initialTargetAccounts,
            targetAmount: initialTargetAmount,
        } = await Slash.fromAccountAddress(
            provider.connection,
            slash
        );

        expect(initialSlashedAccounts.toString()).eq("0");
        expect(initialSlashedAmount.toString()).eq("0");
        expect(initialTargetAccounts.toString()).eq(`${ lockupData.deposits.toString() }`);
        expect(initialTargetAmount.toString()).eq(slashAmount.toString());

        const targetDeposits = parseInt(lockupData.deposits.toString());
        const depositsToSlash = [];
        for (let i = 0; i < targetDeposits; ++i) {
            const [deposit] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("deposit"),
                    lockup.toBuffer(),
                    new BN(i).toArrayLike(Buffer, "le", 8)
                ],
                program.programId
            );

            depositsToSlash.push(deposit);
        }

        // Slash individual deposits
        await program
            .methods
            .slashDeposits({
                lockupId,
                slashId,
                slashAmount
            })
            .accounts({
                settings,
                superadmin: provider.publicKey,
                lockup,
                assetMint: lockupData.asset,
                assetLockup,
                slash,
            })
            .remainingAccounts(depositsToSlash.map((deposit) => {
                return {
                    pubkey: deposit,
                    isSigner: false,
                    isWritable: true
                }
            }))
            .rpc();

        const {
            slashedAccounts: slashedDeposits,
            slashedAmount: slashedAmountFromDeposits,
        } = await Slash.fromAccountAddress(
            provider.connection,
            slash
        );

        console.log({
            slashedDeposits: slashedDeposits.toString(),
            slashedAmountFromDeposits: slashedAmountFromDeposits.toString()
        })

        const coldWalletVault = getAssociatedTokenAddressSync(
            lockupData.asset,
            coldWallet,
            true
        );

        // Slash entire pool
        await program
            .methods
            .slashPool({
                lockupId,
                slashId
            })
            .accounts({
                settings,
                superadmin: provider.publicKey,
                lockup,
                asset: lockupData.asset,
                assetLockup,
                slash,
                tokenProgram: TOKEN_PROGRAM_ID,
                destination: coldWalletVault,
            })
            .rpc();
    });
});
