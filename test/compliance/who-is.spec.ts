import test from 'node:test'
import assert from 'node:assert'
import { once } from 'node:events'

import * as utils from './utils'
import BACnetClient, { WhoIsOptions } from '../../src'

// you need to have this run against the official backstack c
// demo device started as deviceId 1234
// use "npm run docker" to execute this
test.describe('bacnet - whoIs compliance', () => {
	let bacnetClient: BACnetClient

	function asyncWhoIs(
		options?: WhoIsOptions,
		timeoutMs: number = 10000,
	): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('Test timed out waiting for device'))
			}, timeoutMs)

			const handleIAm = (device: any) => {
				if (device.payload.deviceId === utils.deviceUnderTest) {
					clearTimeout(timeoutId)
					bacnetClient.removeListener('iAm', handleIAm)
					resolve(device)
				}
			}

			bacnetClient.on('iAm', handleIAm)
			bacnetClient.whoIs(options)
		})
	}

	function asyncNoDeviceResponse(
		options: { lowLimit: number; highLimit: number },
		timeoutMs: number = 4000,
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				bacnetClient.removeListener('iAm', handleIAm)
				resolve()
			}, timeoutMs)

			const handleIAm = (device: any) => {
				if (
					device.payload.deviceId >= options.lowLimit &&
					device.payload.deviceId <= options.highLimit
				) {
					clearTimeout(timeoutId)
					bacnetClient.removeListener('iAm', handleIAm)
					reject(new Error('No discovery result to be expected'))
				}
			}

			bacnetClient.on('iAm', handleIAm)
			bacnetClient.whoIs(options)
		})
	}

	test.beforeEach(async () => {
		bacnetClient = new utils.bacnetClient({
			apduTimeout: utils.apduTimeout,
			interface: utils.clientListenerInterface,
		})
		bacnetClient.on('message', (msg: any, rinfo: any) => {
			utils.debug(msg)
			if (rinfo) utils.debug(rinfo)
		})
		bacnetClient.on('error', (err: Error) => {
			console.error(err)
			bacnetClient.close()
		})
		await once(bacnetClient as any, 'listening')
	})

	test.afterEach(async () => {
		return new Promise<void>((done) => {
			setTimeout(() => {
				bacnetClient.close()
				done()
			}, 1000) // do not close too fast
		})
	})

	test('should find the device simulator', async () => {
		const device = await asyncWhoIs()

		assert.ok(device.header, 'device.header should exist')
		assert.ok(device.payload, 'device.payload should exist')
		assert.strictEqual(device.payload.deviceId, utils.deviceUnderTest)
		assert.strictEqual(device.payload.maxApdu, utils.maxApdu)
		assert.strictEqual(device.payload.segmentation, 3) // NO_SEGMENTATION
		assert.strictEqual(device.payload.vendorId, utils.vendorId)
		assert.ok(device.header.sender, 'device.header.sender should exist')
		assert.ok(
			device.header.sender.address,
			'device.header.sender.address should exist',
		)
		assert.strictEqual(device.header.sender.forwardedFrom, null)
	})

	test('should find the device simulator with provided min device ID', async () => {
		const device = await asyncWhoIs({ lowLimit: utils.deviceUnderTest - 1 })

		assert.strictEqual(device.payload.deviceId, utils.deviceUnderTest)
	})

	test('should find the device simulator with provided min/max device ID and IP', async () => {
		const device = await asyncWhoIs({
			lowLimit: utils.deviceUnderTest - 1,
			highLimit: utils.deviceUnderTest + 1,
		})

		assert.strictEqual(device.payload.deviceId, utils.deviceUnderTest)
	})

	test('should NOT find any device', async () => {
		await asyncNoDeviceResponse({
			lowLimit: utils.deviceUnderTest + 1,
			highLimit: utils.deviceUnderTest + 3,
		})
	})

	// TODO tests missing for routing cases where "receiver" parameter is used to call whoIs
})
