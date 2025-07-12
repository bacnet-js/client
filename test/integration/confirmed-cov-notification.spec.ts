import test from 'node:test'
import assert from 'node:assert'

import BACnetClient from '../../src/lib/client'

import { BACNetObjectID } from '../../src/lib/types'
import { ApplicationTag } from '../../src'

test.describe('bacnet - confirmedCOVNotification integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new BACnetClient({ apduTimeout: 200 })
		const monitoredObjectId: BACNetObjectID = {
			type: 2,
			instance: 122,
		}
		try {
			await client.confirmedCOVNotification(
				{ address: '127.0.0.2' },
				monitoredObjectId,
				3,
				433,
				120,
				[
					{
						property: { id: 85, index: 0 },
						value: [{ type: ApplicationTag.REAL, value: 12.3 }],
					},
					{
						property: { id: 111, index: 0 },
						value: [
							{
								type: ApplicationTag.BIT_STRING,
								value: 0xffff,
							},
						],
					},
				],
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
