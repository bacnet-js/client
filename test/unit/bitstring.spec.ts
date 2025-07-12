import test from 'node:test'
import assert from 'node:assert'

import {
	GenericBitString,
	StatusFlagsBitString,
	ServicesSupportedBitString,
	ObjectTypesSupportedBitString,
} from '../../src/lib/bitstring'

test.describe('bacnet - bitstring', () => {
	test.describe('GenericBitString', () => {
		test('should only allow values from the specified positional enum', () => {
			enum A {
				one = 1,
				two = 2,
			}
			enum B {
				one = 1,
				two = 2,
			}
			const ok = new GenericBitString<typeof A>(10, [A.one])
			// @ts-expect-error - we want to make sure that using the wrong enum results
			//                    in a compilation error
			const ko = new GenericBitString<typeof A>(10, [B.one])
		})
		test('should have value length equal to the number of bytes necessary to represent the bitstring', () => {
			enum A {}
			assert.strictEqual(
				new GenericBitString<typeof A>(10, []).value.length,
				2,
			)
			assert.strictEqual(
				new GenericBitString<typeof A>(20, []).value.length,
				3,
			)
			assert.strictEqual(
				new GenericBitString<typeof A>(24, []).value.length,
				3,
			)
			assert.strictEqual(
				new GenericBitString<typeof A>(25, []).value.length,
				4,
			)
		})
		test('should throw when using a positional value greater than the bitstring size', () => {
			enum A {
				one = 128,
			}
			assert.throws(
				() => {
					new GenericBitString<typeof A>(10, [A.one])
				},
				{
					name: 'Error',
					message:
						'Bit index 128 is out of range for a bitstring of length 10',
				},
			)
		})
		test('should correctly set bits positioned at perfect multiples of 8', () => {
			enum A {
				one = 0,
				two = 8,
			}
			const bitstring = new GenericBitString<typeof A>(10, [A.one, A.two])
			assert.deepStrictEqual(bitstring.value, [1, 1])
		})
		test('should correctly set bits positioned at imperfect multiples of 8', () => {
			enum A {
				one = 2,
				two = 13,
			}
			const bitstring = new GenericBitString<typeof A>(20, [A.one, A.two])
			assert.deepStrictEqual(bitstring.value, [4, 32, 0])
		})
	})
	test.describe('StatusFlagsBitString', () => {
		test('should have length 4', () => {
			assert.deepStrictEqual(new StatusFlagsBitString().bitsUsed, 4)
		})
	})
	test.describe('ServicesSupportedBitString', () => {
		test('should have length 40', () => {
			assert.deepStrictEqual(
				new ServicesSupportedBitString().bitsUsed,
				40,
			)
		})
	})
	test.describe('ObjectTypesSupportedBitString', () => {
		test('should have length 80', () => {
			assert.deepStrictEqual(
				new ObjectTypesSupportedBitString().bitsUsed,
				80,
			)
		})
	})
})
