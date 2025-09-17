var sorted = require('../')
var fixtures = require('./fixtures')
var tape = require('tape')
var comparators = {
  descending: function (a, b) { return b - a }
}

fixtures.forEach(function (f) {
  tape('returns ' + f.expected + ' for ' + f.array, function (t) {
    t.plan(1)

    var actual = sorted(f.array, comparators[f.comparator])
    t.equal(actual, f.expected)
  })
})

tape('throws on non-Array inputs', function (t) {
  t.plan(1)
  t.throws(function () {
    sorted('foobar')
  }, /Expected Array, got string/)
})
