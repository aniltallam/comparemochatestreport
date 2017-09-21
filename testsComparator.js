var fs = require('fs')
var path = require('path')
var async = require('async')
var logProcessor = require('./logProcessor')
var util = require('./util')

function addJobField (testsJson, jobName) {
  testsJson.forEach(function (test, index) {
    // test, file, suite, dur
    test.job = jobName
  })
}

function getBuildJsonData (logsDir, metaFile, done) {
  var inputFiles = fs.readdirSync(logsDir).filter(function (file) { return util.isEndsWith(file, '.log') })
  var testsMeta = JSON.parse(fs.readFileSync(logsDir + path.sep + metaFile))
  console.log('inputFiles', inputFiles)
  async.mapSeries(inputFiles, function (iFile, cb) {
    logProcessor.extractTestDataFromLogFile(logsDir + path.sep + iFile, testsMeta, function (err, jsonData) {
      if (err) return cb(err)
      var jobName = iFile.replace('.log', '')
      addJobField(jsonData, jobName)
      cb(null, jsonData)
    })
  }, function (err, results) {
    if (err) return done(err)
    var finalJsonData = results.reduce(function (pV, cV) { return pV.concat(cV) }, [])
    done(null, finalJsonData)
  })
}

function combineData (jsonDatas) {
  var rdata = []
  function addToResultData (item) {
    var rItem = util.find(rdata, function (ritem) {
      return ritem.test === item.test
    })
    if (rItem) {
      rItem.durs.push(item.dur)
    } else {
      rItem = util.deepClone(item)
      rItem.durs = [rItem.dur]
      rdata.push(rItem)
    }
  }
  jsonDatas.forEach(function (jsonData) {
    jsonData.forEach(function (item) {
      addToResultData(item)
    })
  })
  return rdata
}

function calculateDurChange (cData) {
  var xSum = 0
  var ySum = 0
  cData.forEach(function (item) {
    if (item.durs && item.durs.length > 1) {
      var x = item.durs[0]
      var y = item.durs[1]
      item.change = (y - x) * 100.0 / x
      xSum += x
      ySum += y
    }
  })
  var summary = {test: 'Summary of comparison', file: '', durs: [xSum, ySum], change: (ySum - xSum) * 100.0 / xSum}
  cData.push(summary)
}

function createJsonReport (dir1, dir2, done) {
  async.series({
    oldData: async.apply(getBuildJsonData, dir1, 'testsMeta.json'),
    newData: async.apply(getBuildJsonData, dir2, 'testsMeta.json')
  }, function (err, results) {
    if (err) return done(err)
    // console.log('oldData', results.oldData)
    // console.log('newData', results.newData)
    var jsonDatas = [results.oldData, results.newData]
    var combinedData = combineData(jsonDatas)
    calculateDurChange(combinedData)
    done(null, combinedData)
  })
}

exports.createJsonReport = createJsonReport
