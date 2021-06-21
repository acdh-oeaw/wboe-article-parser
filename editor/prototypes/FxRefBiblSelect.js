const localFunctions = {
  updateData (eObj, first) {
    if (!eObj.fxFunction) {
      // console.log('RefBiblSelect - updateData new')
      eObj.fxFunction = 'RefBiblSelect'
      eObj.fxData.belege = eObj.parserObj.root.additionalFiles[eObj.parserObj.options.getOption('editor.fxFunction.filename')].JSON
    }
  }
}

export default localFunctions
