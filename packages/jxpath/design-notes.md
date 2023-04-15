# Design notes for the path selector query language


## Non Terminals
 
### `<path-separator>`

- `<path-separator> ::= '/'`.

###  `<identifier>`

- `<identifier>` is any code point allowed as part of a js object-property-name.

Characters from this sequence need to be escaped `\\` to be included in an `<identifier>`
**An escape sequence is a double `\\`, this is because `\` is an escape character in js itself.**

Example: if you want to include `{` as part of an identifier name escape it like  `\\{`, hence an identifier written as `firts\\{name\\}` will internally become `first{name}`.

1. `{` escape as `\\{` 
2. `}` escape as `\\}` 
3. `"` escape as `\\"` 
4. `\` escape as `\\\\`
5. `'` escape as `'`
6. `[` escape as `\\[`
7. `/` escape as `\\/`
8. `>` escape as `\\>`
9. `=` escape as `\\=`
10. `<` escape as `\\<`
11. `!` escape as `\\!`
12. `+` escape as `\\=`
13. `-` escape as `\\=`
14. `*` escape as `\\=`
15. `@` escape as `\\=`
16. ` `(single space) escape as `\\ `

An identifier character sequence is terminated when one of the above characters is encountered NON-escaped.

### `<array-predicate>`

- `<array-predicate> ::= <identifier>[ <index-predicate> ]`
- `<index-predicate> ::= 'n' <comparison-operator> <numerical-constant>`
- `<comparison-operator> ::=` one out of the sequence `<`, `>`, `!=`, `==`, `>=`, `<=`
- `<numerical-constant> ::=` positive integer `[1-9]{1}[0-9]*`

