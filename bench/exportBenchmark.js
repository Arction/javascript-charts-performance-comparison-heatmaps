const XLSX = require('xlsx')
const fs = require('fs')

const src = 'pc-highend'
const data = JSON.parse(fs.readFileSync(`benchmarks_${src}.json`));

const wb = XLSX.utils.book_new()
wb.Props = {
    Title: 'JavaScript Heatmap performance comparison',
}

// #region Static heat map tests
;(() => {
    const sheetName = 'Static'
    wb.SheetNames.push(sheetName)
    const srcData = data['Static']
    const tests = Object.keys(srcData)
    const libraries = Object.keys(srcData[tests[0]])
    const ws_data = [['Heat map size', 'Web chart', 'Initial render speed']]
    tests.forEach(test => {
        libraries.forEach(library => {
            ws_data.push([
                `${test}`,
                library,
                srcData[test][library]['initialRenderMs']
            ])
        })
    })
    console.log(tests, libraries)
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    wb.Sheets[sheetName] = ws
})()
// #endregion

// #region Refresh heat map tests
;(() => {
    const sheetName = 'Refresh'
    wb.SheetNames.push(sheetName)
    const srcData = data['Refresh']
    const tests = Object.keys(srcData)
    const libraries = Object.keys(srcData[tests[0]])
    const ws_data = [['Heat map size', 'Web chart', 'FPS', 'CPU usage']]
    tests.forEach(test => {
        libraries.forEach(library => {
            ws_data.push([
                `${test}`,
                library,
                srcData[test][library]['fps'],
                srcData[test][library]['cpu']
            ])
        })
    })
    console.log(tests, libraries)
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    wb.Sheets[sheetName] = ws
})()
// #endregion

// #region Append heat map tests
;(() => {
    const sheetName = 'Append'
    wb.SheetNames.push(sheetName)
    const srcData = data['Append']
    const tests = Object.keys(srcData)
    const libraries = Object.keys(srcData[tests[0]])
    const ws_data = [['Heat map size', 'Web chart', 'FPS', 'CPU usage']]
    tests.forEach(test => {
        libraries.forEach(library => {
            ws_data.push([
                `${test}`,
                library,
                srcData[test][library]['fps'],
                srcData[test][library]['cpu']
            ])
        })
    })
    console.log(tests, libraries)
    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    wb.Sheets[sheetName] = ws
})()
// #endregion

XLSX.writeFile(wb, `benchmarks_${src}.xlsx`, {bookType: 'xlsx'})