import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Truthblink } from "../target/types/truthblink";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("truthblink", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Truthblink as Program<Truthblink>;

  // Test state
  const authority = Keypair.generate(); // Admin
  const user1 = Keypair.generate();     // Better YES
  const user2 = Keypair.generate();     // Better NO
  
  let marketPda: PublicKey;
  let vaultPda: PublicKey;
  let user1BetPda: PublicKey;
  let user2BetPda: PublicKey;
  
  let mint: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  
  const externalId = "polymarket_event_123";

  before(async () => {
    // Airdrop SOL to users
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Create a mock USDC mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    );

    // Create token accounts for users
    user1TokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      user1.publicKey
    );
    user2TokenAccount = await createAccount(
      provider.connection,
      authority,
      mint,
      user2.publicKey
    );

    // Mint tokens to users (1000 USDC each)
    await mintTo(
      provider.connection,
      authority,
      mint,
      user1TokenAccount,
      authority,
      1000_000000
    );
    await mintTo(
      provider.connection,
      authority,
      mint,
      user2TokenAccount,
      authority,
      1000_000000
    );

    // Derive PDAs
    [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(externalId)],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      program.programId
    );

    [user1BetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPda.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    [user2BetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPda.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Is initialized!", async () => {
    await program.methods
      .initializeMarket(externalId)
      .accounts({
        market: marketPda,
        vaultTokenAccount: vaultPda,
        mint: mint,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    assert.equal(market.externalId, externalId);
    assert.ok(market.totalYes.eq(new anchor.BN(0)));
    assert.ok(market.totalNo.eq(new anchor.BN(0)));
  });

  it("User 1 bets YES", async () => {
    const amount = new anchor.BN(100_000000); // 100 USDC

    await program.methods
      .placeBet(amount, true) // true = YES
      .accounts({
        market: marketPda,
        userBet: user1BetPda,
        vaultTokenAccount: vaultPda,
        userTokenAccount: user1TokenAccount,
        user: user1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    const userBet = await program.account.userBet.fetch(user1BetPda);
    
    assert.ok(market.totalYes.eq(amount));
    assert.ok(userBet.amountYes.eq(amount));
  });

  it("User 2 bets NO", async () => {
    const amount = new anchor.BN(50_000000); // 50 USDC

    await program.methods
      .placeBet(amount, false) // false = NO
      .accounts({
        market: marketPda,
        userBet: user2BetPda,
        vaultTokenAccount: vaultPda,
        userTokenAccount: user2TokenAccount,
        user: user2.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    const userBet = await program.account.userBet.fetch(user2BetPda);
    
    assert.ok(market.totalNo.eq(amount));
    assert.ok(userBet.amountNo.eq(amount));
  });

  it("Resolves the market (YES wins)", async () => {
    await program.methods
      .resolveMarket(true)
      .accounts({
        market: marketPda,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const market = await program.account.market.fetch(marketPda);
    assert.isTrue(market.resolved);
    assert.isTrue(market.outcome);
  });

  it("User 1 claims winnings", async () => {
    // Total Pool = 100 (YES) + 50 (NO) = 150
    // User 1 share = 100/100 = 100% of YES side
    // Payout = (100 / 100) * 150 = 150 USDC

    const initialBalance = (await getAccount(provider.connection, user1TokenAccount)).amount;

    await program.methods
      .claimWinnings()
      .accounts({
        market: marketPda,
        userBet: user1BetPda,
        vaultTokenAccount: vaultPda,
        userTokenAccount: user1TokenAccount,
        user: user1.publicKey,
        owner: user1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    const finalBalance = (await getAccount(provider.connection, user1TokenAccount)).amount;
    const userBet = await program.account.userBet.fetch(user1BetPda);

    assert.isTrue(userBet.claimed);
    // 150_000000 gained
    assert.equal(Number(finalBalance - initialBalance), 150_000000);
  });

  it("User 2 tries to claim (and fails)", async () => {
    try {
      await program.methods
        .claimWinnings()
        .accounts({
          market: marketPda,
          userBet: user2BetPda,
          vaultTokenAccount: vaultPda,
          userTokenAccount: user2TokenAccount,
          user: user2.publicKey,
          owner: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.include(e.message, "You lost the bet");
    }
  });
});

