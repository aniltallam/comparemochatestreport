var fs = require('fs')
var readline = require('readline')
var Stream = require('stream')
var stripAnsi = require('strip-ansi')

function process (logFile) {
  var instream = fs.createReadStream(logFile)
  var outstream = new Stream()
  var rl = readline.createInterface(instream, outstream)

  var res = []
  rl.on('line', function (line) {
    // process line here
    var line2 = stripAnsi(line)
    var index = line.search(/\(([0-9]+ms)\)/)
    if (index > -1) {
      var testName = stripAnsi(line.slice(0, index))
      var durationText = stripAnsi(line.slice(index))
      durationText = durationText.replace(/\(|\)|ms/g, '')
      testName = testName.replace(/(2017-05-02.*âœ“ )/, '')
      // console.log('durationText, testName', durationText, testName)
      res.push({test: testName, dur: durationText})
    }
  })

  rl.on('close', function () {
    // do something on finish here
    console.log('Result is \n', JSON.stringify(res))
  })
}

process('input.log')
