var hrg = require('./htmlReportGenerator')

// hrg.createBuildReport('io-testlogs', 'testsMeta.json', 'buildReport.html')
// hrg.createBuildReport('newJobLogs', 'testsMeta.json', 'newBuildReport.html')
hrg.createBuildReport('sampleBuildLogs', 'testsMeta.json', 'BuildReport.html')

// hrg.createBuildComparisonReport('iotest-old', 'iotest-b806')
// hrg.createBuildComparisonReport('iotest-b806', 'iotest-b810')
