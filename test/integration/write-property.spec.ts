import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - writeProperty integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		await assert.rejects(
			client.writeProperty(
				{ address: '127.0.0.2' },
				{ type: 8, instance: 44301 },
				28,
				[{ type: 4, value: 100 }],
				{},
			),
			(err: Error) => {
				assert.strictEqual(err.message, 'ERR_TIMEOUT')
				return true
			},
		)
		client.close()
	})
})
