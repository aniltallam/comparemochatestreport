var fs = require('fs')
var path = require('path')
var async = require('async')
var logProcessor = require('./logProcessor')
var util = require('./util')
var testsComparator = require('./testsComparator')

function generateHtmlTableFromTestsData (testsJson) {
  var htmlTable = '<table style="width:100%">' +
    '<tr><th>#</th><th>File</th><th>Test Name</th><th>Duration (mins)</th></tr>\n'
  testsJson.forEach(function (test, index) {
    // test, file, suite, dur
    htmlTable += '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + test.file + '</td>' +
      '<td>' + test.test + '</td>' +
      '<td>' + util.toMinutes(test.dur) + '</td>' +
    '</tr>'
  })
  htmlTable += '</table>'
  return htmlTable
}

function createBuildReport (logsDir, metaFile, outputFile) {
  var inputFiles = fs.readdirSync(logsDir).filter(function (file) { return util.isEndsWith(file, '.log') })
  var testsMeta = JSON.parse(fs.readFileSync(logsDir + path.sep + metaFile))
  console.log('inputFiles', inputFiles)
  async.mapSeries(inputFiles, function (iFile, cb) {
    logProcessor.extractTestDataFromLogFile(logsDir + path.sep + iFile, testsMeta, function (err, jsonData) {
      if (err) return cb(err)
      var htmlTable = generateHtmlTableFromTestsData(jsonData)
      var jobName = iFile.replace('.log', '')
      var text = '<h2>' + jobName + '</h2>' +
        htmlTable +
        '<br/>Total = ' + util.toMinutes(util.getTotalTime(jsonData)) + ' minutes'
      cb(null, text)
    })
  }, function (err, results) {
    if (err) return console.error(err)

    var htmlBody = results.reduce(function (pV, cV) { return pV + cV }, '')
    htmlBody = '<!DOCTYPE html><html>' +
     '<head><style>table, th, td {border: 1px solid lightgrey;border-collapse:collapse;}</style></head>' +
     '<body>' + htmlBody + '</body></html>'
    if (!outputFile) outputFile = 'BuildReport_' + logsDir + '.html'
    fs.writeFile(logsDir + path.sep + outputFile, htmlBody, function (err) {
      if (err) return console.error('Error writing to =>', outputFile, err)
      console.log('processed', inputFiles, '\n\tand generated', outputFile)
    })
  })
}

function generateHtmlTableFromTestsData2 (testsJson) {
  var htmlTable = '<table style="width:100%">' +
    '<tr><th>#</th><th>File</th><th>Test Name</th><th>Status</th><th>Durs</th><th>Change</th></tr>\n'
  testsJson.forEach(function (test, index) {
    // test, file, suite, dur
    var durs = JSON.stringify(test.durs.map(function (val) { return util.toMinutes(val) }))
    htmlTable += '<tr>' +
      '<td>' + (index + 1) + '</td>' +
      '<td>' + test.file + '</td>' +
      '<td>' + test.test + '</td>' +
      '<td>' + test.status + '</td>' +
      '<td>' + durs + '</td>' +
      '<td>' + Math.fround(test.change) + ' %</td>' +
    '</tr>'
  })
  htmlTable += '</table>'
  return htmlTable
}

function createBuildComparisonReport (dir1, dir2, outputFile) {
  testsComparator.createJsonReport(dir1, dir2, function (err, jsonData) {
    if (err) return console.error(err)

    var htmlBody = generateHtmlTableFromTestsData2(jsonData)
    htmlBody = '<!DOCTYPE html><html>' +
      '<head><style>table, th, td {border: 1px solid lightgrey;border-collapse:collapse;}</style></head>' +
      '<body>' + htmlBody + '</body></html>'
    if (!outputFile) outputFile = 'CompareReport_' + dir1 + 'vs' + dir2 + '.html'
    fs.writeFile(outputFile, htmlBody, function (err) {
      if (err) return console.error('Error writing to =>', outputFile, err)
      console.log('generated', outputFile)
    })
  })
}

exports.createBuildReport = createBuildReport
exports.createBuildComparisonReport = createBuildComparisonReport
