export const lockAddress = 'a3io3zMLfg9nchA3KSoSEvPz1tztnKDuaT';

export const baseTx = {
  id: '835b8bfb12b7e9b9d3d946458e38c628a2df8ba8059ac9c664360836157b994e',
  inputs: [
    {
      txId: '7f1a2e3d4c5b6a9e8f7d6c5b4a3e2d1c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4',
      index: 0,
      scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
    },
  ],
};

export const txUtxos = {
  lockTx: {
    outputs: [
      {
        scriptPubKey:
          '6a4b010000000100989680000000000098968039018dd8d9339deaf201790f6891adebb3abd78c90f3231aa95f12ce8f9ab18016dab2d790baeecb323f792babc1a769511b4a3262e6703f24c1',
        value: 0n,
      },
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 10000000n,
      },
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 15584394312n,
      },
    ],
  },
  lessBoxes: {
    outputs: [
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 15594394312n,
      },
    ],
  },
  noOpReturn: {
    outputs: [
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 10000000n,
      },
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 15584394312n,
      },
    ],
  },
  noLock: {
    outputs: [
      {
        scriptPubKey:
          '6a4b010000000100989680000000000098968039018dd8d9339deaf201790f6891adebb3abd78c90f3231aa95f12ce8f9ab18016dab2d790baeecb323f792babc1a769511b4a3262e6703f24c1',
        value: 0n,
      },
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ab',
        value: 15594394312n,
      },
    ],
  },
  invalidData: {
    outputs: [
      {
        scriptPubKey:
          '6a4b090000000000989680000000000098968039018dd8d9339deaf201790f6891adebb3abd78c90f3231aa95f12ce8f9ab18016dab2d790baeecb323f792babc1a769511b4a3262e6703f24c1',
        value: 0n,
      },
      {
        scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
        value: 15594394312n,
      },
    ],
  },
};

export const txs = {
  lockTx: {
    ...baseTx,
    ...txUtxos.lockTx,
  },
  lessBoxes: {
    ...baseTx,
    ...txUtxos.lessBoxes,
  },
  noOpReturn: {
    ...baseTx,
    ...txUtxos.noOpReturn,
  },
  noLock: {
    ...baseTx,
    ...txUtxos.noLock,
  },
  invalidData: {
    ...baseTx,
    ...txUtxos.invalidData,
  },
};

export const rosenData = {
  toChain: 'cardano',
  toAddress:
    'addr1qxxa3kfnnh40yqtepa5frt0tkw4a0rys7v33422lzt8glx43sqtd4vkhjzawajej8aujh27p5a54zx62xf3wvuplynqs3fsqet',
  bridgeFee: '10000000',
  networkFee: '10000000',
  fromAddress:
    'box:7f1a2e3d4c5b6a9e8f7d6c5b4a3e2d1c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4.0',
  sourceChainTokenId: 'firo',
  amount: '10000000',
  targetChainTokenId:
    'c15f1361f5eeba416dd63e059fce34f0c57499e9afe733ea0fd59cf63f49',
  sourceTxId:
    '835b8bfb12b7e9b9d3d946458e38c628a2df8ba8059ac9c664360836157b994e',
  rawData:
    '6a4b010000000100989680000000000098968039018dd8d9339deaf201790f6891adebb3abd78c90f3231aa95f12ce8f9ab18016dab2d790baeecb323f792babc1a769511b4a3262e6703f24c1',
};

export const lockUtxo = {
  scriptPubKey: '76a91420f87f7f202c3d40dea06df136862fdbeef3f8e788ac',
  value: 10000000n,
};

export const rsFiroCardanoTransformation = {
  from: 'firo',
  to: 'c15f1361f5eeba416dd63e059fce34f0c57499e9afe733ea0fd59cf63f49',
  amount: '10000000',
};

export const rsFiroErgoTransformation = {
  from: 'firo',
  to: 'e15f1361f5eeba416dd63e059fce34f0c57499e9afe733ea0fd59cf63f49',
  amount: '10000000',
};

export const rsFiroBitcoinTransformation = {
  amount: '10000000',
  from: 'firo',
  to: 'b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8.6669726f',
};
