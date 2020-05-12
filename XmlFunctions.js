const localFunctions = {
  string2xmlDom (string, showAlert = true) {
    var xmlDom = new DOMParser().parseFromString(string, 'application/xml')
    var xmlStringError = localFunctions.xmlDomCheck(xmlDom)
    if (xmlStringError.length > 0) {
      if (showAlert) {
        alert('Beim verarbeiten der XML ist es zu einen Fehler gekommen:\n\n' + xmlStringError)
      }
      return { 'xmlDom': null, 'errors': xmlStringError }
    }
    return { 'xmlDom': xmlDom }
  },
  xmlDomCheck (xmlDom, error = false) { // Eventuelle Fehlermeldung des DOM-Objekts ausgeben
    var txt = ''
    var x = xmlDom.childNodes
    for (var i = 0; i < x.length; i++) {
      var y = x[i]
      if (y.nodeType === y.TEXT_NODE) {
        if (error) {
          txt += y.nodeValue + '\n'
        }
      } else {
        if (y.childNodes[0]) {
          txt += localFunctions.xmlDomCheck(y, error || y.nodeName === 'parsererror')
        }
      }
    }
    return txt
  },
  hasDescendantsTagWithName (childs, tagName) {
    var hasIt = false
    if (Array.isArray(childs)) {
      childs.some(function (c) {
        if (c.n === tagName) {
          hasIt = true
          return true
        }
        if (c.c) {
          hasIt = localFunctions.hasDescendantsTagWithName(c.c, tagName)
          if (hasIt) { return true }
        }
      })
    }
    return hasIt
  },
  getFirstDescendantsTagByName (childs, tagName) {
    var obj = null
    if (Array.isArray(childs)) {
      childs.some(function (c) {
        if (c.n === tagName) {
          obj = c
          return true
        }
        if (c.c) {
          obj = localFunctions.getFirstDescendantsTagByName(c.c, tagName)
          if (obj) { return true }
        }
      })
    }
    return obj
  },
  defaultProcess () {
    return {
      'options': {
        'tagAsTitle': true,
        'attributes': null
      }
    }
  },
  defaultLayout () { return {'use': true} },
  defaultValue () { return {'use': true} },
  defaultTag () { return {'use': true} },
  defaultAttributes () { return {'type': 'variable'} },
  decompressProcessingOptions (options) { // Optionen dekomprimieren
    var deflat = JSON.parse(JSON.stringify(options))
    for (var key in deflat) {
      // tag
      if (key === 'tag' && deflat[key]) {
        deflat[key] = localFunctions.dcpoSimpleToComplex(deflat[key], localFunctions.defaultTag())
      }
      // title
      if (key === 'title' && typeof deflat[key] === 'string') {
        deflat[key] = {'value': deflat[key], 'use': true}
      }
      // attributes
      if (key === 'attributes' && deflat[key]) {
        if (typeof deflat[key] === 'object' && !Array.isArray(deflat[key])) {
          for (var cKey in deflat[key]) {
            if (typeof deflat[key][cKey] === 'string') {
              deflat[key][cKey] = {'value': deflat[key][cKey], 'type': 'fixed'}
            }
            deflat[key][cKey] = localFunctions.combineProcessingOptions(localFunctions.defaultAttributes(), deflat[key][cKey])
          }
        }
        deflat[key] = localFunctions.dcpoSimpleToComplex(deflat[key], localFunctions.defaultAttributes(), {'prop': 'value', 'std': {'type': 'fixed'}})
        for (var attrKey in deflat[key]) {
          for (var attrOption in deflat[key][attrKey]) {
            if (attrOption === 'possibleValues' && typeof deflat[key][attrKey][attrOption] === 'string') {
              deflat[key][attrKey][attrOption] = [deflat[key][attrKey][attrOption]]
            }
          }
        }
      }
      // value
      if (key === 'value' && deflat[key]) {
        deflat[key] = localFunctions.dcpoSimpleToComplex(deflat[key], localFunctions.defaultValue())
      }
      // layout
      if ((key === 'layout' && deflat[key])) {
        deflat[key] = localFunctions.checkLayout(deflat[key])
      }
      // editor > layout
      if (key === 'editor' && deflat[key] && deflat[key].layout) {
        deflat[key].layout = localFunctions.checkLayout(deflat[key].layout)
      }
      // html > layout
      if (key === 'html' && deflat[key] && deflat[key].layout) {
        deflat[key].layout = localFunctions.checkLayout(deflat[key].layout)
      }
      // xml
      if (key === 'xml' && deflat[key]) {
        deflat[key] = localFunctions.dcpoSimpleToComplex(deflat[key], localFunctions.defaultValue())
      }
    }
    // Automatische Werte setzen
    if (deflat && deflat.value && deflat.value.is && deflat.value.is.shouldValue && !deflat.value.is.value) { // Wenn shouldValue gesetzt aber nicht value:
      deflat.value.is.value = deflat.value.is.shouldValue
    }
    // console.log('decompressProcessingOptions', JSON.parse(JSON.stringify(options)), JSON.parse(JSON.stringify(deflat)))
    return deflat
  },
  combineProcessingOptions (orgOptions, newOptions) {
    var comOptions = JSON.parse(JSON.stringify(orgOptions))
    if (Array.isArray(newOptions)) {
      console.log('combineProcessingOptions - array !!!???')
    } else if (typeof newOptions === 'object' && !(newOptions === null || newOptions === undefined)) {
      for (var key in newOptions) {
        if (comOptions.hasOwnProperty(key)) {
          comOptions[key] = localFunctions.combineProcessingOptions(comOptions[key], newOptions[key])
        } else {
          comOptions[key] = newOptions[key]
        }
      }
    } else {
      return newOptions
    }
    return comOptions
  },
  checkLayout (layout) { // Layout dekomprimieren
    var deflat = JSON.parse(JSON.stringify(layout))
    if (Array.isArray(deflat)) {
      var nObjValue = {}
      deflat.forEach(function (value) {
        if (typeof value === 'string') {
          nObjValue[value] = localFunctions.defaultLayout()
        } else if (typeof value === 'object') {
          for (var valueKey in value) {
            nObjValue[valueKey] = value[valueKey]
          }
        }
      })
      deflat = nObjValue
    }
    if (typeof deflat === 'object') {
      for (var key in deflat) {
        if (key === 'class' && deflat[key]) {
          deflat[key] = localFunctions.dcpoSimpleToComplex(deflat[key], localFunctions.defaultLayout())
        }
      }
    }
    // console.log('layout', JSON.parse(JSON.stringify(layout)), JSON.parse(JSON.stringify(deflat)), Array.isArray(deflat))
    return deflat
  },
  dcpoSimpleToComplex (content, standard, str2Val = null) {
    if (typeof content === 'string') {
      return {[content]: standard}
    } else if (Array.isArray(content)) {
      var nObjValue = {}
      content.forEach(function (value) {
        if (typeof value === 'string') {
          nObjValue[value] = standard
        } else if (typeof value === 'object') {
          for (var valueKey in value) {
            var nVal = value[valueKey]
            if (str2Val && typeof nVal === 'string') {
              nVal = {[str2Val.prop]: nVal}
              nObjValue[valueKey] = localFunctions.combineProcessingOptions(str2Val.std, nVal)
            } else {
              nObjValue[valueKey] = localFunctions.combineProcessingOptions(standard, nVal)
            }
          }
        }
      })
      return nObjValue
    }
    return content
  },
}

export default localFunctions
