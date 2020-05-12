const localFunctions = {
  checkChilds (xmlObj) {		// Kinder überprüfen (simpel: nur Tagnamen)
    let errors = []
    let warnings = []
    let aParserChilds = this.getChilds('all', true)
    if (xmlObj.childs.length > 0) {		// Kinder vergleichen
      if (aParserChilds.length === 0) {
        errors.push('Kinder: Es wurden keine Kinder erwartet!')
      } else {
        aParserChilds.some(function (aPC) {		// Fehlende Tags ermitteln
          if (!(aPC.options.get('tag.possibleTag.use'))) {
            if (xmlObj.getChildsByName(aPC.name, true, true, aPC.options.get('oldTags')).length === 0) {
              errors.push('Kinder: Tag "' + aPC.name + '" fehlt!')
              return true
            }
          }
        }, this)
        if (errors.length === 0) {
          xmlObj.childs.some(function (xmlO) {		// Vorhandene Tags überprüfen
            if (xmlO.useable && (this.getChildsByName(xmlO.name).length === 0)) {
              let sWr = true
              aParserChilds.some(function (aPC) {
                if (Array.isArray(aPC.options.get('oldTags')) && aPC.options.get('oldTags').indexOf(xmlO.name) > -1) {
                  sWr = false
                  return true
                }
              }, this)
              if (sWr) {
                errors.push('Kinder: Tag "' + xmlO.name + '" nicht erwartet!')
                return true
              }
            }
          }, this)
        }
      }
    } else {
      let aParserChildsFilter = []
      aParserChilds.forEach(function (aPC) {
        if (!(aPC.options.get('tag.possibleTag.use'))) {
          aParserChildsFilter.push(aPC)
        }
      })
      if (aParserChildsFilter.length > 0) {
        errors.push('Kinder: Es wurden mindestens ' + aParserChilds.length + ' Kinder erwartet!')
      }
    }
    if (errors.length === 0) {
      // "tagHasChildWithAttribute": { "form": { "subtype": "MWE" } }
      let aThCwA = JSON.parse(JSON.stringify(this.options.get('tagHasChildWithAttribute')))
      if (aThCwA) {
        xmlObj.childs.forEach(function (xmlO) {
          if (xmlO.useable && Object.keys(aThCwA).indexOf(xmlO.name) > -1 && Object.keys(xmlO.attributes).length > 0) {
            let aFound = 0
            Object.keys(aThCwA[xmlO.name]).forEach(function (aAttrX) {
              if (xmlO.attributes[aAttrX] === aThCwA[xmlO.name][aAttrX]) {
                aFound += 1
              }
            }, this)
            if (Object.keys(aThCwA[xmlO.name]).length !== aFound) {
              errors.push('Nicht alle "tagHasChildWithAttribute" wurden gefunden! ' + JSON.stringify(aThCwA[xmlO.name]))
            }
          }
        }, this)
      }
    }
    return {'err': errors, 'warn': warnings}
  },
  checkPosition (editorObj, eoDirekt = false, exp = false) {
    let errors = []
    let aTagOption = this.options.get('tag')
    // ToDo: Anzahl püfen! Darf nur einmal?
    // console.log(aTagOption)
    let editorPrev = ((eoDirekt) ? editorObj.getSiblings('prev', true) : editorObj.getChilds('prev', true))
    let parserPrev = this.getSiblings('prev', true)
    if (!aTagOption || !(aTagOption.anywhere && aTagOption.anywhere.use)) {		// Feste Position
      if (parserPrev.length > 0 || editorPrev.length > 0) {		// Wenn einer von beide nicht an erster Position
        if (editorPrev.length > 0 && parserPrev.length === 0) {		// Wenn eigentlich an erster Stelle
          editorPrev.some(function (aEditor) {
            if (!aEditor.parserObj || !aEditor.parserObj.options.get('tag.anywhere.use')) {		// Wenn nicht "anywhere" weiter kontrollieren
              if (!aEditor.parserObj || !(aEditor.parserObj === this && aTagOption && aTagOption.multiple && aTagOption.multiple.use)) {		// Wenn kein "multiple" ...
                errors.push('Position: Sollte an erster Stelle stehen!')
                return true
              }
            }
          }, this)
        } else if (editorPrev.length === 0 && parserPrev.length > 0) {		// Wenn an erster Stelle aber Parser nicht
          parserPrev.some(function (aParser) {
            if (!(aParser.options.get('tag.anywhere.use') || aParser.options.get('tag.possibleTag.use'))) {		// Wenn vorhergehender Parser weder "anywhere" noch "possibleTag" ist
              errors.push('Position: Tag "' + aParser.name + '" sollte vorher stehen!')
              return true
            }
          }, this)
        } else {		// Vorherige Parser- und Editorobjekte vergleichen
          if (!(aTagOption && aTagOption.anywhere && aTagOption.anywhere.use)) {		// Wenn Tag ist nicht "anywhere", weiter prüfen
            if (editorPrev[0].parserObj !== parserPrev[0]) {		// Wenn die vorgänger Objekte nicht übereinstimmen, weiter prüfen
              if (!(aTagOption && aTagOption.multiple && aTagOption.multiple.use && this === editorPrev[0].parserObj)) {		// Wenn aktuelles Tag ist nicht multiple oder parser stimmt nicht mit vorherigen überein, weiter prüfen
                let nextParserPrev = null
                parserPrev.some(function (aParser) {
                  if (!(aParser.options.get('tag.anywhere.use') || aParser.options.get('tag.possibleTag.use'))) {		// Wenn vorhergehender Parser weder "anywhere" noch "possibleTag" ist
                    nextParserPrev = aParser
                    return true
                  }
                }, this)
                editorPrev.some(function (aEditor) {
                  if (!(aEditor.parserObj && (aEditor.parserObj.options.get('tag.anywhere.use') || aEditor.parserObj.options.get('tag.possibleTag.use')))) {		// Wenn vorhergehender Parser weder "anywhere" noch "possibleTag" ist
                    if (aEditor.parserObj !== nextParserPrev) {
                      if (nextParserPrev) {
                        errors.push('Position: Tag "' + nextParserPrev.name + '" sollte statt "' + ((aEditor.parserObj) ? aEditor.parserObj.name : aEditor.orgXmlObj.name) + '" vorher stehen! (vpe) ')
                      } else {
                        errors.push('Position: Tag sollte am Anfang stehen!')
                      }
                    }
                    return true
                  }
                }, this)
              }
            }
          }
        }
      }
    }
    if (exp) {
      if (editorObj.countParser > 0 && !(aTagOption && aTagOption.multiple && aTagOption.multiple.use)) {
        errors.push('Anzahl: Tag sollte nur einmal vorkommen!')
      }
      if (editorObj.isMultiple && !editorObj.multipleLast && !editorObj.parserObj.options.get('tag.anywhere.use') && editorObj.parserObj !== this) {
        errors.push('Position: Tag unterbricht "multiple"')
      }
      if (editorObj.parserObj !== this) {
        if (this.options.get('tag.multiple.use') && !this.options.get('tag.anywhere.use') && editorPrev.length > 0 && editorPrev[0].parserObj === this) {
          errors.push('Position: Tag wird von "multiple" umschlossen!')
        }
        if (!this.options.get('tag.multiple.use')) {
          let editorNext = ((eoDirekt) ? editorObj.getSiblings('next', true) : editorObj.getChilds('next', true))
          editorNext.some(function (eObj) {
            if (eObj.parserObj === this) {
              errors.push('Anzahl: Tag sollte nur einmal vorkommen! (a)')
              return true
            }
          }, this)
        }
      }
    }
    // ToDo: if-Abfrage!
    return errors
  },
  checkValue (xmlObj) {
    let errors = []
    let warnings = []
    let ignoreChilds = false
    let aValOption = this.options.get('value')
    if (aValOption) {
      ignoreChilds = true
      let aVal = xmlObj.getValueByOption(aValOption, false)
      if (!(aValOption && (aValOption.innerXML))		// Wenn nicht "innerXML"
      && xmlObj.getChildsOfType(['ELEMENT']).length > 0) {		// und enthält "ELEMENT"e dann Warnung heraus geben
        errors.push('Wert enthält "ELEMENT"e!')
      }
      if ((aValOption && ((aValOption.edit && aValOption.edit.use) || (aValOption.variable && aValOption.variable.use)))) {
        // ToDo: min, max ... usw.
        if ((!aVal || aVal.length === 0) && !aValOption.canBeEmpty) {
          warnings.push('Wert darf nicht leer sein!')
        } else {
          if (aValOption.is && Array.isArray(aValOption.is.possibleValues)) {
            let fPV = false
            aValOption.is.possibleValues.some(function (aPV) {
              if ((aPV.title || aPV.value || aPV) === aVal) {
                fPV = true
                return true
              }
            }, this)
            if (!fPV) {
              warnings.push('Tag Wert "' + aVal + '" stimmt nicht mit den möglichen Werten überein! (v/e)')
            }
          }
        }
      } else {
        if (aValOption && aValOption.is && aValOption.is.use) {
          if (Array.isArray(aValOption.is.possibleValues)) {
            if (!aVal || aValOption.is.possibleValues.indexOf(aVal) < 0) {
              errors.push('Tag Wert "' + aVal + '" stimmt nicht mit den möglichen Werten überein!')
            }
          } else if (aValOption.is.value !== aVal) {
            errors.push('Tag Wert "' + aVal + '" stimmt nicht mit Vorlage "' + aValOption.is.value + '" überein!')
          }
        }
      }
    }
    // ToDo: if-Abfrage ...
    return {'err': errors, 'warn': warnings, 'ignoreChilds': ignoreChilds}
  },
  checkAttributes (attrObjX) {
    let errors = []
    let warnings = []
    let attrObj = ((Object.keys(attrObjX).length > 0) ? attrObjX : null)
    let aParAttrObj = this.options.get('attributes')
    aParAttrObj = ((aParAttrObj && Object.keys(aParAttrObj).length > 0) ? aParAttrObj : null)
    if (attrObj && aParAttrObj) {		// Attribute testen
      // ToDo: renameTo bei der Überprüfung beachten!
      // Überprüfen ob Attribute fehlen
      Object.keys(aParAttrObj).some(function (aKey) {
        // ToDo: Eventuelle If-Abfrage verarbeiten
        if (!(aParAttrObj[aKey].canBeEmpty && aParAttrObj[aKey].canBeEmpty.use)
        && !attrObj.hasOwnProperty(aKey)
        && !(aParAttrObj[aKey].shouldAttribute && aParAttrObj[aKey].shouldAttribute.use)) {
          errors.push({'err': 'Attribut "' + aKey + '" fehlt!'})
        }
      }, this)
      // Vorhandene Attribute überprüfen
      Object.keys(attrObj).forEach(function (aKey) {
        let cAttr = this.checkAttribute(aKey, attrObj[aKey])
        if (cAttr.type === 'error') { errors.push(cAttr.txt) }
        if (cAttr.type === 'warning') { warnings.push(cAttr.txt) }
      }, this)
    } else if (attrObj && !aParAttrObj) {		// Keine Attribute
      errors.push({'err': 'Keine Attribute erwartet!'})
    } else if (!attrObj && aParAttrObj) {		// Überprüfen ob alle Attribute optional sind
      Object.keys(aParAttrObj).some(function (aKey) {
        // ToDo: Eventuelle If-Abfrage verarbeiten
        if (!(aParAttrObj[aKey].canBeEmpty && aParAttrObj[aKey].canBeEmpty.use) && !(aParAttrObj[aKey].shouldAttribute && aParAttrObj[aKey].shouldAttribute.use)) {
          errors.push({'err': 'Attribute erwartet!'})
          return true
        }
      }, this)
    }
    return {'err': errors, 'warn': warnings}
  },
  checkAttribute (attr, val) {
    let aParAttrObj = this.options.get('attributes.' + attr)
    if (!aParAttrObj) {
      return { 'txt': 'Attribut "' + attr + '" nicht erwartet', 'type': 'error' }
    }
    // ToDo: Eventuelle If-Abfrage verarbeiten
    if (aParAttrObj.type === 'fixed' && val !== aParAttrObj.value) {
      if (aParAttrObj.shouldAttribute && aParAttrObj.possibleValues) {
        if (val && aParAttrObj.possibleValues.indexOf(val) < 0) {
          return { 'txt': 'Attribut "' + attr + '" hat nicht den erwateten Wert! (sA, pV)', 'type': 'error' }
        }
      } else {
        return { 'txt': 'Attribut "' + attr + '" hat nicht den erwateten Wert!', 'type': 'error' }
      }
    }
    if (!aParAttrObj.canBeEmpty && (!val || val.length === 0)) {
      return { 'txt': 'Wert von Attribut "' + attr + '" darf nicht leer sein!', 'type': 'warning' }
    }
    if (aParAttrObj.type === 'variable') {
      if (aParAttrObj.possibleValues) {
        if (val && aParAttrObj.possibleValues.indexOf(val) < 0) {
          return { 'txt': 'Wert "' + val + '" von Attribut "' + attr + '" nicht in der Liste möglicher Werte!', 'type': 'warning' }
        }
      }
    }
    return { 'type': 'ok' }
  },
}

export default localFunctions
