import test from 'node:test'
import assert from 'node:assert'

import BACnetClient from '../../src/lib/client'
import * as baNpdu from '../../src/lib/npdu'
import * as baApdu from '../../src/lib/apdu'
import * as baBvlc from '../../src/lib/bvlc'
import {
	GetEventInformation,
	RegisterForeignDevice,
} from '../../src/lib/services'
import {
	BvlcResultFormat,
	BvlcResultPurpose,
	EventState,
	NotifyType,
	ServicesSupported,
	TimeStamp,
} from '../../src'

test.describe('bacnet - client', () => {
	test('should successfuly encode a bitstring > 32 bits', () => {
		const result = BACnetClient.createBitstring([
			ServicesSupported.CONFIRMED_COV_NOTIFICATION,
			ServicesSupported.READ_PROPERTY,
			ServicesSupported.WHO_IS,
		])
		assert.deepStrictEqual(result, {
			value: [2, 16, 0, 0, 4],
			bitsUsed: 35,
		})
	})

	test('should successfuly encode a bitstring < 8 bits', () => {
		const result = BACnetClient.createBitstring([
			ServicesSupported.GET_ALARM_SUMMARY,
		])
		assert.deepStrictEqual(result, {
			value: [8],
			bitsUsed: 4,
		})
	})

	test('should successfuly encode a bitstring of only one bit', () => {
		const result = BACnetClient.createBitstring([
			ServicesSupported.ACKNOWLEDGE_ALARM,
		])
		assert.deepStrictEqual(result, {
			value: [1],
			bitsUsed: 1,
		})
	})

	test('getEventInformation should omit optional objectId when not provided', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_requestManager: { add: (invokeId: number) => Promise<any> }
			_getInvokeId: () => number
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			sendBvlc: (
				receiver: { address: string } | null,
				buffer: { buffer: Buffer; offset: number },
			) => void
		}

		const response = {
			buffer: Buffer.alloc(1482),
			offset: 0,
		}
		GetEventInformation.encodeAcknowledge(
			response,
			[
				{
					objectId: { type: 0, instance: 32 },
					eventState: EventState.NORMAL,
					acknowledgedTransitions: { value: [14], bitsUsed: 6 },
					eventTimeStamps: [
						{ type: TimeStamp.SEQUENCE_NUMBER, value: 1 },
						{ type: TimeStamp.SEQUENCE_NUMBER, value: 2 },
						{ type: TimeStamp.SEQUENCE_NUMBER, value: 3 },
					],
					notifyType: NotifyType.EVENT,
					eventEnable: { value: [15], bitsUsed: 7 },
					eventPriorities: [2, 3, 4],
				},
			],
			false,
		)
		const expected = GetEventInformation.decodeAcknowledge(
			response.buffer,
			0,
			response.offset,
		)
		assert.ok(expected)

		let sentRequest: Buffer | undefined
		client._getInvokeId = () => 7
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(1482),
			offset: 4,
		})
		client.sendBvlc = (_receiver, buffer) => {
			sentRequest = Buffer.from(buffer.buffer.subarray(0, buffer.offset))
		}
		client._requestManager = {
			add: async (invokeId: number) => {
				assert.strictEqual(invokeId, 7)
				return {
					buffer: response.buffer,
					offset: 0,
					length: response.offset,
				}
			},
		}

		const events = await client.getEventInformation({
			address: '127.0.0.1',
		})

		assert.ok(sentRequest)
		const npdu = baNpdu.decode(sentRequest, 4)
		assert.ok(npdu)
		const apdu = baApdu.decodeConfirmedServiceRequest(
			sentRequest,
			4 + npdu.len,
		)
		const payloadOffset = 4 + npdu.len + apdu.len
		assert.strictEqual(payloadOffset, sentRequest.length)
		assert.deepStrictEqual(events, expected.events)
	})

	test('registerForeignDevice should send BVLC register and resolve on success result', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		let sentData: Buffer | undefined
		client._settings = { apduTimeout: 100 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (buffer, receiver) => {
			sentData = Buffer.from(buffer.buffer.subarray(0, buffer.offset))
			setImmediate(() => {
				client.emit('bvlcResult', {
					header: { sender: { address: receiver?.address } },
					payload: {
						resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
					},
				})
			})
		}

		await client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60)

		assert.ok(sentData)
		const bvlc = baBvlc.decode(sentData, 0)
		assert.ok(bvlc)
		assert.strictEqual(bvlc.func, BvlcResultPurpose.REGISTER_FOREIGN_DEVICE)
		const payload = RegisterForeignDevice.decode(
			sentData,
			bvlc.len,
			sentData.length - bvlc.len,
		)
		assert.strictEqual(payload.ttl, 60)
	})

	test('registerForeignDevice should accept BVLC result sender without default port', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 100 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, _receiver) => {
			setImmediate(() => {
				client.emit('bvlcResult', {
					header: { sender: { address: '127.0.0.1' } },
					payload: {
						resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
					},
				})
			})
		}

		await assert.doesNotReject(async () => {
			await client.registerForeignDevice(
				{ address: '127.0.0.1:47808' },
				60,
			)
		})
	})

	test('registerForeignDevice should reject on BVLC result NAK', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 100 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			setImmediate(() => {
				client.emit('bvlcResult', {
					header: { sender: { address: receiver?.address } },
					payload: {
						resultCode:
							BvlcResultFormat.REGISTER_FOREIGN_DEVICE_NAK,
					},
				})
			})
		}

		await assert.rejects(
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60),
			/Code:118.*Result:48/,
		)
	})

	test('registerForeignDevice should reject on timeout', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 25 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = () => {}

		await assert.rejects(
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60),
			/ERR_TIMEOUT/,
		)
	})

	test('registerForeignDevice should reject invalid receiver address port', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 25 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = () => {}

		await assert.rejects(
			client.registerForeignDevice({ address: '127.0.0.1:abc' }, 60),
			/Invalid receiver\.address/,
		)
	})

	test('registerForeignDevice should reject receiver address without port', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 25 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = () => {}

		await assert.rejects(
			client.registerForeignDevice({ address: '127.0.0.1' }, 60),
			/Invalid receiver\.address/,
		)
	})

	test('registerForeignDevice should dedupe parallel calls for the same target', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		let sends = 0
		client._settings = { apduTimeout: 100 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			sends += 1
			setImmediate(() => {
				client.emit('bvlcResult', {
					header: { sender: { address: receiver?.address } },
					payload: {
						resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
					},
				})
			})
		}

		await Promise.all([
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60),
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60),
		])
		assert.strictEqual(sends, 1)
	})

	test('registerForeignDevice should not dedupe parallel calls with different TTL', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		let sends = 0
		client._settings = { apduTimeout: 100 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			sends += 1
			setImmediate(() => {
				client.emit('bvlcResult', {
					header: { sender: { address: receiver?.address } },
					payload: {
						resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
					},
				})
			})
		}

		await Promise.all([
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 60),
			client.registerForeignDevice({ address: '127.0.0.1:47808' }, 120),
		])
		assert.strictEqual(sends, 2)
	})

	test('registerForeignDevice should not resolve two different TTL requests from a single BVLC result', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		let sends = 0
		client._settings = { apduTimeout: 30 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			sends += 1
			if (sends === 1) {
				setImmediate(() => {
					client.emit('bvlcResult', {
						header: { sender: { address: receiver?.address } },
						payload: {
							resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
						},
					})
				})
			}
		}

		const first = client.registerForeignDevice(
			{ address: '127.0.0.1:47808' },
			60,
		)
		const second = client.registerForeignDevice(
			{ address: '127.0.0.1:47808' },
			120,
		)

		await assert.doesNotReject(first)
		await assert.rejects(second, /ERR_TIMEOUT/)
		assert.strictEqual(sends, 2)
	})

	test('registerForeignDevice should retry queued TTL request if prior attempt fails', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		let sends = 0
		client._settings = { apduTimeout: 30 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			sends += 1
			if (sends === 2) {
				setImmediate(() => {
					client.emit('bvlcResult', {
						header: { sender: { address: receiver?.address } },
						payload: {
							resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
						},
					})
				})
			}
		}

		const first = client.registerForeignDevice(
			{ address: '127.0.0.1:47808' },
			60,
		)
		const second = client.registerForeignDevice(
			{ address: '127.0.0.1:47808' },
			120,
		)

		await assert.rejects(first, /ERR_TIMEOUT/)
		await assert.doesNotReject(second)
		assert.strictEqual(sends, 2)
	})

	test('registerForeignDevice should ignore unrelated error events', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_settings: { apduTimeout: number }
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
		}

		client._settings = { apduTimeout: 100 }
		client.on('error', () => {})
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(32),
			offset: 4,
		})
		client._send = (_buffer, receiver) => {
			setImmediate(() => {
				client.emit('error', new Error('unrelated socket error'))
				client.emit('bvlcResult', {
					header: { sender: { address: receiver?.address } },
					payload: {
						resultCode: BvlcResultFormat.SUCCESSFUL_COMPLETION,
					},
				})
			})
		}

		await assert.doesNotReject(async () => {
			await client.registerForeignDevice(
				{ address: '127.0.0.1:47808' },
				60,
			)
		})
	})

	test('whoIsThroughBBMD should send BVLC distribute-broadcast-to-network', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
			_transport: { getMaxPayload: () => number }
		}

		let sentData: Buffer | undefined
		client._transport = { getMaxPayload: () => 1482 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(64),
			offset: 4,
		})
		client._send = (buffer) => {
			sentData = Buffer.from(buffer.buffer.subarray(0, buffer.offset))
		}

		client.whoIsThroughBBMD({ address: '127.0.0.1:47808' })

		assert.ok(sentData)
		const bvlc = baBvlc.decode(sentData, 0)
		assert.ok(bvlc)
		assert.strictEqual(
			bvlc.func,
			BvlcResultPurpose.DISTRIBUTE_BROADCAST_TO_NETWORK,
		)
	})

	test('whoIsThroughBBMD should keep BBMD receiver when limits are provided', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient & {
			_getApduBuffer: () => { buffer: Buffer; offset: number }
			_send: (
				buffer: { buffer: Buffer; offset: number },
				receiver?: { address?: string },
			) => void
			_transport: { getMaxPayload: () => number }
		}

		let sentData: Buffer | undefined
		client._transport = { getMaxPayload: () => 1482 }
		client._getApduBuffer = () => ({
			buffer: Buffer.alloc(64),
			offset: 4,
		})
		client._send = (buffer) => {
			sentData = Buffer.from(buffer.buffer.subarray(0, buffer.offset))
		}

		client.whoIsThroughBBMD(
			{ address: '127.0.0.1:47808' },
			{ lowLimit: 0, highLimit: 100 },
		)

		assert.ok(sentData)
		const bvlc = baBvlc.decode(sentData, 0)
		assert.ok(bvlc)
		assert.strictEqual(
			bvlc.func,
			BvlcResultPurpose.DISTRIBUTE_BROADCAST_TO_NETWORK,
		)
	})

	test('whoIsThroughBBMD should reject missing bbmd address', async () => {
		const client = Object.create(BACnetClient.prototype) as BACnetClient
		assert.throws(
			() => client.whoIsThroughBBMD({}),
			/whoIsThroughBBMD requires bbmd\.address/,
		)
	})
})
