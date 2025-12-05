import { NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "@/lib/constants";
import IDL from "@/lib/idl/truthblink.json";
import bs58 from "bs58";

// POST /api/resolve
// Body: { marketId: string, outcomeYes: boolean }
// Headers: Authorization: Bearer <ADMIN_KEY>
export async function POST(req: Request) {
  try {
    // Check authorization (simple bearer token check)
    const authHeader = req.headers.get("authorization");
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { marketId, outcomeYes } = await req.json();

    if (!marketId || typeof outcomeYes !== "boolean") {
      return NextResponse.json(
        { error: "Missing marketId or outcomeYes" },
        { status: 400 }
      );
    }

    // Load admin wallet from env
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

    // Derive market PDA
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketId)],
      PROGRAM_ID
    );

    // Call resolveMarket
    const tx = await program.methods
      .resolveMarket(outcomeYes)
      .accounts({
        market: marketPda,
        authority: adminKeypair.publicKey,
      })
      .rpc();

    return NextResponse.json({
      success: true,
      signature: tx,
      marketId,
      outcome: outcomeYes ? "YES" : "NO",
    });
  } catch (error) {
    console.error("Resolve API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve market",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

