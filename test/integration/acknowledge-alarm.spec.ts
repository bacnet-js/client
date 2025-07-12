import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - acknowledgeAlarm integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.acknowledgeAlarm(
				{ address: '127.0.0.2' },
				{ type: 2, instance: 3 },
				2,
				'Alarm Acknowledge Test',
				{ value: new Date(), type: 2 },
				{ value: new Date(), type: 2 },
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
