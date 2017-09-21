var _ = require('lodash')

console.debug = function () {}

function equalPartitionBruteForce (set, getIntFunc) {
  set.sort(function (a, b) { return getIntFunc(a) < getIntFunc(b) })
  var target = set.map(function (val) {
    var x = getIntFunc(val)
    console.debug('Temp: val in map =>', x)
    return x
  })
    .reduce(function (pv, cv) { return pv + cv }, 0) / 2.0
  console.debug('Target = ', target)
  var best = null
  function run (set, start, end, startSet, startSetSum) {
    if (start >= end) {
      if (!best) {
        best = {sum: startSetSum, subSet: startSet}
      } else {
        if (Math.abs(best.sum - target) > Math.abs(startSetSum - target)) {
          best = {sum: startSetSum, subSet: startSet}
        }
      }
      return console.debug(startSet, startSetSum, best.sum)
    }
    for (var i = start; i < end; i++) {
      run(set, i + 1, end, startSet.concat(set[i]), startSetSum + getIntFunc(set[i]))
    }
  }
  run(set, 0, set.length, [], 0)
  console.debug('best sum', best.sum)
  var bestSet = best.subSet
  var anotherSet = _.difference(set, bestSet)

  console.debug('sets', bestSet, anotherSet)
  return [bestSet, anotherSet]
}

// function printAllSets (set, start, end, startSet) {
//   if (start >= end) {
//     return console.log(startSet)
//   }
//   for (var i = start; i < end; i++) {
//     printAllSets(set, i + 1, end, startSet.concat(set[i]))
//   }
// }

function equalPartition (set, getIntFunc) {
  if (!getIntFunc) {
    getIntFunc = function (a) {
      console.log('Temp: Dummy called')
      return a
    }
  }
  if (set.length < 40) {
    return equalPartitionBruteForce(set, getIntFunc)
  } else {
    throw new Error('Larger sets are not supported')
  }
}
// equalPartition([1, 2, 3, 4, 7, 8, 20, 25, 27])

module.exports = equalPartition

