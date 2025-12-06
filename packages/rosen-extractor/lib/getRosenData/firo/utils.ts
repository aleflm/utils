import { decodeAddress } from '@rosen-bridge/address-codec';
import { SUPPORTED_CHAINS } from '../const';
import { OpReturnData } from './types';
import { address } from 'bitcoinjs-lib';

const firocoinNetwork = {
  // Firo network parameters
  messagePrefix: '\x19Firo Signed Message:\n',
  bech32: 'firo',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x52,
  scriptHash: 0x07,
  wif: 0xd2,
};

/**
 * Converts a Firocoin address to its corresponding output script
 * @param addr The Firocoin address to convert
 * @returns The output script as a hex string
 */
export const addressToOutputScript = (addr: string): string => {
  return address.toOutputScript(addr, firocoinNetwork).toString('hex');
};

/**
 * extracts rosen data from OP_RETURN box script pub key
 * @param scriptPubKeyHex
 */
export const parseRosenData = (scriptPubKeyHex: string): OpReturnData => {
  // check OP_RETURN opcode
  if (scriptPubKeyHex.slice(0, 2) !== '6a')
    throw Error(`script does not start with OP_RETURN opcode (6a)`);

  // Handle variable-length encoding for OP_RETURN data
  let offset = 2; // Start after OP_RETURN (6a)

  // Check length encoding
  const firstLengthByte = parseInt(
    scriptPubKeyHex.slice(offset, offset + 2),
    16,
  );
  if (firstLengthByte <= 75) {
    // Direct length encoding (0x01-0x4b)
    offset += 2; // Skip the length byte
  } else if (firstLengthByte === 76) {
    // OP_PUSHDATA1
    // Next byte contains the length
    offset += 4; // Skip 0x4c and length byte
  } else {
    throw Error(`Unsupported OP_RETURN length encoding: ${firstLengthByte}`);
  }

  // Now parse the actual data starting from offset
  offset += 2;

  // parse toChain (4 bytes)
  const toChainHex = scriptPubKeyHex.slice(offset, offset + 8);
  const toChainCode = parseInt(toChainHex, 16);
  if (toChainCode >= SUPPORTED_CHAINS.length)
    throw Error(
      `invalid toChain code, found [${toChainCode}] but only [${SUPPORTED_CHAINS.length}] chains are supported`,
    );
  const toChain = SUPPORTED_CHAINS[toChainCode];
  offset += 8;

  // parse bridgeFee (4 bytes)
  const bridgeFeeHex = scriptPubKeyHex.slice(offset, offset + 8);
  const bridgeFee = parseInt(bridgeFeeHex, 16).toString();
  offset += 8;

  // skip reserved (4 bytes)
  offset += 8;

  // parse networkFee (4 bytes)
  const networkFeeHex = scriptPubKeyHex.slice(offset, offset + 8);
  const networkFee = parseInt(networkFeeHex, 16).toString();
  offset += 8;

  // parse toAddress
  const addressLengthCode = scriptPubKeyHex.slice(offset, offset + 2);
  offset += 2;
  const addressHex = scriptPubKeyHex.slice(
    offset,
    offset + parseInt(addressLengthCode, 16) * 2,
  );
  const toAddress = decodeAddress(toChain, addressHex);

  return {
    toChain,
    toAddress,
    bridgeFee,
    networkFee,
  };
};
