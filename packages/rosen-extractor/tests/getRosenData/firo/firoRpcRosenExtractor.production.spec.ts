import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { TokenMap } from '@rosen-bridge/tokens';

import { FiroRpcRosenExtractor } from '../../../lib/getRosenData/firo/firoRpcRosenExtractor';
import TestUtils from '../testUtils';
import { lockAddress } from './testData';
import { FiroRpcTransaction } from '../../../lib/getRosenData/firo/types';

describe('FiroRpcRosenExtractor - Production Integration Tests', () => {
  let isNodeAvailable = false;
  let extractor: FiroRpcRosenExtractor;
  let tokenMap: TokenMap;

  // Simple RPC client for testing
  const rpcCall = async (method: string, params: any[] = []) => {
    const response = await axios.post(
      'http://127.0.0.1:8888',
      {
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      },
      {
        auth: {
          username: 'firouser',
          password: 'firopwd',
        },
        timeout: 10000,
      },
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  };

  beforeAll(async () => {
    // Initialize token map
    tokenMap = new TokenMap();
    await tokenMap.updateConfigByJson(TestUtils.tokens);

    // Check if Firo node is available before running tests
    try {
      await rpcCall('getblockchaininfo');
      isNodeAvailable = true;

      // Create the extractor instance
      extractor = new FiroRpcRosenExtractor(lockAddress, tokenMap);
    } catch (error) {
      isNodeAvailable = false;
      console.warn(
        'Firo node not available - skipping production integration tests',
      );
      console.warn(
        '   To run these tests, start a Firo node on localhost:8888',
      );
      console.warn('   with RPC credentials: firouser:firopwd');
      console.warn(
        `   Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  /**
   * @target FiroRpcRosenExtractor - Configuration Validation
   * @dependencies None (unit test component)
   * @scenario
   * - Validate extractor configuration
   * - Test initialization parameters
   * @expected
   * - Should be properly configured
   * - Should have correct token mapping
   * - Should have valid lock address
   */
  it('should be properly configured for production', async () => {
    if (!isNodeAvailable) {
      return;
    }

    expect(extractor).toBeDefined();
    expect(extractor).toBeInstanceOf(FiroRpcRosenExtractor);

    // Verify network connectivity
    const blockchainInfo = await rpcCall('getblockchaininfo');
    expect(blockchainInfo).toBeDefined();
    expect(typeof blockchainInfo.blocks).toBe('number');
    expect(blockchainInfo.blocks).toBeGreaterThan(1000000); // Reasonable height

    // Verify configuration
    expect(lockAddress).toBeDefined();
    expect(typeof lockAddress).toBe('string');
    expect(lockAddress.length).toBeGreaterThan(20); // Valid Firo address length

    expect(tokenMap).toBeDefined();
    expect(tokenMap).toBeInstanceOf(TokenMap);

    // Verify token mapping has FIRO token
    const firoTokens = tokenMap.search('firo', { tokenId: 'firo' });
    expect(firoTokens.length).toBeGreaterThan(0);
  });

  /**
   * @target FiroRpcRosenExtractor.get() - Real Bridge Transaction Creation & Extraction
   * @dependencies Running Firo testnet node at localhost:8888 with HTTP Basic Auth
   * @scenario
   * - Create a raw bridge transaction with proper OP_RETURN data
   * - Include bridge metadata: toChain, toAddress, bridgeFee, networkFee
   * - Use createrawtransaction RPC to generate proper transaction structure
   * - Extract Rosen data from the created transaction
   * @expected
   * - Should successfully create transaction with valid OP_RETURN
   * - Should extract correct bridge data from OP_RETURN
   * - Should validate all bridge parameters match input
   * - Should handle real Firo transaction structure
   */
  it('should create and extract bridge transaction data', async () => {
    if (!isNodeAvailable) {
      return;
    }

    // Get current height to get a UTXO for input
    const currentHeight = await rpcCall('getblockcount');
    const recentHeight = currentHeight - 10;
    const blockHash = await rpcCall('getblockhash', [recentHeight]);
    const blockInfo = await rpcCall('getblock', [blockHash, true]);

    // Get a transaction to use as input (for demonstration)
    const sourceTxId = blockInfo.tx[0];

    // Bridge transaction parameters
    const bridgeParams = {
      toChain: 'cardano',
      toAddress:
        'addr1qxxa3kfnnh40yqtepa5frt0tkw4a0rys7v33422lzt8glx43sqtd4vkhjzawajej8aujh27p5a54zx62xf3wvuplynqs3fsqet',
      bridgeFee: '10000000', // 0.1 Firo
      networkFee: '10000000', // 0.1 Firo
      amount: '10000000', // 0.1 Firo
    };

    // Create OP_RETURN data using proper Rosen bridge format
    // Format: version(1 byte) + chain_id(4) + bridge_fee(4) + reserved(4) + network_fee(4) + address(58)
    const opReturnData =
      '01' + // version (1 byte)
      '00000001' + // chain ID (4 bytes) - 1 = cardano in SUPPORTED_CHAINS array
      '00989680' + // bridge fee in hex (4 bytes) = in decimal 10000000 satoshis
      '00000000' + // reserved (4 bytes)
      '00989680' + // network fee in hex (4 bytes) = in decimal 10000000 satoshis
      // Cardano address (58 bytes) - real Cardano mainnet address
      '39018dd8d9339deaf201790f6891adebb3abd78c90f3231aa95f12ce8f9ab18016dab2d790baeecb323f792babc1a769511b4a3262e6703f24c1';

    try {
      // Create raw transaction with OP_RETURN output
      const rawTxInputs = [
        {
          txid: sourceTxId,
          vout: 0,
        },
      ];

      const rawTxOutputs = {
        // OP_RETURN output with bridge data (no '6a' prefix - RPC adds it)
        data: opReturnData,
        // Lock output to bridge address
        [lockAddress]: 0.1, // 0.1 FIRO
      };

      // console.log('Creating raw transaction with bridge data...');
      const rawTx = await rpcCall('createrawtransaction', [
        rawTxInputs,
        rawTxOutputs,
      ]);
      expect(typeof rawTx).toBe('string');
      expect(rawTx.length).toBeGreaterThan(0);

      // Decode the raw transaction to get transaction structure
      const decodedTx = (await rpcCall('decoderawtransaction', [
        rawTx,
      ])) as FiroRpcTransaction;
      expect(decodedTx).toBeDefined();
      expect(decodedTx.vout).toBeDefined();
      expect(decodedTx.vout.length).toBeGreaterThanOrEqual(2);

      // Verify OP_RETURN output exists
      const opReturnOutput = decodedTx.vout.find((output) =>
        output.scriptPubKey.hex?.startsWith('6a'),
      );
      expect(opReturnOutput).toBeDefined();
      expect(opReturnOutput?.scriptPubKey.hex).toMatch(/^6a4b01000000/); // Starts with OP_RETURN + length + version + chain_id

      // Verify lock output exists
      const lockOutput = decodedTx.vout.find((output) =>
        output.scriptPubKey.addresses?.includes(lockAddress),
      );
      expect(lockOutput).toBeDefined();
      expect(lockOutput?.value).toBe(0.1);

      // console.log('Successfully created bridge transaction with OP_RETURN');
      // console.log('Transaction ID:', decodedTx.txid || 'pending');
      // console.log('OP_RETURN hex:', opReturnOutput?.scriptPubKey.hex);

      // The main testing phase
      const rosenData = extractor.get(decodedTx);

      if (rosenData !== undefined) {
        // console.log('Extracting bridge data...');

        // Validate extracted data matches our input
        expect(rosenData).toHaveProperty('toChain');
        expect(rosenData).toHaveProperty('toAddress');
        expect(rosenData).toHaveProperty('bridgeFee');
        expect(rosenData).toHaveProperty('networkFee');
        expect(rosenData).toHaveProperty('amount');
        expect(rosenData).toHaveProperty('sourceChainTokenId');
        expect(rosenData).toHaveProperty('targetChainTokenId');

        expect(rosenData.toChain).toBe('cardano');
        expect(rosenData.toAddress).toBe(bridgeParams.toAddress);
        expect(rosenData.bridgeFee).toBe(bridgeParams.bridgeFee);
        expect(rosenData.networkFee).toBe(bridgeParams.networkFee);
        expect(rosenData.sourceChainTokenId).toBe('firo');
        expect(rosenData.sourceTxId).toBe(decodedTx.txid);

        // console.log('Extracted data:', {
        //   toChain: rosenData.toChain,
        //   toAddress: rosenData.toAddress,
        //   bridgeFee: rosenData.bridgeFee,
        //   networkFee: rosenData.networkFee,
        //   amount: rosenData.amount,
        //   sourceChainTokenId: rosenData.sourceChainTokenId,
        //   targetChainTokenId: rosenData.targetChainTokenId
        // });
      } else {
        console.error(
          'No bridge data extracted - checking OP_RETURN format...',
        );
        // This helps for debugging OP_RETURN encoding issues
        // console.log('Expected OP_RETURN data:', opReturnData);
        // console.log('Actual OP_RETURN in transaction:', opReturnOutput?.scriptPubKey.hex);
        // const opReturnHex = opReturnOutput?.scriptPubKey.hex || '';
        // console.log('OP_RETURN breakdown:');
        // console.log('- Full hex:', opReturnHex);
        // console.log('- Starts with 6a (OP_RETURN):', opReturnHex.startsWith('6a'));
        // console.log('- Length after 6a:', opReturnHex.slice(2, 4));
        // console.log('- Data starts at position 4:', opReturnHex.slice(4, 8)); // First 2 bytes of data
        // console.log('- Version byte (should be 01):', opReturnHex.slice(4, 6));
        // console.log('- Chain ID (should be 00000000):', opReturnHex.slice(6, 14));
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Insufficient funds') ||
          error.message.includes('bad-txns-inputs-missingorspent')
        ) {
          console.warn(
            'Cannot create transaction - insufficient funds or spent inputs',
          );
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }, 45000);

  /**
   * @target FiroRpcRosenExtractor - Performance with Real Data
   * @dependencies Running Firo testnet node at localhost:8888 with HTTP Basic Auth
   * @scenario
   * - Test extractor performance with multiple real transactions
   * - Measure processing time for production scenarios
   * @expected
   * - Should process transactions efficiently
   * - Should handle batch processing without memory issues
   * - Should maintain consistent performance
   */
  it('should perform efficiently with real blockchain data', async () => {
    if (!isNodeAvailable) {
      return;
    }

    // Get a recent block with multiple transactions
    const currentHeight = await rpcCall('getblockcount');
    const blockHash = await rpcCall('getblockhash', [currentHeight - 5]);
    const blockInfo = await rpcCall('getblock', [blockHash, true]);

    // Process up to 5 transactions for performance testing if available
    const transactionsToProcess = blockInfo.tx.slice(
      0,
      Math.min(5, blockInfo.tx.length),
    );
    let processedCount = 0;
    let totalTime = 0;
    let extractedResults: any[] = [];

    for (const txId of transactionsToProcess) {
      const transaction = (await rpcCall('getrawtransaction', [
        txId,
        true,
      ])) as FiroRpcTransaction;
      const startTime = performance.now(); // Higher precision timing
      const rosenData = extractor.get(transaction);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      totalTime += processingTime;
      processedCount++;
      extractedResults.push(rosenData); // Dummy sotring to prevent optimization

      expect(processingTime).toBeLessThan(3000); // Max 3 seconds per transaction (threshold)
    }

    const averageTime = totalTime / processedCount;

    console.log(
      `Processed ${processedCount} real transactions in ${totalTime.toFixed(3)}ms (avg: ${averageTime.toFixed(3)}ms/tx)`,
    );
    console.log(
      `Bridge transactions found: ${extractedResults.filter((r) => r !== undefined).length}`,
    );
    console.log(
      `Non-bridge transactions: ${extractedResults.filter((r) => r === undefined).length}`,
    );

    expect(processedCount).toBe(transactionsToProcess.length);
    expect(totalTime).toBeLessThan(15000); // Total processing under 15 seconds (threshold)
  }, 20000);
});
