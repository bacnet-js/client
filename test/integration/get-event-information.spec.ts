import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - getEventInformation integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.getEventInformation(
				{ address: '127.0.0.2' },
				{ type: 5, instance: 33 },
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
	test('should correctly parse a request without the optional "Last Received Object Identifier" parameter (see clause 13.12 of the spec)', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.on('getEventInformation', (req) => {
				assert.deepStrictEqual(req.payload, {
					len: 1,
					lastReceivedObjectId: null,
				})
				client.close()
				resolve()
			})
			// Test payload is taken as-is from a request made by Schneider's
			// Ecostruxture Building Operation (EBO). I've opted to inject an
			// external payload rather than using this very library to generate
			// the request as the latter could hide or confuse different issues.
			client['_transport'].emit(
				'message',
				Buffer.from('810a000a01040205431d', 'hex'),
				'127.0.0.1:8080',
			)
		})
	})
})
