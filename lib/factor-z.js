"use strict"

module.exports = factorZ

//Find a pair of integers, [a,b] such that a*b is minimized and that:
//
//  z <= a*b
//  a * x - b * y is also minimized
//
// Ignoring integer constraint, write:
//
//    z = af * bf
//    af x = bf y
//
// So:
//
//    af = sqrt(x * z / y)
//    bf = z / af
//
// Guess that:
//
//    a = ceil(af)
//    b = ceil(bf)
//
function factorZ(x, y, z) {
  var a = Math.ceil(Math.sqrt(x * z / y))|0
  var b = Math.ceil(z / a)|0
  return [a,b]
}