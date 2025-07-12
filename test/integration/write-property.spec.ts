import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - writeProperty integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.writeProperty(
				{ address: '127.0.0.2' },
				{ type: 8, instance: 44301 },
				28,
				[{ type: 4, value: 100 }],
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
