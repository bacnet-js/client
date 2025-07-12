import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - addListElement integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.addListElement(
				{ address: '127.0.0.2' },
				{ type: 19, instance: 101 },
				{ id: 80, index: 0 },
				[{ type: 1, value: true }],
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
