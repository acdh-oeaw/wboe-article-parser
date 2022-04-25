const localFunctions = {
  htmlEncode (html) {		// HTML-Sonderzeichen schützen
    return document.createElement('a').appendChild(document.createTextNode(html)).parentNode.innerHTML
  },
  hasSubProp (obj, properties, retVal = false) {		// Ermitten ob Property in einem verschachtelten Objekt existiert
    var out = false
    if ((typeof properties === 'string') && (properties !== null) && properties.length > 0) {
      var aObj = obj
      if (properties.indexOf('.') !== -1) {
        properties.split('.').some(function (property) {
          if ((aObj !== null) && (typeof aObj === 'object')) {
            if (aObj.hasOwnProperty(property)) {
              out = true
              aObj = aObj[property]
            } else {
              out = false
              return true
            }
          } else {
            out = false
            return true
          }
        })
      } else {
        let property = properties
        if ((aObj !== null) && (typeof aObj === 'object')) {
          if (aObj.hasOwnProperty(property)) {
            out = true
            aObj = aObj[property]
          }
        }
      }
    }
    return ((retVal) ? ((out) ? aObj : null) : out)
  },
  getValOfSubProp (obj, properties) {		// Gibt Wert eines Property eines verschachtelten Objekts zurück
    return localFunctions.hasSubProp(obj, properties, true)
  },
  isValInArrOfSubProp (obj, properties, value) {		// Ist Wert in Array eines verschachtelten Objekts vorhanden
    var aObj = localFunctions.getValOfSubProp(obj, properties)
    if (Array.isArray(aObj)) {
      return (aObj.indexOf(value) > -1)
    } else {
      return null
    }
  },
  getFirstKeyOfValueInPropertyOfArray (arr, property, value) {
    let rKey = -1
    if (Array.isArray(arr)) {
      arr.some(function (aVal, aKey) {
        if (aVal[property] && aVal[property] === value) {
          rKey = aKey
          return true
        }
      }, this)
    }
    return rKey
  },
  getFirstObjectOfValueInPropertyOfArray (arr, property, value, returnObj) {
    let rObj = ((returnObj) ? {} : null)
    if (Array.isArray(arr)) {
      for (var i = 0, iLen = arr.length; i < iLen; i++) {
        if (arr[i][property] === value) {
          rObj = arr[i]
          break
        }
      }
    }
    return rObj
  },
  deepSeal (o) {
    if (o) {
      const self = this
      Object.seal(o)
      Object.preventExtensions(o)
      if (o === undefined) {
        return o
      }
      Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (o[prop] !== null && prop[0] !== '$' && (typeof o[prop] === 'object' || typeof o[prop] === 'function') && !Object.isSealed(o[prop])) {
          self.deepSeal(o[prop])
        }
      })
    }
    return o
  },
}

export default localFunctions
