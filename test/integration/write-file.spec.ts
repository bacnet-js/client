import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - writeFile integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.writeFile(
				{ address: '127.0.0.2' },
				{ type: 10, instance: 2 },
				0,
				[
					[5, 6, 7, 8],
					[5, 6, 7, 8],
				],
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
