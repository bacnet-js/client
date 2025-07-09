import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { BACNetObjectID, CovType } from '../../src'
import { EventNotifyData } from '../../src/lib/services'

test.describe('bacnet - Services layer EventNotifyData unit', () => {
	test('should successfully encode and decode a change of bitstring event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: { type: 60, instance: 12 },
			eventObjectId: { type: 61, instance: 1121 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 0,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: true,
			fromState: 5,
			toState: 6,
			changeOfBitstringReferencedBitString: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
			changeOfBitstringStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 60, instance: 12 },
			eventObjectId: { type: 61, instance: 1121 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 0,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: true,
			fromState: 5,
			toState: 6,
		})
	})

	test('should successfully encode and decode a change of state event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 1,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 1,
			toState: 2,
			changeOfStateNewState: { type: 2, state: 2 },
			changeOfStateStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 1,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 1,
			toState: 2,
		})
	})

	test('should successfully encode and decode a change of value event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 2,
			messageText: 'Test1234$',
			notifyType: 1,
			changeOfValueTag: CovType.REAL,
			changeOfValueChangeValue: 90,
			changeOfValueStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 2,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
	})

	test('should successfully encode and decode a floating limit event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 4,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: true,
			fromState: 19,
			toState: 12,
			floatingLimitReferenceValue: 121,
			floatingLimitStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
			floatingLimitSetPointValue: 120,
			floatingLimitErrorLimit: 120,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 4,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: true,
			fromState: 19,
			toState: 12,
		})
	})

	// Remaining tests follow the same pattern...
	test('should successfully encode and decode an out of range event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 5,
			messageText: 'Test1234$',
			notifyType: 1,
			outOfRangeExceedingValue: 155,
			outOfRangeStatusFlags: { bitsUsed: 24, value: [0xaa, 0xaa, 0xaa] },
			outOfRangeDeadband: 50,
			outOfRangeExceededLimit: 150,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 5,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
	})

	// I'll continue with the remaining test cases in the same pattern
	test('should successfully encode and decode a change of life-safety event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 8,
			messageText: 'Test1234$',
			notifyType: 1,
			changeOfLifeSafetyNewState: 8,
			changeOfLifeSafetyNewMode: 9,
			changeOfLifeSafetyStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
			changeOfLifeSafetyOperationExpected: 2,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 8,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
	})

	test('should successfully encode and decode a buffer ready event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 10,
			messageText: 'Test1234$',
			notifyType: 1,
			bufferReadyBufferProperty: {
				objectId: { type: 0, instance: 2 },
				id: 85,
				arrayIndex: 3,
				deviceIndentifier: { type: 8, instance: 443 },
			},
			bufferReadyPreviousNotification: 121,
			bufferReadyCurrentNotification: 281,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 10,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
	})

	test('should successfully encode and decode a unsigned range event', (t) => {
		const buffer = utils.getBuffer()
		const date = new Date()
		date.setMilliseconds(880)
		EventNotifyData.encode(buffer, {
			processId: 3,
			initiatingObjectId: {} as BACNetObjectID,
			eventObjectId: {} as BACNetObjectID,
			timeStamp: { type: 2, value: date },
			notificationClass: 9,
			priority: 7,
			eventType: 11,
			messageText: 'Test1234$',
			notifyType: 1,
			unsignedRangeExceedingValue: 101,
			unsignedRangeStatusFlags: {
				bitsUsed: 24,
				value: [0xaa, 0xaa, 0xaa],
			},
			unsignedRangeExceededLimit: 100,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
		const result = EventNotifyData.decode(buffer.buffer, 0)
		delete result.len
		assert.deepStrictEqual(result, {
			processId: 3,
			initiatingObjectId: { type: 0, instance: 0 },
			eventObjectId: { type: 0, instance: 0 },
			timeStamp: {
				type: 2,
				value: date,
			},
			notificationClass: 9,
			priority: 7,
			eventType: 11,
			messageText: 'Test1234$',
			notifyType: 1,
			ackRequired: false,
			fromState: 0,
			toState: 0,
		})
	})
})
