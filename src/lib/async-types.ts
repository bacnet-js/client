import BACnetClient from './client'
import { DataCallback } from './types'

function validateMethods<T extends readonly (keyof BACnetClient)[]>(
	methods: T,
): T {
	return methods
}

// List of method names that should have async versions
export const ASYNC_METHODS = validateMethods([
	'readProperty',
	'readPropertyMultiple',
	'writeProperty',
	'writePropertyMultiple',
	'confirmedCOVNotification',
	'deviceCommunicationControl',
	'reinitializeDevice',
	'writeFile',
	'readFile',
	'readRange',
	'subscribeCov',
	'subscribeProperty',
	'createObject',
	'deleteObject',
	'removeListElement',
	'addListElement',
	'getAlarmSummary',
	'getEventInformation',
	'acknowledgeAlarm',
	'confirmedPrivateTransfer',
	'getEnrollmentSummary',
	'confirmedEventNotification',
] as const)

type AsyncMethodName = (typeof ASYNC_METHODS)[number]

// Create async versions of selected methods
export type AsyncMethods<T> = {
	[K in AsyncMethodName]: K extends keyof T ? AsyncVersion<T[K]> : never
}

// Convert a callback-based method to return a Promise
export type AsyncVersion<T> = T extends (
	...args: [...infer P, DataCallback<infer R>]
) => any
	? (...args: P) => Promise<unknown extends R ? void : R>
	: never

export function promisify<T extends (...args: any[]) => any>(
	context: BACnetClient,
	method: T,
): AsyncVersion<T> {
	return ((...args: any[]) => {
		return new Promise((resolve, reject) => {
			const callback = (error?: Error, result?: any) => {
				if (error) {
					reject(error)
				} else {
					// For ErrorCallback (no result parameter), resolve with undefined
					// For DataCallback, resolve with the result
					resolve(result)
				}
			}

			method.call(context, ...args, callback)
		})
	}) as AsyncVersion<T>
}
