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

  var resJson = []
  // var resCSV = ''
  // var resHtmlTable = '<tr><th>#</th><th>Test Name</th><th>Duration (mins)</th></tr>\n'
  // var count = 1
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
      resJson.push({ test: testName, dur: durationText / 1 })
      // resCSV += testName + CSV_SEPARATOR + toMinutes(durationText) + '\n'

      // resHtmlTable += '<tr><td>' + count++ + '</td><td>' + testName + '</td><td>' + toMinutes(durationText) + '</td></tr>'
    }
  })

  rl.on('close', function () {
    // do something on finish here
    // var outputText = JSON.stringify(resJson, null, 2)
    // var outputText = resCSV
    // var outputText = '<table style="width:100%">' + resHtmlTable + '</table>'
    // console.log('Result is \n', outputText)
    cb(null, resJson)
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

function generateJSON (logsDir, cb) {
  var inputFiles = fs.readdirSync(logsDir).filter(function (file) { return file.endsWith('.log') })
  console.log('inputFiles', inputFiles)
  async.mapSeries(inputFiles, function (iFile, cb) {
    process(logsDir + path.sep + iFile, function (err, jsonData) {
      if (err) return cb(err)
      var jobName = iFile.replace('.log', '')
      cb(null, { job: jobName, tests: jsonData })
    })
  }, function (err, results) {
    return cb(err, results)

    // if (err) return console.error(err)
    // var OUTPUT_FILE = 'result.json'
    // fs.writeFile(logsDir + path.sep + OUTPUT_FILE, JSON.stringify(results, null, 2), function (err) {
    //   if (err) return console.error('Error writing to =>', OUTPUT_FILE)
    //   console.log('processed', inputFiles, '\n\tand generated', OUTPUT_FILE)
    // })
  })
}

// generateHtml('io-testlogs')
var FOLDER = 'io-testlogs'
var TESTS_METAFILE = 'testsMeta.json'
generateJSON(FOLDER, function (err, jobsData) {
  if (err) return console.error(err)
  var testsMeta = JSON.parse(fs.readFileSync(FOLDER + path.sep + TESTS_METAFILE))
  var newJobsData = []
  jobsData.forEach(function (jobData) {
    newJobsData = newJobsData.concat(splitJob(jobData, testsMeta))
  })
  // console.log('final jobs=>', JSON.stringify(newJobsData, null, 2))

  var newLsit = {}
  newJobsData.forEach(function (newJob, index) {
    var dur = newJob.map(function (val) { return val.dur })
      .reduce(function (pv, cv) { return pv + cv }, 0)
    var o1 = {
      files: newJob,
      dur: dur
    }
    newLsit['Job' + index] = o1
  })

  console.log('final jobs=>', JSON.stringify(newLsit, null, 2))
})



function splitJob (jobData, testsMeta) {
  // return [jobData, {}]
  var job = jobData.job
  var tests = jobData.tests
  var tt = tests.map(function (item) { return item.dur }).reduce(function (pv, cv) { return pv + cv }, 0)
  console.log(job, 'Total time=', tt)
  tests = clone(tests)

  var fileslist = []
  function addToFileList (test, filename) {
    var resList = fileslist.filter(function (val) { return val.filename === filename })
    test = clone(test)
    test.dur = toMinutes(test.dur)
    var fileObj
    if (resList.length < 1) {
      fileObj = {filename: filename, dur: test.dur}

      // test = clone(test)
      // test.dur = toMinutes(test.dur)
      fileObj.tests = [test]

      fileslist.push(fileObj)
    } else {
      fileObj = resList[0]
      fileObj.dur += test.dur

      // test = clone(test)
      // test.dur = toMinutes(test.dur)
      fileObj.tests.push(test)
    }
  }

  tests.forEach(function (test) {
    testsMeta.forEach(function (tm) {
      if (tm.title === test.test) {
        // test.file = tm.file
        addToFileList(test, tm.file)
      }
    })
  })

  // console.log('new fileslist', fileslist)
  var gen = require('./gen')
  var newJobs = gen(fileslist, function (a) {
    // console.log('Temp: I am called =>', a['dur'])
    return a['dur']
  })
  // console.log('split them to ==> ', newJobs)
  return newJobs
}


// helper functions
function toMinutes (inMs) {
  return Math.round(inMs / 600) / 100
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
