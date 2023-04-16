# Design notes for the path selector query language


## Terminals
 
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

## Non-Terminals
### `<array-predicate>`

- `<array-predicate> ::= <identifier>[ <index-predicate> ]`
- `<index-predicate> ::= 'n' <comparison-operator> <numerical-constant>`
- `<comparison-operator> ::=` one out of the sequence `<`, `>`, `!=`, `==`, `>=`, `<=`
- `<numerical-constant> ::=` positive integer `[1-9]{1}[0-9]*`

## `<query>`

- `<query> ::= <path-separator>? (<query> | <predicate>)`


```javascript
// the pattern is identifier[xxxx]
// xxx can be any of
//  1.  n > 1
//  2.  n < 1
//  3.  n >= 4
//  4.  n <= 3
//  5.  n == 4
//  6.  n != 4

// <function> = upper(), lower(), distinct(), count(), not(), sum(), concat()

//* 2.  <identifier>'['<ws>?'n'?<ws>?<boolean operator><ws>?<integer><ws>?']<ws>?<boolean operator><ws>?<regexp>'
//* 5.  <identifier>'['<ws>?'n'?<ws>?<boolean operator><ws>?<integer><ws>?']<ws>?<boolean operator><ws>?<value>'
//* 10. <identifier>'['<ws>?'n'?<ws>?<boolean operator><ws>?<integer><ws>?']'
//* 25. <identifier>'['<ws>?<integer><ws>?']'<ws>?<boolean operator><ws>?<regexp>
//* 30. <identifier>'['<ws>?<integer><ws>?']'<ws>?<boolean operator><ws>?<value>
//* 35. <identifier>'['<ws>?<integer><ws>?']'
//* 40. <identifier><ws>?<boolean operator><ws>?<value>
//* 50. <identifier><ws>?<boolean operator><ws>?regexp()
//* 60. <identifier>
//* 61a   <function>(<identifier>) (operates on the value)

// 70. regexp(<constant expression>)<ws>?<boolean operator><ws>?regexp()
// 80. regexp(<constant expression>)<boolean operator><identifier>
// 90. regexp(<constant expression>)'['<ws>?'n'?<ws>?<boolean operator><ws>?<integer><ws>?']' (only if the regexp selects a an array node)

/*
a. 61a,70,80,90
   64
b. 60[a]->10
   b.a 60[a]->10->2
   b.b 60[a]->10->5
b. 60[a]->50
b. 60[a]->35
   b.a 60[a]->35->25
   b.b 60[a]->35->30
c. 60[a]->40
c  60[a]->20
*/

// AST
/*
 
  expression
     binaryExpression|unaryExpression
     left: functionExpression
            name: (name of function)
            arguments:(identifier|functionExpression)[]

  expression ::= binaryExpression|unaryExpression
  unaryExpression ::= functionExpression | Identifier
  functionExpression ::= name(<identifier|functionExpression>[])
  identifier ::= char-sequence 
*/

| tokenstream |  ast |
|-------|-|
```