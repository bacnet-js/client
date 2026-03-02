/**
 * Discover devices through BBMD:
 * 1) Register as foreign device
 * 2) Send Who-Is using BVLC Distribute-Broadcast-To-Network (0x09)
 *
 * Usage:
 *   npx ts-node examples/discover-devices-via-bbmd.ts <bbmd-ip:port> [ttl-seconds]
 */

import Bacnet from '../src'

const bbmdAddress = process.argv[2]
const ttlSeconds = Number(process.argv[3] || 60)
const localPort = Number(process.env.BACNET_PORT || 47809)

if (!bbmdAddress) {
	console.error('Missing BBMD address. Usage: <bbmd-ip:port> [ttl-seconds]')
	process.exit(1)
}

const client = new Bacnet({
	apduTimeout: 5000,
	interface: '0.0.0.0',
	port: localPort,
})

client.on('error', (err: Error) => {
	console.error(`BACnet error: ${err.message}`)
})

client.on('iAm', (device: any) => {
	console.log(
		`iAm from ${device?.payload?.deviceId} via ${device?.header?.sender?.address} (forwardedFrom=${device?.header?.sender?.forwardedFrom ?? 'n/a'})`,
	)
})

client.on('listening', async () => {
	try {
		console.log(`Listening on UDP ${localPort}`)
		await client.registerForeignDevice({ address: bbmdAddress }, ttlSeconds)
		console.log(`FDR success on ${bbmdAddress} (ttl=${ttlSeconds}s)`)
		client.whoIsThroughBBMD({ address: bbmdAddress })
		console.log('Who-Is sent through BBMD')
	} catch (err) {
		console.error(`Failed: ${String((err as Error)?.message || err)}`)
	}
})

setTimeout(() => {
	client.close()
	console.log('Done')
}, 20000)
