import { runTests, describe, it, expect } from './tester.mjs';
import * as stdlib from './ETH.mjs';
import * as ALGO_stdlib from './ALGO.mjs';

runTests(() => { describe('The `web3` stdlib', () => {
  const bigNumberify = stdlib.bigNumberify;

  describe('exposes a `bigNumberToHex` function that', () => {
    it('correctly translates positive `BigNumber`s to hex', () => {
      const { bigNumberToHex } = stdlib;

      expect(bigNumberToHex(0 )).toBe('0000000000000000000000000000000000000000000000000000000000000000');
      expect(bigNumberToHex(1 )).toBe('0000000000000000000000000000000000000000000000000000000000000001');
      expect(bigNumberToHex(10)).toBe('000000000000000000000000000000000000000000000000000000000000000a');
      expect(bigNumberToHex(25)).toBe('0000000000000000000000000000000000000000000000000000000000000019');
      expect(bigNumberToHex(30)).toBe('000000000000000000000000000000000000000000000000000000000000001e');

      expect(bigNumberToHex(5463728190))
        .toBe('0000000000000000000000000000000000000000000000000000000145a9e03e');
    });

    it('correctly translates negative `BigNumber`s to hex', () => {
      const { bigNumberToHex } = stdlib;

      expect(bigNumberToHex(-1 )).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      expect(bigNumberToHex(-10)).toBe('fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6');
      expect(bigNumberToHex(-30)).toBe('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe2');

      expect(bigNumberToHex(-5463728190))
        .toBe('fffffffffffffffffffffffffffffffffffffffffffffffffffffffeba561fc2');
    });
  });


  describe('exposes a `bigNumberify` function that', () => {
    it('correctly translates integer inputs to their `BigNumber` equivalents', () =>
       expect(bigNumberify(500).toString()).toBe('500'));

    it('correctly translates string inputs to their `BigNumber` equivalents', () =>
       expect(bigNumberify('1234567').toString()).toBe('1234567'));
  });


  describe('exposes an `isBigNumber` function that', () => {
    it('returns `true` for `BigNumber` arguments', () =>
       expect(stdlib.isBigNumber(bigNumberify('987654321'))).toBe(true));

    it('returns `false` for non-`BigNumber` arguments', () => {
      const { isBigNumber } = stdlib;

      expect(isBigNumber(98765.4321)).toBe(false);
      expect(isBigNumber('98765.43')).toBe(false);
      expect(isBigNumber({        })).toBe(false);
    });
  });


  describe('exposes a `BigNumber` comparison function called', () => {

    describe('`eq` that', () => {
      it('returns `true` when its arguments match', () =>
         expect(stdlib.eq(bigNumberify(567890), bigNumberify(567890)))
         .toBe(true));

      it('returns `false` when provided mismatched arguments', () =>
         expect(stdlib.eq(bigNumberify(1), bigNumberify(2)))
         .toBe(false));
    });

    describe('`ge` that', () => {
      it('returns `true` when its first argument is greater than or equal to its second', () => {
        const { ge, bigNumberify } = stdlib;

        expect(ge(bigNumberify(5), bigNumberify(5))).toBe(true);
        expect(ge(bigNumberify(5), bigNumberify(4))).toBe(true);
      });

      it('returns `false` when its first argument is less than its second', () =>
         expect(stdlib.ge(bigNumberify(5), bigNumberify(6)))
         .toBe(false));
    });

    describe('`gt` that', () => {
      it('returns `true` when its first argument is greater than its second', () =>
         expect(stdlib.gt(bigNumberify(5), bigNumberify(4)))
         .toBe(true));

      it('returns `false` when its first argument is equal to or less than its second', () => {
        const { gt, bigNumberify } = stdlib;

        expect(gt(bigNumberify(5), bigNumberify(5))).toBe(false);
        expect(gt(bigNumberify(5), bigNumberify(6))).toBe(false);
      });
    });

    describe('`le` that', () => {
      it('returns `true` when its first argument is lesser than or equal to its second', () => {
        const { le, bigNumberify } = stdlib;

        expect(le(bigNumberify(5), bigNumberify(5))).toBe(true);
        expect(le(bigNumberify(4), bigNumberify(5))).toBe(true);
      });

      it('returns `false` when its first argument is greater than its second', () =>
         expect(stdlib.le(bigNumberify(6), bigNumberify(5)))
         .toBe(false));
    });

    describe('`lt` that', () => {
      it('returns `true` when its first argument is lesser than its second', () =>
         expect(stdlib.lt(bigNumberify(4), bigNumberify(5)))
         .toBe(true));

      it('returns `false` when its first argument is equal to or greater than its second', () => {
        const { lt, bigNumberify } = stdlib;

        expect(lt(bigNumberify(5), bigNumberify(5))).toBe(false);
        expect(lt(bigNumberify(6), bigNumberify(5))).toBe(false);
      });
    });
  });


  describe('exposes a `BigNumber` arithmetic function called', () => {
    it('`add` that sums its arguments', () =>
       expect(stdlib.add(bigNumberify(12), bigNumberify(1))
              .eq( bigNumberify(13)))
       .toBe(true));

    it('`sub` that subtracts its second argument from its first', () =>
       expect(stdlib.sub(bigNumberify(12), bigNumberify(1))
              .eq( bigNumberify(11)))
       .toBe(true));

    it('`mod` that returns the remainder of its first argument divided by its second', () =>
       expect(stdlib.mod(bigNumberify(10), bigNumberify(4))
              .eq( bigNumberify(2)))
       .toBe(true));

    it('`mul` that returns the product of its arguments', () =>
       expect(stdlib.mul(bigNumberify(3), bigNumberify(5))
              .eq( bigNumberify(15)))
       .toBe(true));
  });

  describe('exports', () => {
    const stdlibExports = Object.keys(stdlib).sort();
    const algoStdlibExports = Object.keys(ALGO_stdlib).sort();

    it('should only export a few extra things compared to ALGO', () =>
       expect(stdlibExports.filter(x => !algoStdlibExports.includes(x)))
       .toBe(['fromWei', 'toWei', 'toWeiBigNumber']));

    it('should export everything that ALGO does', () =>
       expect(algoStdlibExports.filter(x => !stdlibExports.includes(x)))
       .toBe([]));
  });
}); });