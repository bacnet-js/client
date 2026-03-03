import test from 'node:test'
import assert from 'node:assert'

import BACnetClient from '../../src/lib/client'
import * as baNpdu from '../../src/lib/npdu'
import * as baApdu from '../../src/lib/apdu'
import { GetEventInformation } from '../../src/lib/services'
import { EventState, NotifyType, ServicesSupported, TimeStamp } from '../../src'

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
})
