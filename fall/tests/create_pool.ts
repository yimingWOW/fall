import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import type { Fall } from '../target/types/fall';
import { mintingTokens } from './utils';
import { type TestValues, createValues } from './mock_value';

describe('Create pool', () => {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  anchor.setProvider(provider);

  const program = anchor.workspace.Fall as Program<Fall>;
  let values: TestValues;

  beforeEach(async () => {
    values = createValues();

    await program.methods.createAmm(values.id).accounts({
      amm: values.ammKey,
      admin: values.admin.publicKey
    } as any).rpc();

    await mintingTokens({
      connection,
      creator: values.admin,
      mintAKeypair: values.mintAKeypair,
      mintBKeypair: values.mintBKeypair,
    });
  });

  it('Creation', async () => {
    try {
      const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ 
          units: 500_000 
      });
      await program.methods.createPool(values.fee).accounts({
            amm: values.ammKey,
            pool: values.poolKey,
            poolAuthority: values.poolAuthority,
            mintLiquidity: values.mintLiquidity,
            mintA: values.mintAKeypair.publicKey,
            mintB: values.mintBKeypair.publicKey,
            poolAccountA: values.poolAccountA,
            poolAccountB: values.poolAccountB,
        } as any).preInstructions([modifyComputeUnits]).rpc();
    } catch (error) {
        console.error("Error during create pool:", error);
        if (error.logs) {
        console.log("Error logs:");
        error.logs.forEach(log => console.log(log));
        }
        throw error;
    }
  });
});