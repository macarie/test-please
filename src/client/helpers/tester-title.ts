import type { Tester } from '../types/tester.js'

const testerTitleSymbol = Symbol('testerTitle')

export const getTesterTitle = <Context>(tester: Tester<Context>): string =>
  Reflect.get(tester, testerTitleSymbol) as string

export const setTesterTitle = <Context>(
  tester: Tester<Context>,
  title: string
): boolean => Reflect.set(tester, testerTitleSymbol, title)
