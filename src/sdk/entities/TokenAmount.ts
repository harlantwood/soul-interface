import { CurrencyAmount, JSBI, Token } from 'sdk';
export declare type BigintIsh = JSBI | bigint | string;
export declare class TokenAmount extends CurrencyAmount<Token> {
    readonly token: Token;
    constructor(token: Token, amount: BigintIsh);
    add(other: TokenAmount): TokenAmount;
    subtract(other: TokenAmount): TokenAmount;
}
