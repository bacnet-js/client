import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - confirmedEventNotification integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = utils.createBacnetClient({ apduTimeout: 200 })
			const date = new Date()
			date.setMilliseconds(880)
			client.confirmedEventNotification(
				'127.0.0.2',
				{
					processId: 3,
					initiatingObjectId: {},
					eventObjectId: {},
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
				},
				{},
				(err) => {
					assert.strictEqual(err.message, 'ERR_TIMEOUT')
					client.close()
					resolve()
				},
			)
		})
	})
})
