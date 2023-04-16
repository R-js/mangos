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
