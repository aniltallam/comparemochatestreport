var fs = require('fs')
var readline = require('readline')
var Stream = require('stream')
var stripAnsi = require('strip-ansi')

// Reads a log file and returns the tests json data {test, dur}
function extractTestDataFromLogFile (logFile, testsMeta, cb) {
  var instream = fs.createReadStream(logFile)
  var outstream = new Stream()
  var rl = readline.createInterface(instream, outstream)

  var resJson = []
  rl.on('line', function (line) {
    // process line here
    // var line2 = stripAnsi(line)
    var index = line.search(/\(([0-9]+ms)\)/)
    if (index > -1) {
      var testName = stripAnsi(line.slice(0, index))
      var durationText = stripAnsi(line.slice(index))
      durationText = durationText.replace(/\(|\)|ms/g, '')
      if (testName.indexOf('✓') > -1) {
        testName = testName.replace(/(2017-.*✓ )/, '').trim()
      } else {
        testName = testName.replace(/(2017-.*âœ“ )/, '').trim()
      }
      // console.log('durationText, testName', durationText, testName)
      resJson.push({ test: testName, dur: durationText / 1 })
    }
  })
  rl.on('close', function () {
    // console.log('Result is \n', resJson)
    if (testsMeta) AddFileAndSuiteToTestsData(resJson, testsMeta)
    cb(null, resJson)
  })
  rl.on('error', function (err) {
    console.error('Error is \n', err)
    cb(err)
  })
}

function AddFileAndSuiteToTestsData (testsJson, testsMeta) {
  testsJson.forEach(function (test) {
    testsMeta.forEach(function (tm) {
      if (tm.title === test.test) {
        test.file = tm.file
        test.suite = tm.suite
      }
    })
  })
}

exports.extractTestDataFromLogFile = extractTestDataFromLogFile
