var hrg = require('./htmlReportGenerator')

// hrg.createBuildReport('io-testlogs', 'testsMeta.json', 'buildReport.html')
// hrg.createBuildReport('newJobLogs', 'testsMeta.json', 'newBuildReport.html')
// hrg.createBuildReport('sampleBuildLogs', 'testsMeta.json', 'BuildReport.html')

// hrg.createBuildComparisonReport('iotest-old', 'iotest-b806')
// hrg.createBuildComparisonReport('iotest-b806', 'iotest-b810')

// hrg.createBuildComparisonReport('iotest-b4jobs', 'iotest-b812')
// hrg.createBuildComparisonReport('iotest-b812', 'iotest-b4jobs')
// hrg.createBuildComparisonReport('iotest-old', 'iotest-b4jobs')
hrg.createBuildComparisonReport('iotest-old', 'iotest-b4jobs', 'tempReport.html')
