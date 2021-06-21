import Vue from 'vue'
import stdFunctions from '../../stdFunctions'
import Editor from '../Editor'
import FxGeoSelect from './FxGeoSelect'
import FxRefBiblSelect from './FxRefBiblSelect'

const localFunctions = {
  init () {
    if (!(typeof this.uId === 'number') || this.root.family.indexOf[this.uId] === -1) {		// Die "uId" zuweisen falls noch nicht vorhanden
      this.uId = this.root.family.push(this) - 1
    }
    if (this.parserObj && this.orgXmlObj && this.orgXmlObj.name !== this.parserObj.name) {
      this.orgXmlObj.name = this.parserObj.name
    }
    // Notwendige Überarbeitungen durchführen
    if (this.parserObj && this.orgXmlObj && this.parserObj.options) {
      // Auswahlen aktuallisieren
      if (this.parserObj.options.getOption('value.is.possibleValues')) {
        // Aktuelle Auswahl ermitteln
        let sVal = this.orgXmlObj.getValue(false)
        let oKey = -1
        this.parserObj.options.getOption('value.is.possibleValues').some(function (aVal, aKey) {
          if ((aVal.value || aVal) === sVal) {
            oKey = aKey
            return true
          }
        }, this)
        // Aktuell Auswahl neu setzen
        if (oKey >= 0) {
          let aVal = this.parserObj.options.getOption('value.is.possibleValues')[oKey]
          this.orgXmlObj.setValue(aVal.value || aVal)
          if (aVal.attribute && Object.keys(aVal.attribute).length > 0) {
            Object.keys(aVal.attribute).forEach(function (aKey) {
              this.orgXmlObj.setAttribute(aKey, aVal.attribute[aKey])
            }, this)
          }
        }
      }
      // Attribute überarbeiten
      if (this.parserObj.options.getOption('attributes')) {
        let aAttr = this.parserObj.options.getOption('attributes') || {}
        // "remove" überprüfen/entfernen
        Object.keys(aAttr).forEach(function (aKey) {
          if (aAttr[aKey].remove && this.orgXmlObj.attributes[aKey]) {
            delete this.orgXmlObj.attributes[aKey]
          }
        }, this)
        // "renameTo" überprüfen/umbenennen
        Object.keys(aAttr).forEach(function (aKey) {
          if (aAttr[aKey].renameTo && this.orgXmlObj.attributes[aKey]) {
            if (!this.orgXmlObj.attributes[aAttr[aKey].renameTo]) {
              this.orgXmlObj.setAttribute(aAttr[aKey].renameTo, this.orgXmlObj.attributes[aKey])
            }
            delete this.orgXmlObj.attributes[aKey]
          }
        }, this)
        // "shouldAttribute" überprüfen/hinzufügen
        Object.keys(aAttr).forEach(function (aKey) {
          if (aAttr[aKey].shouldAttribute && aAttr[aKey].shouldAttribute.use) {
            if (!this.orgXmlObj.attributes[aKey]
            || !(aAttr[aKey] && aAttr[aKey].possibleValues && this.orgXmlObj.attributes[aKey] && aAttr[aKey].possibleValues.indexOf(this.orgXmlObj.attributes[aKey]) > -1)) {
              let nVal = this.parserObj.options.getOptionValue(aAttr[aKey].value, this.orgXmlObj)
              if (nVal || (!aAttr[aKey].canBeEmpty || !aAttr[aKey].canBeEmpty.use)) {
                if (this.orgXmlObj.attributes[aKey] !== nVal) { console.log('"shouldAttribute" überprüfen/hinzufügen', aKey, this.orgXmlObj.attributes[aKey], '->', nVal) }
                this.orgXmlObj.attributes[aKey] = nVal
              }
            }
          }
        }, this)
      }
    }
    let aParserChilds = stdFunctions.getValOfSubProp(this.parserObj, 'childs') || []
    let aXmlChilds = stdFunctions.getValOfSubProp(this.orgXmlObj, 'childs') || []
    if (this.isRoot) {
      aParserChilds = stdFunctions.getValOfSubProp(this.parserObj, 'content') || []
      aXmlChilds = stdFunctions.getValOfSubProp(this.orgXmlObj, 'content') || []
    }
    // Parser mit XML Objekt vergleichen
    if (!this.ignoreChilds) {
      aXmlChilds.forEach(function (aXmlObj) {
        let aParList = []
        let useParser = false
        let aErrors = []
        let aWarnings = []
        if (aXmlObj.ready && aXmlObj.useable) {
          if (aParserChilds.length > 0) {
            useParser = true
            aParserChilds.forEach(function (aParObjChild) {
              if (aParObjChild.ready && aParObjChild.useable) {
                aParList.push({'pObj': aParObjChild, 'match': aParObjChild.match(aXmlObj, this)})
              }
            }, this)
            aParList = aParList.slice().sort(pMatchSort)		// Sortieren: "possible" nach oben, Fehler nach unten, höherer Score nach oben)
            if (aParList.length === 0) {
              aErrors.push('Kein Parser für Tag "' + aXmlObj.name + '" übergeben!')
              useParser = false
            } else if (!aParList[0].match.possible) {
              aErrors.push('Parser konnte Tag "' + aXmlObj.name + '" nicht zugeordnet werden!')
              useParser = false
            } else if (aParList.length > 1 && aParList[0].match.score === aParList[1].match.score) {
              aErrors.push('Parser konnte Tag "' + aXmlObj.name + '" nicht eindeutig zugeordnet werden!')
              useParser = false
            }
            if (useParser && aParList[0].match.errors.length > 0) {
              aErrors.push({'txt': 'Tag "' + aXmlObj.name + '" enthält Fehler!', 'err': aParList[0].match.errors})
              useParser = false
            }
            if (useParser && aParList[0].match.warnings.length > 0) {
              aWarnings.push({'txt': 'Tag "' + aXmlObj.name + '" enthält Warnungen!', 'err': aParList[0].match.warnings})
            }
          } else {
            aErrors.push('Es wurde kein Parser übergeben!')
          }
        }
        if (useParser) {
          this.add(null, aParList[0].pObj, aXmlObj, aErrors, aWarnings, aParList[0].match.ignoreChilds, aParList)
        } else {
          this.add(null, null, aXmlObj, aErrors, aWarnings, null, aParList)
        }
      }, this)
    }
    if (!this.orgXmlObj && this.parserObj && !this.isRoot) {		// Wenn kein XML Objekt übergeben wurde soll eins erstellt werden
      let aPrevSibs = this.getSiblings('prev', true)
      // console.log(this, aPrevSibs)
      if (aPrevSibs.length > 0) {
        // console.log('XmlObj erstellen! (After)')
        Vue.set(this, 'orgXmlObj', aPrevSibs[0].orgXmlObj.addAfterByParser(this.parserObj, this.autoCreated))
      } else {
        // console.log('XmlObj erstellen! (At Top)')
        Vue.set(this, 'orgXmlObj', this.parents[0].orgXmlObj.addByParser(0, this.parserObj, this.autoCreated))
      }
      // console.log('XmlObj erstellt ...', ((this.orgXmlObj) ? 'Erfolgreich' : 'Fehler!'))
    }
    this.ready = true
    if (Object.keys(this.errors).length > 0) {
      return false
    }
    // Fehlende Kinder aus Parser ergänzen
    if (aParserChilds.length > 0) {
      let neededParsers = []
      aParserChilds.forEach(function (aPar) {		// Notwendige Tags ermitteln
        if (!aPar.options.getOption('tag.possibleTag.use') || aPar.options.getOption('tag.shouldTag.use')) {
          neededParsers.push(aPar)
        }
      }, this)
      if (neededParsers.length > 0) {		// Ermitteln ob die Tags bereits vorhanden sind
        this.childs.some(function (aVal, aKey) {
          let aNPPos = neededParsers.indexOf(aVal.parserObj)
          if (aNPPos > -1) {
            if (aNPPos === 0) {
              neededParsers.splice(0, 1)
            } else {
              neededParsers.splice(0, aNPPos).forEach(function (bVal, bKey) {
                console.log('!!!!! TODO !!!!! "' + bVal.name + '" automatisch hinzugefügt. (m)')
                // ToDo !!!
              }, this)
              neededParsers.splice(0, 1)
            }
          }
          if (neededParsers.length === 0) {
            return true
          }
        }, this)
      }
      if (neededParsers.length > 0) {		// Sind noch Tags übrig?
        neededParsers.forEach(function (aVal, aKey) {
          let aPos = null
          if (!aVal.options.getOption('tag.anywhere.use')) {
            let shouldBefore = aVal.getSiblings('prev', true)
            if (shouldBefore.length === 0) {
              aPos = 0
            } else {
              // Todo ...
            }
          }
          this.add(aPos, aVal, null, [], [], false, null, true)
          console.log('"' + aVal.name + '" automatisch hinzugefügt. (' + ((aPos === null) ? 'Ende' : aPos) + ')')
        }, this)
      }
    }
    if (this.orgXmlObj && !this.orgXmlObj.useable) {
      return false
    }
    // Daten an parserObj anpassen
    if (this.parserObj && !this.isRoot) {
      this.isMultiple = (this.parserObj.options.getOption('tag.multiple.use'))		// Ist aktuelles Objekt "multiple"?
      if (this.orgXmlObj) {
        if (this.parserObj.options.getOption('value.is.shouldValue')) {
          if (this.orgXmlObj.getValueByOption(this.parserObj.options.getOption('value'), false) !== this.parserObj.options.getOption('value.is.shouldValue')) {
            this.orgXmlObj.setValue(this.parserObj.options.getOption('value.is.shouldValue'))
          }
        }
      }
    }
    this.useable = true
    return true
  },
  add (pos, aPar, orgXml, aErrors = [], aWarnings = [], ignoreChilds = false, aParList, autoCreate, updateData = true) {
    let aKey = pos
    if (aKey || aKey === 0) {
      this.childs.splice(aKey, 0, new Editor.EditorObject(this.root, [this, ...this.parents], aPar, orgXml, false, ignoreChilds, true, autoCreate))
    } else {
      aKey = this.childs.push(new Editor.EditorObject(this.root, [this, ...this.parents], aPar, orgXml, false, ignoreChilds, true, autoCreate)) - 1
    }
    this.childs[aKey].init()
    if (aParList) {
      this.childs[aKey].parserMatches = aParList
    }
    aErrors.forEach(function (aErr) {
      this.childs[aKey].addError(aErr)
    }, this)
    aWarnings.forEach(function (aWarn) {
      this.childs[aKey].addWarning(aWarn)
    }, this)
    if (this.root.ready && updateData) {
      if (this.parents.length > 0) {
        this.parents[0].updateData(true)
      } else {
        this.updateData(true)
      }
    }
    Vue.set(this.childs, aKey, this.childs[aKey])
    return this.childs[aKey]
  },
  addAfter (aPar, orgXml, aErrors = [], aWarnings = [], ignoreChilds = false, aParList) {
    if (this.parents.length > 0) {
      let aPos = this.siblings.indexOf(this) + 1
      return this.parents[0].add(aPos, aPar, orgXml, aErrors, aWarnings, ignoreChilds, aParList)
    } else {
      console.log('Editor - Kann nicht hinzugefügt werden!', this)
    }
  },
  move (eObj, dir = true) {		// dir = true - Nach eObj verschieben
    // console.log('move', this.siblings.indexOf(this) + ' ' + ((dir) ? 'after' : 'before') + ' ' + this.siblings.indexOf(eObj), this, eObj)
    let tPos = this.siblings.indexOf(this)
    let ePos = this.siblings.indexOf(eObj)
    if (tPos > -1 && ePos > -1) {
      this.siblings.splice(ePos, 0, this.siblings.splice(tPos, 1)[0])
      this.orgXmlObj.move(eObj.orgXmlObj, dir)
    } else {
      console.log('Fehler! Verschieben kann nicht funktionieren!')
    }
    this.siblings.forEach(function (aChild, cKey) {
      aChild.updateData()
    })
    if (this.parents.length > 0) {
      this.parents[0].updateData()
    }
  },
  delete (direct = false) {
    if (this.siblings) {
      if (direct || confirm('Soll der Tag "' + (this.parserObj && this.parserObj.name) + '" wirklich gelöscht werden?')) {
        console.log('Editor - Löschen: ', this.parserObj)
        this.deleteErrors()
        this.deleteWarnings()
        this.childs.forEach(function (aChild) {
          aChild.delete(true)
        }, this)
        this.root.family[this.uId] = null
        this.siblings.some(function (aSib, aSibKey) {
          if (aSib === this) {
            Vue.delete(this.siblings, aSibKey)
            console.log('EditorObject gelöscht ...')
            return true
          }
        }, this)
        this.orgXmlObj.delete(true)
        this.siblings.forEach(function (aChild, cKey) {
          aChild.updateData()
        })
        if (this.parents.length > 0) {
          this.parents[0].updateData()
        }
        this.root.checkXmlIds()
      }
    } else {
      console.log('Editor - Kann nicht gelöscht werden!', this)
    }
  },
  updateData (withChilds = false, posAsError = false, first = true) {
    this.count = 0
    this.countParser = 0
    this.multipleNr = 0
    this.multipleMax = 0
    this.multipleLast = false
    this.isParserCopy = ((this.parserObj) ? this.parserObj.isCopy : false)
    this.parserCopyDeep = 0
    this.refresh = true
    // ParserCopy - Tiefe
    if (this.parserObj && this.parents.length > 0) {
      let aId = this.parserObj.options.getOption('id')
      if (aId) {
        this.parents.forEach(function (aEObj) {
          if (aEObj.parserObj && aEObj.parserObj.options && aEObj.parserObj.options.getOption('id') === aId) {
            this.parserCopyDeep += 1
          }
        }, this)
      }
    }
    // Zählen
    let aPrevSibs = this.getSiblings('prev', true, false, true)
    if (aPrevSibs.length > 0) {
      aPrevSibs.forEach(function (aPSib) {
        this.count += 1
        if (aPSib.parserObj === this.parserObj) {
          this.countParser += 1
        }
      }, this)
      if (this.isMultiple && aPrevSibs[0].parserObj === this.parserObj) {
        this.multipleNr = aPrevSibs[0].multipleNr + 1
      }
    }
    // Multiple Zählen
    if (this.isMultiple) {
      let aNextSibs = this.getSiblings('next', true, false, true)
      if (aPrevSibs[0] && aPrevSibs[0].parserObj === this.parserObj) {
        this.multipleMax = aPrevSibs[0].multipleMax
      } else {
        aNextSibs.some(aNSib => {
          if (aNSib.parserObj !== this.parserObj) {
            return true
          }
          this.multipleMax += 1
          return false
        })
      }
      this.multipleLast = !(aNextSibs.length > 0 && aNextSibs[0].parserObj === this.parserObj)
    }
    // Spezielle Funktion
    if (this.parserObj && this.parserObj.options) {
      if (this.parserObj.options.getOption('editor.fxFunction.name') === 'GeoSelect') {
        FxGeoSelect.updateData(this, first)
      } else if (this.parserObj.options.getOption('editor.fxFunction.name') === 'RefBiblSelect') {
        FxRefBiblSelect.updateData(this, first)
      }
    }
    // Updates ...
    if (this.parserObj && !this.isRoot) {
      this.checkParser(posAsError)
    }
    this.updateAddable()
    if (withChilds && this.childs.length > 0) {
      this.childs.forEach(function (aChild) {
        aChild.updateData(withChilds, posAsError, first = false)
      }, this)
    }
    if (first) {
      this.root.updateFamilyErrors()
    }
  },
  updateAddable (withChilds = false) {
    // Nach diesem Tag hinzufügbare Tags
    this.addableAfter = []
    if (this.parserObj && !this.isRoot) {
      if (this.isMultiple && this.parserObj.name !== '#text' && !this.parserObj.options.getOption('editor.noAddButton')) {
        this.addableAfter.push({
          'uId': this.parserObj.uId,
          'type': 'self',
          'title': this.parserObj.options.getOption('editor.addTitle') || this.parserObj.options.getOption('title.value') || this.parserObj.name,
          'cShow': true,
          'bShow': !(this.isMultiple && !this.multipleLast && this.parserObj.options.getOption('editor.onlyLastElementHasAddButton')),
          'sort': this.parserObj.options.getOption('editor.addButtonSort') || 99999
        })
      }
      if (!(this.isMultiple && !this.multipleLast)) {
        let aParSibs = this.parserObj.getSiblings('all', true)
        let aNextSibs = this.getSiblings('next', true)
        let aAllSibs = this.getSiblings('all', true)
        aParSibs.forEach(function (aParSib) {
          if (aParSib.options.getOption('tag.anywhere.use') && !aParSib.options.getOption('editor.noAddButton')) {
            if (!((this.parserObj.name === '#text' || (aNextSibs[0] && aNextSibs[0].parserObj && aNextSibs[0].parserObj.name === '#text')) && aParSib.name === '#text')) {
              let cUsed = 0
              aAllSibs.forEach(function (aAllSib) {
                if (aAllSib.parserObj && aAllSib.parserObj.uId === aParSib.uId) {
                  cUsed += 1
                }
              }, this)
              if (aParSib.options.getOption('tag.multiple.use') || cUsed === 0) {
                this.addableAfter.push({
                  'uId': aParSib.uId,
                  'type': 'anywhere',
                  'title': aParSib.options.getOption('editor.addTitle') || aParSib.options.getOption('title.value') || aParSib.name,
                  'cShow': true,
                  'bShow': true,
                  'cUsed': cUsed,
                  'sort': aParSib.options.getOption('editor.addButtonSort') || 99999
                })
              }
            }
          }
        }, this)
        let startPos = this
        if (this.parserObj.options.getOption('tag.anywhere.use')) {		// Wenn dieses "EditorObj" ein "anywhere" ist das nächste vorherige "EditorObj" das nicht "anywhere" ist als Startpunkt zu benutzen.
          this.getSiblings('prev', true).some(function (aPrevSib) {
            if (!aPrevSib.parserObj || !aPrevSib.parserObj.options.getOption('tag.anywhere.use')) {
              startPos = aPrevSib
              return true
            }
          }, this)
        }
        let aParNextSibs = ((startPos.parserObj) ? startPos.parserObj.getSiblings('next', true) : [])
        let mHit = false
        let aNextSibsSP = startPos.getSiblings('next', true)
        aParNextSibs.forEach(function (aParSib) {
          if (!aParSib.options.getOption('tag.anywhere.use') && !aParSib.options.getOption('editor.noAddButton')) {
            let addThis = true
            if (mHit) {
              addThis = false
            } else {
              if (aParSibs.length > 0) {
                if (aParSibs[0].parserObj && aParSibs[0].parserObj.name === '#text' && aParSib.name === '#text') {
                  addThis = false
                }
              }
              aNextSibsSP.forEach(function (aNextSib) {
                if (aNextSib.parserObj === aParSib) {
                  addThis = false
                  mHit = true
                }
              }, this)
            }
            if (addThis) {
              this.addableAfter.push({
                'uId': aParSib.uId,
                'type': 'ect',
                'title': aParSib.options.getOption('editor.addTitle') || aParSib.options.getOption('title.value') || aParSib.name,
                'cShow': true,
                'bShow': true,
                'sort': aParSib.options.getOption('editor.addButtonSort') || 99999
              })
            }
          }
        }, this)
      }
      this.addableAfter = this.addableAfter.slice().sort(AddableSort)
    }
    // In diesem Tag am Start hinzufügbare Tags
    this.addableInner = []
    if (this.parserObj && !this.isRoot && this.parserObj.childs) {
      let eChilds = this.getChilds('all', true)
      let mHit = false
      this.parserObj.childs.forEach(function (acParser) {
        let addThis = true
        if (acParser.options.getOption('editor.noAddButton')
          || (this.parserObj && this.parserObj.options && this.parserObj.options.getOption('editor.fxFunction'))) {
          addThis = false
        }
        if (!acParser.options.getOption('tag.anywhere.use')) {
          if (mHit) {
            addThis = false
          } else {
            eChilds.forEach(function (eChild) {
              if (eChild.parserObj === acParser) {
                addThis = false
                mHit = true
              }
            }, this)
          }
        } else {
          if ((acParser.name === '#text' && eChilds.length > 0 && (eChilds[0] && eChilds[0].parserObj && eChilds[0].parserObj.name === '#text'))
            || (!acParser.options.getOption('tag.multiple.use') && eChilds.length > 0 && eChilds[0].parserObj === acParser)) {
            addThis = false
          }
        }
        if (addThis) {
          let cUsed = 0
          eChilds.forEach(function (eChild) {
            if (eChild.parserObj && eChild.parserObj.uId === acParser.uId) {
              cUsed += 1
            }
          }, this)
          if (acParser.options.getOption('tag.multiple.use') || cUsed === 0) {
            this.addableInner.push({
              'uId': acParser.uId,
              'type': (acParser.options.getOption('tag.anywhere.use') ? 'anywhere' : 'ect'),
              'title': acParser.options.getOption('editor.addTitle') || acParser.options.getOption('title.value') || acParser.name,
              'cShow': true,
              'bShow': true,
              'cUsed': cUsed,
              'sort': acParser.options.getOption('editor.addButtonSort') || 99999
            })
          }
        }
      }, this)
      this.addableInner = this.addableInner.slice().sort(AddableSort)
    }
    // Kinder verarbeiten
    if (withChilds && this.childs.length > 0) {
      this.childs.forEach(function (aChild) {
        aChild.updateAddableAfter(withChilds)
      }, this)
    }
  },
  checkParser (posAsError = false) {
    if (this.orgXmlObj && this.parserObj) {
      this.deleteErrors()
      this.deleteWarnings()
      let aAttrCheck = this.parserObj.checkAttributes(this.orgXmlObj.attributes)
      let aValCheck = this.parserObj.checkValue(this.orgXmlObj)
      let aPosCheck = this.parserObj.checkPosition(this, true, true)
      // Spezielle Funktion
      let aFxCheck = []
      if (this.parserObj && this.parserObj.options) {
        if (this.parserObj.options.getOption('editor.fxFunction.name') === 'GeoSelect') {
          aFxCheck = FxGeoSelect.checkParser(this)
        }
      }
      aAttrCheck.err.concat(aValCheck.err, ((posAsError) ? aPosCheck : [])).forEach(function (aErr) {
        this.addError(aErr)
      }, this)
      aAttrCheck.warn.concat(aValCheck.warn, aFxCheck, ((!posAsError) ? aPosCheck : [])).forEach(function (aWarn) {
        this.addWarning(aWarn)
      }, this)
      this.checkXmlId()
    }
    this.refresh = true
  },
  checkXmlId () {
    if (this.orgXmlObj && this.orgXmlObj.attributes) {
      if (this.orgXmlObj.attributes['xml:id']) {
        if (this.root.xmlIds[this.orgXmlObj.attributes['xml:id']]) {
          if (this.root.xmlIds[this.orgXmlObj.attributes['xml:id']] !== this.uId) {
            this.addWarning('xml:id = "' + this.orgXmlObj.attributes['xml:id'] + '" bereits vorhanden!')
          }
        } else {
          this.root.xmlIds[this.orgXmlObj.attributes['xml:id']] = this.uId
        }
      }
    }
  },
  getSiblings (mode = 'all', useable = false, inclSelf = false, withParser = false) {
    let rObj = []
    let hit = false
    if (this.siblings.length > 0) {
      this.siblings.some(function (aObj) {
        if (aObj === this) {
          hit = true
        }
        if ((!useable || aObj.useable)		// Nur "useable", falls vorhanden
        && ((!hit && (mode === 'all' || mode === 'prev'))	// Nur vorherige
          || (hit && (mode === 'all' || mode === 'next')))		// Nur nachfolgende
        && (!withParser || aObj.parserObj)		// Nur mit "parser"
        && (inclSelf || aObj !== this)) {		// Auch dieses Objekt
          rObj.push(aObj)
        }
      }, this)
    }
    if (mode === 'prev') { rObj.reverse() }
    return rObj
  },
  getChilds (mode = 'all', useable = false, aChild = null, inclAChild = false) {
    let rObj = []
    let hit = false
    if (this.childs.length > 0) {
      this.childs.some(function (aObj) {
        if (aObj === aChild) {
          hit = true
        }
        if ((!useable || aObj.useable)		// Nur "useable", falls vorhanden
        && ((!hit && (mode === 'all' || mode === 'prev'))	// Nur vorherige
          || (hit && (mode === 'all' || mode === 'next')))		// Nur nachfolgende
        && (inclAChild || aObj !== aChild)) {		// Auch dieses Objekt
          rObj.push(aObj)
        }
      }, this)
    }
    if (mode === 'prev') { rObj.reverse() }
    return rObj
  },
  updateParents (aParents) {
    this.parents = aParents
    this.siblings = ((this.parents.length > 0) ? this.parents[0].childs : [this])
    this.childs.forEach(function (aChild) {
      aChild.updateParents([this, ...this.parents])
    }, this)
  },
}

