const localFunctions = {
  fileData (eObj, lFile) {
    // Einstellungen
    let pFields = ['Ort', 'Gemeinde', 'Kleinregion', 'Großregion', 'Bundesland']
    let xFields = ['ort', 'gemeinde', 'kleinregion', 'grossregion', 'bundesland']
    let pFieldStart = 1
    // Vorbereitungen
    let uFields = pFields.slice(pFieldStart)
    let geoSelect = { 'pFields': pFields, 'uFields': uFields, 'xFields': xFields }
    uFields.forEach(function (aField) {
      geoSelect[aField] = []
      geoSelect[aField + 'Obj'] = {}
    })
    eObj.additionalFiles[lFile].JSON.forEach(function (aLine, aLineNr) {
      if (aLine.Sigle_DB) {
        let aStartPos = 1		// Spalte "Ort" ignorieren (Widerspricht der Logik von Kleinregion, Großregionen und Bundesländern)
        while (!aLine[pFields[aStartPos]] && aStartPos < pFields.length) {
          aStartPos += 1
        }
        if (aStartPos < pFields.length && aStartPos >= pFieldStart) {
          let sFields = pFields.slice(aStartPos)
          let fHit = true
          sFields.forEach(function (aCol, aPos) {
            if (aLine[aCol]) {
              if (fHit) {
                let aField = { 'name': aLine[aCol], 'sigle': ((aLine.Sigle_DB[0] === '/') ? '' : '/geodata-wboe.xml#' + (aLine.Sigle_DB[0] === 'p' ? '' : 'p')) + aLine.Sigle_DB, 'sort': aLineNr, 'sigle_raw': aLine.Sigle_DB, 'parents': {} }
                if (!geoSelect[aCol + 'Obj'][aLine[aCol]]) {
                  geoSelect[aCol + 'Obj'][aLine[aCol]] = { 'name': aLine[aCol] }
                }
                geoSelect[aCol + 'Obj'][aLine[aCol]].sigle_raw = aLine.Sigle_DB
                geoSelect[aCol + 'Obj'][aLine[aCol]].sigle = ((aLine.Sigle_DB[0] === '/') ? '' : '/geodata-wboe.xml#' + (aLine.Sigle_DB[0] === 'p' ? '' : 'p')) + aLine.Sigle_DB
                aField.obj = geoSelect[aCol + 'Obj'][aLine[aCol]]
                if (aPos < sFields.length - 1) {
                  sFields.slice(aPos + 1).forEach(function (xData) {
                    if (!geoSelect[xData + 'Obj'][aLine[xData]]) {
                      geoSelect[xData + 'Obj'][aLine[xData]] = { 'name': aLine[xData] }
                    }
                    aField.parents[xData] = geoSelect[xData + 'Obj'][aLine[xData]]
                  })
                }
                geoSelect[aCol].push(aField)
                fHit = false
              }
            }
          })
        }
      }
    })
    return geoSelect
  },
}

export default localFunctions
