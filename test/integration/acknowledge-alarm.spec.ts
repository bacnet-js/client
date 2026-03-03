import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - acknowledgeAlarm integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		t.after(() => client.close())
		await assert.rejects(
			client.acknowledgeAlarm(
				{ address: '127.0.0.2' },
				{ type: 2, instance: 3 },
				2,
				'Alarm Acknowledge Test',
				{ value: new Date(), type: 2 },
				{ value: new Date(), type: 2 },
				{},
			),
			(err: Error) => {
				assert.strictEqual(err.message, 'ERR_TIMEOUT')
				return true
			},
		)
	})
})