export default localFunctions

function pMatchSort (a, b) {		// Sortieren: "possible" nach oben, Fehler nach unten, höherer Score nach oben
  if (!a.match.possible && b.match.possible) { return 1 }
  if (a.match.possible && !b.match.possible) { return -1 }
  if ((a.match.errors.length > 0) > (b.match.errors.length > 0)) { return 1 }
  if ((a.match.errors.length > 0) < (b.match.errors.length > 0)) { return -1 }
  if (a.match.score < b.match.score) { return 1 }
  if (a.match.score > b.match.score) { return -1 }
  if (a.match.warnings.length > b.match.warnings.length) { return 1 }
  if (a.match.warnings.length < b.match.warnings.length) { return -1 }
  return 0
}

function AddableSort (a, b) {		// Sortieren:
  if (a.sort < b.sort) { return -1 }
  if (a.sort > b.sort) { return 1 }
  if (a.type !== 'self' && b.type === 'self') { return 1 }
  if (a.type === 'self' && b.type !== 'self') { return -1 }
  if (a.type !== 'ect' && b.type === 'ect') { return 1 }
  if (a.type === 'ect' && b.type !== 'ect') { return -1 }
  if (a.type !== 'anywhere' && b.type === 'anywhere') { return 1 }
  if (a.type === 'anywhere' && b.type !== 'anywhere') { return -1 }
  return 0
}
