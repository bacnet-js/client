import test from 'node:test'
import assert from 'node:assert'

import Client from '../../src/lib/client'
import * as baEnum from '../../src/lib/enum'
import { BACNetObjectID } from '../../src/lib/types'

test.describe('bacnet - confirmedCOVNotification integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		return new Promise<void>((resolve) => {
			const client = new Client({ apduTimeout: 200 })

			const monitoredObjectId: BACNetObjectID = {
				type: 2,
				instance: 122,
			}

			client.confirmedCOVNotification(
				'127.0.0.2',
				monitoredObjectId,
				3,
				433,
				120,
				[
					{
						property: { id: 85, index: 0 },
						value: [
							{ type: baEnum.ApplicationTag.REAL, value: 12.3 },
						],
					},
					{
						property: { id: 111, index: 0 },
						value: [
							{
								type: baEnum.ApplicationTag.BIT_STRING,
								value: 0xffff,
							},
						],
					},
				],
				(err) => {
					assert.strictEqual(err.message, 'ERR_TIMEOUT')
					client.close()
					resolve()
				},
			)
		})
	})
})
