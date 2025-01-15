import * as anchor from '@coral-xyz/anchor';
import type { Program } from '@coral-xyz/anchor';
import { expect } from 'chai';
import type { Fall } from '../target/types/fall';
import { type TestValues, createValues } from './mock_value';


describe('Create AMM', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Fall as Program<Fall>;
  let values: TestValues;
  beforeEach(() => {
    values = createValues();
  });

  it('Creation', async () => {
    await program.methods.createAmm(values.id).accounts({ 
      amm: values.ammKey,
      admin: values.admin.publicKey 
    }as any).rpc();

    const ammAccount = await program.account.amm.fetch(values.ammKey);
    expect(ammAccount.id.toString()).to.equal(values.id.toString());
    expect(ammAccount.admin.toString()).to.equal(values.admin.publicKey.toString());
  });

});