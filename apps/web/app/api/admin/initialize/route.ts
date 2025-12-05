import { NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM_ID, USDC_MINT } from "@/lib/constants";
import IDL from "@/lib/idl/truthblink.json";
import bs58 from "bs58";

// POST /api/admin/initialize
// Body: { marketId: string }
// Headers: Authorization: Bearer <ADMIN_KEY>
export async function POST(req: Request) {
  try {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { marketId } = await req.json();

    if (!marketId || typeof marketId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid marketId" },
        { status: 400 }
      );
    }

    // Load admin wallet
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: "Admin wallet not configured" },
        { status: 500 }
      );
    }

    const adminKeypair = Keypair.fromSecretKey(bs58.decode(adminPrivateKey));

    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    const wallet = {
      publicKey: adminKeypair.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        if (tx instanceof Transaction) {
          tx.sign(adminKeypair);
        }
        return tx;
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        txs.forEach((tx) => {
          if (tx instanceof Transaction) {
            tx.sign(adminKeypair);
          }
        });
        return txs;
      },
    };

    const provider = new AnchorProvider(connection, wallet as AnchorProvider["wallet"], {
      commitment: "confirmed",
    });

    const program = new Program(IDL as Idl, PROGRAM_ID, provider);

    // Derive PDAs
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketId)],
      PROGRAM_ID
    );

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      PROGRAM_ID
    );

    // Check if market already exists
    try {
      await program.account.market.fetch(marketPda);
      return NextResponse.json(
        { error: "Market already exists", marketPda: marketPda.toBase58() },
        { status: 400 }
      );
    } catch {
      // Market doesn't exist, continue
    }

    // Initialize the market
    const tx = await program.methods
      .initializeMarket(marketId)
      .accounts({
        market: marketPda,
        vaultTokenAccount: vaultPda,
        mint: USDC_MINT,
        authority: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return NextResponse.json({
      success: true,
      signature: tx,
      marketId,
      marketPda: marketPda.toBase58(),
      vaultPda: vaultPda.toBase58(),
    });
  } catch (error) {
    console.error("Initialize Market Error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize market",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

