// helper functions
function isEndsWith (str, searchStr) {
  if (typeof String.prototype.endsWith !== 'function') {
    return str.substring(str.length - searchStr.length, str.length) === searchStr
  } else {
    return str.endsWith(searchStr)
  }
}

function find (arr, predicate) {
  for (var i = 0, item; i < arr.length; i++) {
    item = arr[i]
    // inlined for performance: if (ES.Call(predicate, thisArg, [value, i, list])) {
    if (predicate(item, i, arr)) {
      return item
    }
  }
  return void 0
}

function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function toMinutes (inMs) {
  return Math.round(inMs / 600) / 100
}

function getTotalTime (testsJson) {
  var totalDur = 0
  testsJson.forEach(function (test, index) {
    totalDur += test.dur
  })
  return totalDur
}

exports.isEndsWith = isEndsWith
exports.find = find
exports.deepClone = deepClone
exports.toMinutes = toMinutes
exports.getTotalTime = getTotalTime
