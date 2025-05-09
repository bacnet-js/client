import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { ServicesMap } from '../../src/lib/services'

test.describe('bacnet - Services layer PrivateTransfer unit', () => {
	test('should successfully encode and decode', (t) => {
		const buffer = utils.getBuffer()
		ServicesMap.privateTransfer.encode(buffer, 255, 8, [1, 2, 3, 4, 5])
		const result = ServicesMap.privateTransfer.decode(
			buffer.buffer,
			0,
			buffer.offset,
		)
		delete result.len
		assert.deepStrictEqual(result, {
			vendorId: 255,
			serviceNumber: 8,
			data: [1, 2, 3, 4, 5],
		})
	})
})
