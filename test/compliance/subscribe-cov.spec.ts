import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { once } from 'node:events'
import BACnetClient, { BACNetAddress } from '../../src'

// you need to have this run against the official backstack c
// demo device started as deviceId 1234
// use "npm run docker" to execute this
test.describe('bacnet - subscribe cov compliance', () => {
	let bacnetClient: BACnetClient
	let discoveredAddress: BACNetAddress
	const onClose: ((callback: () => void) => void) | null = null

	test.before(async () => {
		bacnetClient = new utils.bacnetClient({
			apduTimeout: utils.apduTimeout,
			interface: utils.clientListenerInterface,
		})
		bacnetClient.on('message', (msg: any, rinfo: any) => {
			utils.debug(msg)
			if (rinfo) utils.debug(rinfo)
		})
		bacnetClient.on('iAm', (device: any) => {
			discoveredAddress = device.header.sender
		})
		bacnetClient.on('error', (err: Error) => {
			console.error(err)
			bacnetClient.close()
		})
		await once(bacnetClient as any, 'listening')
	})

	test.after(async () => {
		return new Promise<void>((done) => {
			setTimeout(() => {
				bacnetClient.close()
				if (onClose) {
					onClose(done)
				} else {
					done()
				}
			}, 100) // do not close too fast
		})
	})

	test('should find the device simulator device', async () => {
		bacnetClient.whoIs()
		const [device] = await once(bacnetClient as any, 'iAm')
		if (device.payload.deviceId === utils.deviceUnderTest) {
			discoveredAddress = device.header.sender
			assert.strictEqual(device.payload.deviceId, utils.deviceUnderTest)
			assert.ok(
				discoveredAddress,
				'discoveredAddress should be an object',
			)
			assert.match(
				discoveredAddress.address,
				/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
			)
		}
	})

	// TODO tests missing for routing cases where "receiver" parameter is used to call whoIs
})
