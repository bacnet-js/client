/**
 * Register this BACnet client as a Foreign Device in a BBMD and periodically renew it.
 *
 * Usage:
 *   npx ts-node examples/register-foreign-device.ts <bbmd-ip:port> [ttl-seconds]
 *
 * Example:
 *   npx ts-node examples/register-foreign-device.ts 192.168.40.10:47808 900
 */

import Bacnet from '../src'

const bbmdAddress = process.argv[2] || process.env.BBMD_ADDRESS
const ttlSeconds = Number(process.argv[3] || process.env.FDR_TTL || 900)
const localPort = Number(process.env.BACNET_PORT || 47809)
const renewRatio = Number(process.env.FDR_RENEW_RATIO || 0.8)

if (!bbmdAddress) {
	console.error(
		'Missing BBMD address. Pass <bbmd-ip:port> or set BBMD_ADDRESS.',
	)
	process.exit(1)
}

if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 0xffff) {
	console.error('Invalid TTL. Expected integer in range 1..65535.')
	process.exit(1)
}

const renewDelayMs = Math.max(
	1000,
	Math.floor(
		ttlSeconds *
			(renewRatio > 0 && renewRatio < 1 ? renewRatio : 0.8) *
			1000,
	),
)

const bacnetClient = new Bacnet({
	apduTimeout: 5000,
	interface: '0.0.0.0',
	port: localPort,
})

let renewTimer: NodeJS.Timeout | null = null
let registerInFlight = false

const clearRenewTimer = () => {
	if (renewTimer) clearTimeout(renewTimer)
	renewTimer = null
}

const closeClient = () => {
	clearRenewTimer()
	bacnetClient.close()
}

const register = async () => {
	if (registerInFlight) return
	registerInFlight = true
	try {
		await bacnetClient.registerForeignDevice(
			{
				address: bbmdAddress,
				net: null,
				adr: null,
				forwardedFrom: null,
			},
			ttlSeconds,
		)
		console.log(
			`FDR success: bbmd=${bbmdAddress}, ttl=${ttlSeconds}s, next_renew_in=${Math.floor(renewDelayMs / 1000)}s`,
		)
		clearRenewTimer()
		renewTimer = setTimeout(() => {
			register().catch((err) =>
				console.error(
					`FDR renew failed: ${String((err as Error)?.message || err)}`,
				),
			)
		}, renewDelayMs)
	} catch (err) {
		console.error(`FDR failed: ${String((err as Error)?.message || err)}`)
	} finally {
		registerInFlight = false
	}
}

bacnetClient.on('listening', () => {
	console.log(`BACnet transport listening on UDP ${localPort}`)
	console.log(`Registering to BBMD ${bbmdAddress} ...`)
	register().catch((err) =>
		console.error(`FDR failed: ${String((err as Error)?.message || err)}`),
	)
})

bacnetClient.on('bvlcResult', (content) => {
	console.log(
		`BVLC result from ${content?.header?.sender?.address}: ${content?.payload?.resultCode}`,
	)
})

bacnetClient.on('error', (err: Error) => {
	console.error(`BACnet error: ${err.message}`)
})

process.on('SIGINT', () => {
	console.log('Stopping...')
	closeClient()
	process.exit(0)
})

process.on('SIGTERM', () => {
	closeClient()
	process.exit(0)
})
