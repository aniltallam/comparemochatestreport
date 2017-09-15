var fs = require('fs')
var path = require('path')
var readline = require('readline')
var Stream = require('stream')
var stripAnsi = require('strip-ansi')
var async = require('async')

// var CSV_SEPARATOR = '#'

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (str) {
    return this.substring(this.length - str.length, this.length) === str
  }
}

function process (logFile, cb) {
  var instream = fs.createReadStream(logFile)
  var outstream = new Stream()
  var rl = readline.createInterface(instream, outstream)

  // var resJson = []
  // var resCSV = ''
  var resHtmlTable = '<tr><th>#</th><th>Test Name</th><th>Duration (mins)</th></tr>\n'
  var count = 1
  rl.on('line', function (line) {
    // process line here
    // var line2 = stripAnsi(line)
    var index = line.search(/\(([0-9]+ms)\)/)
    if (index > -1) {
      var testName = stripAnsi(line.slice(0, index))
      var durationText = stripAnsi(line.slice(index))
      durationText = durationText.replace(/\(|\)|ms/g, '')
      testName = testName.replace(/(2017-.*âœ“ )/, '').trim()
      // console.log('durationText, testName', durationText, testName)
      // resJson.push({ test: testName, dur: toMinutes(durationText) })
      // resCSV += testName + CSV_SEPARATOR + toMinutes(durationText) + '\n'

      resHtmlTable += '<tr><td>' + count++ + '</td><td>' + testName + '</td><td>' + toMinutes(durationText) + '</td></tr>'
    }
  })

  rl.on('close', function () {
    // do something on finish here
    // var outputText = JSON.stringify(resJson, null, 2)
    // var outputText = resCSV
    var outputText = '<table style="width:100%">' + resHtmlTable + '</table>'
    // console.log('Result is \n', outputText)
    cb(null, outputText)
  })
  rl.on('error', function (err) {
    console.error('Error is \n', err)
    cb(err)
  })
}
function generateHtml (logsDir) {
  var OUTPUT_FILE = 'result.html'
  var inputFiles = fs.readdirSync(logsDir).filter(function (file) { return file.endsWith('.log') })
  console.log('inputFiles', inputFiles)
  async.mapSeries(inputFiles, function (iFile, cb) {
    process(logsDir + path.sep + iFile, function (err, outputText) {
      if (err) return cb(err)
      var jobName = iFile.replace('.log', '')
      cb(null, '<h2>' + jobName + '</h2>' + outputText)
    })
  }, function (err, results) {
    if (err) return console.error(err)
    var htmlBody = results.reduce(function (pV, cV) { return pV + cV }, '')
    htmlBody = '<!DOCTYPE html><html>' +
     '<head><style>table, th, td {border: 1px solid lightgrey;border-collapse:collapse;}</style></head>' +
     '<body>' + htmlBody + '</body></html>'

    fs.writeFile(logsDir + path.sep + OUTPUT_FILE, htmlBody, function (err) {
      if (err) return console.error('Error writing to =>', OUTPUT_FILE)
      console.log('processed', inputFiles, '\n\tand generated', OUTPUT_FILE)
    })
  })
}

generateHtml('io-testlogs')


// helper functions
function toMinutes (inMs) {
  return Math.round(inMs / 600) / 100
}
