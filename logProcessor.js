var fs = require('fs')
var readline = require('readline')
var Stream = require('stream')
var stripAnsi = require('strip-ansi')
var util = require('./util')

function removeAnsiChars () {
  var txt = fs.readFileSync('failB.txt')
  txt = stripAnsi(txt)
  fs.writeFileSync('failBRes.txt', txt)

  var instream = fs.createReadStream('failB.txt')
  var outstream = new Stream()
  var rl = readline.createInterface(instream, outstream)

  var res = ''
  rl.on('close', function () {
    // console.log('Result is \n', resJson)
    fs.writeFileSync('failBRes2.txt', res)
  })
  rl.on('error', err => console.error('Error is \n', err))
  rl.on('line', function (line) {
    res += stripAnsi(line) + '\n'
  })
}

removeAnsiChars()

// Reads a log file and returns the tests json data {test, dur}
function extractTestDataFromLogFile (logFile, testsMeta, cb) {
  var instream = fs.createReadStream(logFile)
  var outstream = new Stream()
  var rl = readline.createInterface(instream, outstream)

  var pTs
  var skip = true
  var resJson = []
  rl.on('line', function (line) {
    // process line here
    // var line2 = stripAnsi(line)

    if (skip) {
      skip = line.indexOf('make -f .travis test') < 0
      return
    }

    if (!pTs) {
      pTs = extractTS(line)
    }
    var index = line.search(/\(([0-9]+ms)\)/)
    var ts

    if (index > -1) { // for success tests
      ts = extractTS(line)

      var testName = stripAnsi(line.slice(0, index))
      var durationText = stripAnsi(line.slice(index))
      durationText = durationText.replace(/\(|\)|ms/g, '')
      if (testName.indexOf('✓') > -1) {
        testName = testName.replace(/(2017-.*✓ )/, '').trim()
      } else if (testName.indexOf('âœ“') > -1) {
        testName = testName.replace(/(2017-.*âœ“ )/, '').trim()
      } else if (testName.indexOf('���') > -1) {
        testName = testName.replace(/(2017-.*��� )/, '').trim()
      } else {
        console.error('!! Warning: Unknown mocha success symbol before it statement', testName)
      }
      // console.log('durationText, testName', durationText, testName)
      // resJson.push({ test: testName, dur: durationText / 1, isPass: true })

      resJson.push({ test: testName, dur: ts - pTs, isPass: true })

      // console.log('diff', util.toMinutes(ts - pTs - durationText / 1))
      pTs = ts
    } else if (line.search(/\[31m  [0-9]\)/) > -1) {
      ts = extractTS(line)

      // console.log(ts, stripAnsi(line), '\n', ts - pTs)

      var testName2 = stripAnsi(line.replace(/(2017-.*\[31m  [0-9]\) )/, '')).trim()
      resJson.push({ test: testName2, dur: ts - pTs, isPass: false })
      pTs = ts
    }

    function extractTS (line) {
      var x = line.slice(0, 24)
      var ts = Date.parse(x)
      if (isNaN(ts) === false) {
        return new Date(ts)
      } else {
        console.log(line)
        return null
      }
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
