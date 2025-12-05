import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionError,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { BN, Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import IDL from "@/lib/idl/truthblink.json";
import { fetchMarketOdds, formatOdds, formatVolume, fetchEventOutcomes } from "@/lib/polymarket-odds";
import { getMarketById } from "@/lib/polymarket";
import { BASE_URL } from "@/lib/constants";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const marketId = requestUrl.searchParams.get("marketId");

    if (!marketId) {
      const error: ActionError = { message: "Missing marketId parameter" };
      return Response.json(error, { status: 400, headers });
    }

    // Fetch event details with all outcomes
    const [market, eventDetails, odds] = await Promise.all([
      getMarketById(marketId),
      fetchEventOutcomes(marketId),
      fetchMarketOdds(marketId),
    ]);

    // Use the actual Polymarket title
    const title = eventDetails?.title || market?.question || `Market: ${marketId}`;
    const image = eventDetails?.image || market?.image || 
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800";

    // Build Polymarket link using slug (correct format)
    const polymarketUrl = marketId.startsWith('demo-') 
      ? null 
      : `https://polymarket.com/event/${eventDetails?.slug || marketId}`;

    // Get outcomes (sorted by probability)
    const outcomes = eventDetails?.outcomes || [];
    const hasMultipleOutcomes = outcomes.length > 2 || 
      (outcomes.length > 0 && outcomes[0].name !== "Yes");

    // Build description with outcomes and Polymarket link
    let description = "";
    
    if (hasMultipleOutcomes && outcomes.length > 0) {
      // Show top outcomes for multi-outcome markets
      const topOutcomes = outcomes.slice(0, 4);
      const oddsStr = topOutcomes.map(o => `${o.name}: ${o.percentage}`).join(" • ");
      description = `📊 ${oddsStr}`;
      if (outcomes.length > 4) {
        description += ` (+${outcomes.length - 4} more)`;
      }
    } else if (odds && !isNaN(odds.yesPrice) && !isNaN(odds.noPrice)) {
      const yesOdds = formatOdds(odds.yesPrice);
      const noOdds = formatOdds(odds.noPrice);
      const volume = formatVolume(odds.volume24h);
      description = `📊 YES ${yesOdds} | NO ${noOdds} • 💰 Volume: ${volume}`;
    }
    
    if (polymarketUrl) {
      description += `\n\n🔗 View on Polymarket: ${polymarketUrl}`;
    }
    description += `\n\nPlace your bet using USDC on Solana!`;

    // Build actions based on outcomes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions: any[] = [];
    
    if (hasMultipleOutcomes && outcomes.length > 0) {
      // Multi-outcome market: show top outcomes as betting options
      for (const outcome of outcomes.slice(0, 4)) {
        actions.push({
          type: "transaction",
          label: `${outcome.name} (${outcome.percentage})`,
          href: `${BASE_URL}/api/actions/bet?marketId=${encodeURIComponent(marketId)}&side=${encodeURIComponent(outcome.name)}&amount={amount}`,
          parameters: [
            {
              name: "amount",
              label: "Amount (USDC)",
              required: true,
              type: "number",
            },
          ],
        });
      }
    } else {
      // Binary Yes/No market
      const yesLabel = odds && !isNaN(odds.yesPrice) 
        ? `✅ YES ${formatOdds(odds.yesPrice)}`
        : "✅ YES";
      const noLabel = odds && !isNaN(odds.noPrice)
        ? `❌ NO ${formatOdds(odds.noPrice)}`
        : "❌ NO";

      actions.push(
          {
            type: "transaction",
          label: yesLabel,
          href: `${BASE_URL}/api/actions/bet?marketId=${encodeURIComponent(marketId)}&side=yes&amount={amount}`,
            parameters: [
              {
                name: "amount",
                label: "Amount (USDC)",
                required: true,
                type: "number",
              },
            ],
          },
          {
            type: "transaction",
          label: noLabel,
          href: `${BASE_URL}/api/actions/bet?marketId=${encodeURIComponent(marketId)}&side=no&amount={amount}`,
            parameters: [
              {
                name: "amount",
                label: "Amount (USDC)",
                required: true,
                type: "number",
              },
            ],
        }
      );
    }

    const payload: ActionGetResponse = {
      type: "action",
      title: title.replace(/🎯\s*/g, "").trim(),
      icon: image,
      description,
      label: "Bet",
      links: {
        actions,
      },
    };

    return Response.json(payload, { headers });
  } catch (err) {
    console.error("GET Error:", err);
    const error: ActionError = { message: "Failed to fetch market data" };
    return Response.json(error, { status: 500, headers });
  }
};

export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const marketId = requestUrl.searchParams.get("marketId");
    const side = requestUrl.searchParams.get("side");
    const amountParam = requestUrl.searchParams.get("amount");

    if (!marketId || !side || !amountParam) {
      const error: ActionError = {
        message: "Missing required parameters: marketId, side, or amount",
      };
      return Response.json(error, { status: 400, headers });
    }

    const body: ActionPostRequest = await req.json();

    // Validate user public key
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(body.account);
    } catch {
      const error: ActionError = { message: "Invalid account public key" };
      return Response.json(error, { status: 400, headers });
    }

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    // Create a read-only provider for building transactions
    const dummyKeypair = Keypair.generate();
    const dummyWallet = {
      publicKey: dummyKeypair.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
    };

    const provider = new AnchorProvider(connection, dummyWallet as AnchorProvider["wallet"], {
      commitment: "confirmed",
    });

    const program = new Program(IDL as Idl, PROGRAM_ID, provider);

    // Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketId)],
      PROGRAM_ID
    );

    const [userBetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPda.toBuffer(), userPubkey.toBuffer()],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      PROGRAM_ID
    );

    // Get user's USDC token account
    const userTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      userPubkey
    );

    // Build instructions array
    const instructions: TransactionInstruction[] = [];

    // Check if user's token account exists, if not create it
    try {
      await getAccount(connection, userTokenAccount);
    } catch {
      // Token account doesn't exist, add instruction to create it
      instructions.push(
        createAssociatedTokenAccountInstruction(
          userPubkey, // payer
          userTokenAccount, // ata
          userPubkey, // owner
          USDC_MINT // mint
        )
      );
    }

    // Parse amount (USDC has 6 decimals)
    const amount = Math.floor(parseFloat(amountParam) * 1_000_000);
    if (amount <= 0) {
      const error: ActionError = { message: "Amount must be greater than 0" };
      return Response.json(error, { status: 400, headers });
    }

    const sideBoolean = side.toLowerCase() === "yes";

    // Build the placeBet instruction
    const placeBetIx = await program.methods
      .placeBet(new BN(amount), sideBoolean)
      .accounts({
        market: marketPda,
        userBet: userBetPda,
        vaultTokenAccount: vaultPda,
        userTokenAccount: userTokenAccount,
        user: userPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    instructions.push(placeBetIx);

    // Create the transaction
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: userPubkey,
      blockhash,
      lastValidBlockHeight,
    }).add(...instructions);

    // Get market info for message
    const market = await getMarketById(marketId);
    const marketTitle = market?.question || marketId;

    // Return the Solana Action response
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `🎯 Betting ${amountParam} USDC on ${side.toUpperCase()} for "${marketTitle}"`,
      },
    });

    return Response.json(payload, { headers });
  } catch (err) {
    console.error("POST Error:", err);
    const error: ActionError = {
      message: err instanceof Error ? err.message : "Failed to create transaction",
    };
    return Response.json(error, { status: 500, headers });
  }
};
