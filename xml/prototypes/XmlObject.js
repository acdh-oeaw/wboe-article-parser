import Xml from '../Xml'
import Vue from 'vue'
import stdFunctions from '../../stdFunctions'

const localFunctions = {
  init () {
    // let t1 = performance.now()
    // Aktuelles DOM Objekt auswerten
    if (!(typeof this.uId === 'number') || this.root.family.indexOf[this.uId] === -1) {		// Die "uId" zuweisen falls noch nicht vorhanden
      this.uId = this.root.family.push(this) - 1
    }
    if (this.orgDOM) {
      if (this.orgDOM.nodeType === this.orgDOM.ELEMENT_NODE) {		// Handelt es sich um ein Element
        this.type = 'ELEMENT'
        this.name = this.orgDOM.nodeName		// Tag Namen setzen
        // Attribute auswerten
        if (this.orgDOM.attributes.length > 0) {
          for (var i = 0; i < this.orgDOM.attributes.length; i++) {
            this.attributes[this.orgDOM.attributes[i].nodeName] = this.orgDOM.attributes[i].nodeValue
          }
        }
        // Kinder auswerten
        if (this.orgDOM.childNodes.length > 0) {
          this.orgDOM.childNodes.forEach(function (child) {
            // Processing Instruction Nodes auswerten
            if (child.nodeType === child.PROCESSING_INSTRUCTION_NODE && child.nodeName === 'comment') {		// Kommentare
              this.comments.push({'val': child.nodeValue})
            }
            if (!(child.nodeType === child.PROCESSING_INSTRUCTION_NODE && child.nodeName === 'comment')
            && !(child.nodeType === child.TEXT_NODE && child.nodeValue.trim().length < 1)) {		// Leere Text Felder ignorieren
              let nXmlObj = new Xml.XmlObject(this.root, [this, ...this.parents], child, this.changeCall)
              this.childs.push(nXmlObj)
            }
          }, this)
        }
        if (this.errors.length === 0) {
          this.useable = true
        }
        this.ready = true
        this.parserIgnore = false
      } else if (this.orgDOM.nodeType === this.orgDOM.TEXT_NODE) {		// Ist es ein Text
        this.type = 'TEXT'
        this.name = '#text'
        // ToDo: Trim verbessern!
        this.value = this.orgDOM.nodeValue.trim()
        this.useable = true
        this.ready = true
        this.parserIgnore = false
      } else if (this.orgDOM.nodeType === this.orgDOM.PROCESSING_INSTRUCTION_NODE) {		// Ist es eine Processing Instruction
        this.type = 'PROCESSING_INSTRUCTION'
        this.name = this.orgDOM.nodeName		// Processing Namen setzen
        this.value = this.orgDOM.nodeValue
      } else if (this.orgDOM.nodeType === this.orgDOM.COMMENT_NODE) {		// Ist es Kommentar
        this.type = 'COMMENT'
        this.name = '#comment'
        this.value = this.orgDOM.nodeValue.trim()
      } else {
        this.type = 'UNKNOWN'
        this.name = this.orgDOM.nodeName
        this.value = this.orgDOM.outerHTML || this.orgDOM.nodeValue
        // this.addError('Unbekannter "nodeType": ' + this.orgDOM.nodeType + '!')
        return false
      }
    }
    this.orgDOM = stdFunctions.deepSeal(this.orgDOM)
    // if (this.orgDOM && (!this.orgDOM.childNodes || this.orgDOM.childNodes.length === 0)) {
    //   let t = performance.now() - t1
    //   if (t > 0.01) {
    //     console.log('XmlObject', this.name, t, 'ms')
    //   }
    // }
    return true
  },
  addByParser (pos, pObj, autoCreate) {
    // console.log('addByParser', this, pos, pObj)
    let aKey = pos
    let nXmlObj = new Xml.XmlObject(this.root, [this, ...this.parents], null, this.changeCall)
    if (aKey || aKey === 0) {
      this.childs.splice(aKey, 0, nXmlObj)
    } else {
      aKey = this.childs.push(nXmlObj) - 1
    }
    this.childs[aKey].type = ((pObj.name === '#text') ? 'TEXT' : 'ELEMENT')
    this.childs[aKey].name = pObj.name
    let pAttr = pObj.options.getOption('attributes')
    if (pAttr) {
      Object.keys(pAttr).forEach(function (attrKey) {
        let aAttr = pAttr[attrKey]
        let aVal = pObj.options.getOptionValue(aAttr.value, this.orgXmlObj)
        if (aVal || (aVal === '' && (aAttr.canBeEmpty && aAttr.canBeEmpty.use))) {
          Vue.set(this.childs[aKey].attributes, attrKey, aVal)
        } else if ((!aAttr.canBeEmpty || !aAttr.canBeEmpty.use) && aAttr.possibleValues && aAttr.possibleValues[0]) {
          Vue.set(this.childs[aKey].attributes, attrKey, (aAttr.possibleValues[0].value || aAttr.possibleValues[0]))
        }
      }, this)
    }
    if (autoCreate && pObj.options.getOption('value.autoCreateValue')) {
      this.childs[aKey].setValue(pObj.options.getOptionValue(pObj.options.getOption('value.autoCreateValue'), this.orgXmlObj))
    } else if (pObj.options.getOption('value.is.use') && pObj.options.getOption('value.is.value')) {
      this.childs[aKey].setValue(pObj.options.getOptionValue(pObj.options.getOption('value.is.value'), this.orgXmlObj))
    }
    this.childs[aKey].useable = true
    this.childs[aKey].ready = true
    this.childs[aKey].parserIgnore = false
    if (this.ready) {
      if (this.changeCall && typeof this.changeCall === 'function') {
        this.changeCall()
      }
    }
    Vue.set(this.childs, aKey, this.childs[aKey])
    return this.childs[aKey]
  },
  addAfterByParser (pObj, autoCreate) {
    if (this.parents.length > 0) {
      let aPos = this.siblings.indexOf(this) + 1
      return this.parents[0].addByParser(aPos, pObj, autoCreate)
    } else {
      console.log('Xml - Kann nicht hinzugefügt werden!', this)
    }
  },
  move (xObj, dir = true) {		// dir = true - Nach xObj verschieben
    console.log('move', this.siblings.indexOf(this) + ' ' + ((dir) ? 'after' : 'before') + ' ' + this.siblings.indexOf(xObj), this, xObj)
    let tPos = this.siblings.indexOf(this)
    let ePos = this.siblings.indexOf(xObj)
    if (tPos > -1 && ePos > -1) {
      this.siblings.splice(ePos, 0, this.siblings.splice(tPos, 1)[0])
      if (this.ready) {
        if (this.changeCall && typeof this.changeCall === 'function') {
          this.changeCall()
        }
      }
    } else {
      console.log('Fehler! Verschieben kann nicht funktionieren!')
    }
  },
  delete (direct = false) {
    if (this.siblings) {
      if (direct || confirm('Soll der Tag "' + this.name + '" wirklich gelöscht werden? (xml)')) {
        console.log('XML - Löschen: ' + this.name)
        this.childs.forEach(function (aChild) {		// Zuerst die Kinder löschen!
          aChild.delete(true)
        }, this)
        this.root.family[this.uId] = null
        this.siblings.some(function (aSib, aSibKey) {		// Aktuellen Key ermitteln und löschen!
          if (aSib === this) {
            Vue.delete(this.siblings, aSibKey)
            console.log('XmlObject gelöscht ...')
            if (this.ready) {
              if (this.changeCall && typeof this.changeCall === 'function') {
                this.changeCall()
              }
            }
            return true
          }
        }, this)
      }
    } else {
      console.log('XML - Kann nicht gelöscht werden!', this)
    }
  },
  getValueByOption (parOptVal, asArray = true, flat = true) {
    if (parOptVal && parOptVal.innerXML && parOptVal.innerXML.use === true) {
      return this.getXML(null, false, false, false, true)		// 1. PROCESSING_INSTRUCTION, COMMENT, UNKNOWN | 2. Formatiert
    } else {
      return this.getValue(asArray, flat)
    }
  },
  getValue (asArray = true, flat = true) {
    let aValue = []
    if (this.type === 'TEXT') {
      aValue.push(this.value)
    } else if (typeof this.value === 'string') {
      aValue.push(this.value)
    } else if (this.childs.length > 0) {
      this.childs.forEach(function (aChild) {
        let aCSgetVal = aChild.getValue(true, flat)
        if (aCSgetVal.length > 0) {
          if (flat) {
            aValue = [...aValue, ...aCSgetVal]
          } else {
            aValue.push(aCSgetVal)
          }
        }
      }, this)
    }
    // console.log('>>>> aValue', aValue)
    if (asArray) {
      return aValue
    } else {
      return aValue.toString()
    }
  },
  getRawValue () {
    return this.value
  },
  setValue (val) {
    // ToDo: innerXML ?!?!
    if (this.type === 'TEXT') {
      if (this.value !== val) {
        this.value = val
        // console.log('setValue [value]', this, val)
        if (this.changeCall && typeof this.changeCall === 'function') {
          this.changeCall()
        }
      }
    } else {
      let aTxtChilds = this.getChildsOfType(['TEXT'], false, false)
      if (aTxtChilds.length === 1) {
        if (aTxtChilds[0].value !== val) {
          // console.log('setValue text [child]', this, val, aTxtChilds[0].value)
          aTxtChilds[0].value = val
          if (this.changeCall && typeof this.changeCall === 'function') {
            this.changeCall()
          }
        }
      } else if (aTxtChilds.length > 1) {
        // ToDo: Mehrer Text Kinder ?!?
        console.log(aTxtChilds.length + ' TEXT Kind ...')
      } else {
        let nXmlObj = new Xml.XmlObject(this.root, [this, ...this.parents], null, this.changeCall)
        let nTxt = this.childs.push(nXmlObj) - 1
        this.childs[nTxt].type = 'TEXT'
        this.childs[nTxt].name = '#text'
        this.childs[nTxt].value = val
        this.childs[nTxt].useable = true
        this.childs[nTxt].ready = true
        this.childs[nTxt].parserIgnore = false
        Vue.set(this.childs, nTxt, this.childs[nTxt])
        // console.log('setValue [new text child]', this, val)
        if (this.changeCall && typeof this.changeCall === 'function') {
          this.changeCall()
        }
      }
    }
    return this.getValue(false)
  },
  setAttribute (attr, val, prefix = null) {
    // console.log('setAttribute', this, val)
    let aVal = ((val) ? (val.value || val) : '')
    if (prefix && aVal.substr(0, prefix.length) !== prefix) {
      aVal = prefix + aVal
    }
    if (!this.attributes[attr] || this.attributes[attr] !== aVal) {
      Vue.set(this.attributes, attr, aVal)
      if (this.changeCall && typeof this.changeCall === 'function') {
        this.changeCall()
      }
    }
    return { 'attribute': attr, 'value': aVal }
  },
  getXML (oEditor = null, all = true, lb = true, short = false, inner = false, deep = 0, prvXmlObj) {
    let oShort = short
    // Aktuelles EditorObject ermitteln
    let oEditorObj = null
    if (oEditor) {
      oEditor.family.some(function (aEditorObj) {
        if (aEditorObj && aEditorObj.orgXmlObj === this) {
          oEditorObj = aEditorObj
          return true
        }
      }, this)
    }
    if (oEditorObj && oEditorObj.parserObj && oEditorObj.parserObj.options) {
      if (oEditorObj.parserObj.options.getOption('xml.short.use')) {
        short = true
      }
    }
    let aXML = ''
    if (this.type === 'TEXT') {
      if (prvXmlObj && (['COMMENT', 'PROCESSING_INSTRUCTION', 'UNKNOWN'].indexOf(prvXmlObj.type) > -1)) {
        aXML += '\n' + '  '.repeat(deep) + (this.value || '') + '\n' + '  '.repeat(deep - 1)
      } else {
        aXML += this.value || ''
      }
    } else if (this.type === 'COMMENT' && all) {
      aXML += '\n' + '  '.repeat(deep) + '<!-- ' + (this.value || '') + ' -->'
    } else if (this.type === 'PROCESSING_INSTRUCTION' && all) {
      aXML += '\n' + '  '.repeat(deep) + '<?' + (this.name || '') + ' ' + (this.value || '') + '?>'
    } else if (this.type === 'UNKNOWN' && all) {
      aXML += (this.value || '')
    } else if (this.type === 'ELEMENT') {
      let aChildCont = ''
      let lChild = null
      if (!inner) {
        aXML += '\n' + '  '.repeat(deep) + '<' + this.name
        if (Object.keys(this.attributes).length > 0) {
          Object.keys(this.attributes).forEach(function (aKey) {
            if (this.attributes[aKey]) {
              aXML += ' ' + aKey + '="' + this.attributes[aKey] + '"'
            } else {
              let removeAttribute = false
              if (oEditorObj && oEditorObj.parserObj && oEditorObj.parserObj.options) {
                let pOptAttr = oEditorObj.parserObj.options.getOption('attributes')
                if (pOptAttr && pOptAttr[aKey] && pOptAttr[aKey].removeIfEmpty && pOptAttr[aKey].removeIfEmpty.use) {
                  removeAttribute = true
                }
              }
              if (!removeAttribute) {
                aXML += ' ' + aKey + '=""'
              }
            }
          }, this)
        }
        if (!short) { aXML += '>' }
        if (this.comments.length > 0) {
          this.comments.forEach(function (aComment) {
            aChildCont += '\n' + '  '.repeat(deep + 1) + '<?comment ' + aComment.val.trim() + ' ?>'
            lChild = { 'type': 'PROCESSING_INSTRUCTION' }
          }, this)
        }
      }
      if (this.childs.length > 0) {
        this.childs.forEach(function (aChild) {
          aChildCont += aChild.getXML(oEditor, all, lb, oShort, false, deep + 1, lChild)
          lChild = aChild
        }, this)
      }
      if (!inner && short && aChildCont.length === 0 && !this.value) {
        aXML += '/>'
      } else {
        if (!inner && short && (aChildCont.length > 0 || this.value)) { aXML += '>' }
        if (aChildCont.length > 0) {
          if (this.getChildsOfType(['ELEMENT', 'COMMENT'], false, false).length > 0) {
            aXML += aChildCont + '\n' + '  '.repeat(deep)
          } else {
            aXML += aChildCont
          }
        } else if (this.value) {
          aXML += this.value
        }
        if (!inner) {
          aXML += '</' + this.name + '>'
        }
      }
    }
    return aXML
  },
  getChildsOfType (types, ready = true, useable = true) {
    let aChilds = []
    if (this.childs.length > 0) {
      this.childs.forEach(function (aChild) {
        if ((aChild.ready || !ready) && (aChild.useable || !useable)
        && types.indexOf(aChild.type) > -1) {
          aChilds.push(aChild)
        }
      }, this)
    }
    return aChilds
  },
  getChildsByName (name, ready = true, useable = true, oldTag = null) {
    let aChilds = []
    if (this.childs.length > 0) {
      this.childs.forEach(function (aChild) {
        if ((aChild.ready || !ready) && (aChild.useable || !useable)
        && (aChild.name === name || (Array.isArray(oldTag) && oldTag.indexOf(aChild.name) > -1))) {
          aChilds.push(aChild)
        }
      }, this)
    }
    return aChilds
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
