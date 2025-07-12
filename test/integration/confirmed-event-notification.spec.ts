import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { BACNetObjectID } from '../../src'

test.describe('bacnet - confirmedEventNotification integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			const date = new Date()
			date.setMilliseconds(880)

			await client.confirmedEventNotification(
				{ address: '127.0.0.2' },
				{
					processId: 3,
					initiatingObjectId: {} as BACNetObjectID,
					eventObjectId: {} as BACNetObjectID,
					timeStamp: { type: 2, value: date },
					notificationClass: 9,
					priority: 7,
					eventType: 2,
					messageText: 'Test1234$',
					notifyType: 1,
					changeOfValueTag: 0,
					changeOfValueChangeValue: 90,
					changeOfValueStatusFlags: {
						bitsUsed: 24,
						value: [0xaa, 0xaa, 0xaa],
					},
					ackRequired: false,
					fromState: 0,
					toState: 0,
				},
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
