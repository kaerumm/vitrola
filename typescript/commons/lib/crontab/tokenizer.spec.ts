import { describe, test, expect } from 'bun:test'
import { Tokenizer, keywords } from './tokenizer'
import { range } from '../utils/range'

test('Cron tokenizer number', function () {
    for (const number of range(0, 2099)) {
        expect(Tokenizer.tokenize(number.toString(10))).toEqual([
            { kind: 'number', value: number },
        ])
    }
})

test('Cron tokenizer symbols', function () {
    // star
    expect(Tokenizer.tokenize('*')).toEqual([{ kind: 'star' }])
    // forward slash
    expect(Tokenizer.tokenize('/')).toEqual([{ kind: 'forward_slash' }])
    // comma
    expect(Tokenizer.tokenize(',')).toEqual([{ kind: 'comma' }])
    // dash
    expect(Tokenizer.tokenize('-')).toEqual([{ kind: 'dash' }])
})

test('Cron tokenizer keywords', function () {
    for (const keyword of keywords) {
        expect(Tokenizer.tokenize(keyword)).toEqual([
            { kind: 'keyword', key: keyword },
        ])
    }
    console.log(Array.from(range(1, 12, 1, true)).join(' | '))
})
