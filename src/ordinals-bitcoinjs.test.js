require('./jest-to-be-buffer')
const ordinalsBitcoinjs = require('./ordinals-bitcoinjs')
const bitcoinjsLib = require('bitcoinjs-lib')

const {
  ECPair,
  createRevealTx,
  createCommitTxData,
  witnessStackToScriptWitness,
  createTextInscription,
  toXOnly,
} = ordinalsBitcoinjs

describe('bitcoin inscriptions using bitcoinjs', () => {
  const secret = 'fc7458de3d5616e7803fdc81d688b9642641be32fee74c4558ce680cac3d4111'
  const privateKey = Buffer.from(secret, 'hex')
  const keypair = ECPair.fromPrivateKey(privateKey)
  const publicKey = keypair.publicKey

  test('validate keys', () => {
    expect(publicKey).toBeBuffer(
      '03d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151'
    )
    expect(toXOnly(publicKey)).toBeBuffer(
      'd734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151'
    )
    expect(privateKey).toBeBuffer(
      'fc7458de3d5616e7803fdc81d688b9642641be32fee74c4558ce680cac3d4111'
    )
  })

  test('witnessStackToScriptWitness', () => {
    expect(
      witnessStackToScriptWitness([Buffer.from('11', 'hex'), Buffer.from('ABCD', 'hex')])
    ).toBeBuffer('02011102abcd')
  })

  test('createCommitTxData of Hello!!', () => {
    const inscription = createTextInscription({ text: 'Hello!!' })
    const commitTxData = createCommitTxData({ publicKey, inscription })

    expect(commitTxData).toEqual({
      cblock: 'c1d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151',
      script: [
        expect.toBeBuffer('d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151'),
        bitcoinjsLib.opcodes.OP_CHECKSIG,
        bitcoinjsLib.opcodes.OP_0,
        bitcoinjsLib.opcodes.OP_IF,
        expect.toBeBuffer('6f7264'),
        1,
        1,
        expect.toBeBuffer('746578742f706c61696e3b636861727365743d7574662d38'),
        bitcoinjsLib.opcodes.OP_0,
        expect.toBeBuffer('48656c6c6f2121'),
        bitcoinjsLib.opcodes.OP_ENDIF,
      ],
      scriptTaproot: expect.any(Object),
      tapleaf: '13caa908fa38108fa21fcc47e99764ed5da8e579aed0a5af2c50c02257efeee9',
      tpubkey: 'a56d17d8e7c732e3721c21b1df3a0643c0e4260efb524d01bb0cce1ff4ca0766',
      revealAddress: 'bc1p54k30k88cuewxusuyxca7wsxg0qwgfswldfy6qdmpn8plax2qanq9wtlsw',
      outputScript: expect.toBeBuffer(
        '20d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151ac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d38000748656c6c6f212168'
      ),
    })
  })

  test('createRevealTx of Hello!!', async () => {
    const inscription = createTextInscription({ text: 'Hello!!' })
    const commitTxData = createCommitTxData({
      publicKey,
      inscription,
    })

    const toAddress = 'bc1pcf8yrw8vf5y3lxlmkjqlme7wpqywmqsdhr5ngzwvgpx63ww706fq3y4x0q'

    const padding = 549
    const txSize = 600 + Math.floor(inscription.content.length / 4)
    const feeRate = 2
    const minersFee = txSize * feeRate

    const requiredAmount = 550 + minersFee + padding

    expect(requiredAmount).toEqual(2301)

    const commitTxResult = {
      txId: 'd2e8358a8f6257ed6fc5eabe4e85951b702918a7a5d5b79a45e535e1d5d65fb2',
      sendUtxoIndex: 1,
      sendAmount: requiredAmount,
    }

    const revelRawTx = await createRevealTx({
      commitTxData,
      commitTxResult,
      toAddress,
      privateKey,
      amount: padding,
    })

    const rawTxWithoutSignature = revelRawTx.rawTx.replace(revelRawTx.signature, '<SIGNATURE>')
    expect(rawTxWithoutSignature).toEqual(
      '02000000000101b25fd6d5e135e5459ab7d5a5a71829701b95854ebeeac56fed57628f8a35e8d20100000000ffffffff012502000000000000225120c24e41b8ec4d091f9bfbb481fde7ce0808ed820db8e93409cc404da8b9de7e920340<SIGNATURE>4d20d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f151ac0063036f7264010118746578742f706c61696e3b636861727365743d7574662d38000748656c6c6f21216821c1d734e09fc6ed105225ff316c6fa74f89096f90a437b1c7001af6d0b244d6f15100000000'
    )

    expect(revelRawTx).toEqual({
      txId: 'e79beb0fe7d1aaa6a1ffd589ad95f52c54b1137b9c6620f0fcc56631db8f020c',
      inscriptionId: 'e79beb0fe7d1aaa6a1ffd589ad95f52c54b1137b9c6620f0fcc56631db8f020ci0',
      rawTx: expect.any(String),
      signature: expect.any(String),
      virtualSize: 139,
    })
  })
})
