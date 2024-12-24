import { describe, test, expect } from 'bun:test'
import { Cursor } from 'commons/lib/data-structures/cursor'
import { ASTNode, ASTString } from '../language/ast'
import { Results } from 'commons/lib/utils/result'
import { NumberParser } from './number'
import { LazyLocale } from '../../localization/localization_manager'

test('Number parser', function () {
    const parser = new NumberParser()
    expect(parser.parse(new Cursor([ASTNode(ASTString('1'), [0, 0])]))).toEqual(
        [1]
    )
    expect(
        parser.parse(new Cursor([ASTNode(ASTString('4.5'), [0, 0])]))
    ).toEqual([4.5])
    let result = parser.parse(new Cursor([] as ASTNode<ASTString>[]))
    if (Results.isOk(result)) {
        return expect(false).toEqual(true)
    }
    if (result.error.errorMessage instanceof LazyLocale === false) {
        return expect(false).toEqual(true)
    }
    expect(result.error.errorMessage['key']).toEqual(
        'command_number_parser_missing_value'
    )
    result = parser.parse(
        new Cursor([ASTNode(ASTString('not a number'), [0, 0])])
    )
    if (Results.isOk(result)) {
        return expect(false).toEqual(true)
    }
    if (result.error.errorMessage instanceof LazyLocale === false) {
        return expect(false).toEqual(true)
    }
    expect(result.error.errorMessage['key']).toEqual(
        'command_number_parser_invalid_value'
    )
})
