import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - readRange integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.readRange(
				{ address: '127.0.0.2' },
				{ type: 20, instance: 0 },
				0,
				200,
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
