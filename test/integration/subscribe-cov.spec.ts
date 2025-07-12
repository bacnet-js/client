import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - subscribeCov integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.subscribeCov(
				{ address: '127.0.0.2' },
				{ type: 5, instance: 3 },
				7,
				false,
				false,
				0,
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
