import xmlFunctions from '../../XmlFunctions'
import Xml from '../Xml'

const localFunctions = {
  init (xmlString) {
    // "xmlString" überprüfen und auf "this.orgString" setzen
    if (typeof xmlString !== 'string') {		// Prüfen ob der übergebene Wert ein String ist
      this.addError('init() - Übergebener Wert ist kein "string"!')
      return false
    } else if (xmlString.trim().length < 20) {
      this.orgString = null
      this.addError('init() - Übergebener Wert ist viel zu klein!')
      return false
    }
    this.orgString = xmlString.trim()
    // "this.orgString" in DOM Objekt umwandeln, überprüfen und in "this.orgDOM" setzen
    this.orgDOM = new DOMParser().parseFromString(this.orgString, 'application/xml')
    var xmlStringError = xmlFunctions.xmlDomCheck(this.orgDOM)		// Prüfen ob es Fehler gab (unter 20 ms)
    if (xmlStringError.length > 0) {
      this.orgDOM = null
      this.addError({'txt': 'Beim verarbeiten der XML ist es zu einen Fehler gekommen!', 'sErr': xmlStringError})
      return false
    }
    // "this.orgDOM" verarbeiten und in "XmlObject"e umwandeln
    if (this.orgDOM.nodeType !== this.orgDOM.DOCUMENT_NODE) {
      this.addError('"nodeType" ist ' + this.orgDOM.nodeType + ' allerdings wurde ' + this.orgDOM.DOCUMENT_NODE + ' erwartet!')
      return false
    }
    if (this.orgDOM.childNodes.length > 0) {
      this.orgDOM.childNodes.forEach(function (topChild) {
        if (topChild.nodeType !== topChild.PROCESSING_INSTRUCTION_NODE) {
          let nXmlObj = new Xml.XmlObject(this, null, topChild, this.changeCall)
          this.content.push(nXmlObj)
        }
      }, this)
    }
    if (this.content.length === 0) {
      this.addError('Es wurde kein "objXmlContent" gefunden!')
      return false
    }
    this.ready = true
    if (Object.keys(this.errors).length > 0) {
      return false
    }
    this.useable = true
    return true
  },
  getXML (oEditor) {
    let aXML = ''
    this.content.forEach(function (aCont) {
      aXML += aCont.getXML(oEditor)
    }, this)
    return aXML
  },
  addByParser (pos, pObj) {
    console.log('addByParser', this, pos, pObj)
    let aKey = pos
    let nXmlObj = new Xml.XmlObject(this, null, null, this.changeCall)
    if (aKey || aKey === 0) {
      this.content.splice(aKey, 0, nXmlObj)
    } else {
      aKey = this.content.push(nXmlObj) - 1
    }
    this.content[aKey].type = ((pObj.name === '#text') ? 'TEXT' : 'ELEMENT')
    this.content[aKey].name = pObj.name
    let pAttr = pObj.options.getOption('attributes')
    if (pAttr) {
      Object.keys(pAttr).forEach(function (attrKey) {
        let aAttr = pAttr[attrKey]
        if (aAttr.value) {
          this.content[aKey].attributes[attrKey] = aAttr.value
        } else if ((!aAttr.canBeEmpty || !aAttr.canBeEmpty.use) && aAttr.possibleValues && aAttr.possibleValues[0]) {
          this.content[aKey].attributes[attrKey] = aAttr.possibleValues[0]
        }
      }, this)
    }
    if (pObj.options.getOption('value.is.use') && pObj.options.getOption('value.is.value')) {
      this.content[aKey].value = pObj.options.getOption('value.is.value')
    }
    this.content[aKey].useable = true
    this.content[aKey].ready = true
    this.content[aKey].parserIgnore = false
    return this.content[aKey]
  },
  moveTo (srcObj, destObj, dir) {
    let sPos = srcObj.siblings.indexOf(srcObj)
    let dPos = destObj.siblings.indexOf(destObj)
    if (sPos > -1 && dPos > -1) {
      dPos = dPos + ((dir === 'right') ? 1 : 0) + ((srcObj.parents[0] === destObj.parents[0] && sPos < dPos) ? -1 : 0)
      destObj.siblings.splice(dPos, 0, srcObj.siblings.splice(sPos, 1)[0])
      srcObj.updateParents([...destObj.parents])
      if (this.changeCall && typeof this.changeCall === 'function') {
        this.changeCall()
      }
    } else {
      console.log('Fehler! Verschieben kann nicht funktionieren! (XML)')
    }
  },
}

export default localFunctions
