import { describe, test, expect } from 'bun:test'
import { StringParser } from './string'
import { Cursor } from 'commons/lib/data-structures/cursor'
import { ASTNode, ASTString } from '../language/ast'
import { Results } from 'commons/lib/utils/result'

test('String parser', function () {
    const parser = new StringParser()
    expect(
        parser.parse(new Cursor([ASTNode(ASTString('string'), [0, 0])]))
    ).toEqual(['string'])
    expect(
        Results.isErr(parser.parse(new Cursor([] as ASTNode<ASTString>[])))
    ).toEqual(true)
})
