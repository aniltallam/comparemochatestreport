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
      rItem.status.push(item.isPass)
    } else {
      rItem = util.deepClone(item)
      rItem.durs = [rItem.dur]
      rItem.status = [rItem.isPass]
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
  var pY = 0, pX = 0, fY = 0, fX = 0
  var xPassed = true
  var yPassed = true
  cData.forEach(function (item) {
    if (item.durs && item.durs.length > 1) {
      var x = item.durs[0]
      var y = item.durs[1]
      item.change = (y - x) * 100.0 / x
      xSum += x
      ySum += y
      xPassed = xPassed && item.status[0]
      yPassed = yPassed && item.status[1]
      if (item.status[0] && item.status[1]) {
        pY += y; pX += x
      } else {
        fY += y; fX += x
      }
    }
  })
  var summary = {
    test: 'Summary of All',
    file: '',
    durs: [xSum, ySum],
    change: (ySum - xSum) * 100.0 / xSum,
    status: [xPassed, yPassed]
  }
  var psummary = {
    test: 'Summary of Only Passed',
    file: '',
    durs: [pX, pY],
    change: (pY - pX) * 100.0 / pX,
    status: [xPassed, yPassed]
  }
  var fsummary = {
    test: 'Summary of Only Failed',
    file: '',
    durs: [fX, fY],
    change: (fY - fX) * 100.0 / fX,
    status: [xPassed, yPassed]
  }
  cData.push(psummary)
  cData.push(fsummary)
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
