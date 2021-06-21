import Editor from '../Editor'
import stdFunctions from '../../stdFunctions'

const localFunctions = {
  init () {
    if (!this.parserObj) {
      this.addError('Es wurde kein "parserObject" übergeben!')
      return false
    }
    this.contentObj = new Editor.EditorObject(this, null, this.parserObj, this.orgXmlObj, true)
    if (!this.contentObj) {
      this.addError('Kein "contentObj" vorhanden!')
    }
    this.contentObj.updateData(true, true)
    this.ready = true
    if (Object.keys(this.errors).length > 0) {
      return false
    }
    this.useable = true
    this.xmlIds = stdFunctions.deepSeal(this.xmlIds)
    console.log('EditorBase', this)
    return true
  },
  checkXmlIds () {		// Nach doppelten "xml:id" scannen.
    this.xmlIds = {}
    this.family.forEach(function (aObj) {
      if (aObj) {
        aObj.checkXmlId()
      }
    }, this)
  },
  getXML () {
    return (this.parserObj.header || '')
         + '\n<?redaktionstool version="' + require('../../../../../package.json').version + '" ?>'
         + '\n<?parser type="' + (this.parserObj ? this.parserObj.type : 'noParser') + '" version="' + (this.parserObj ? this.parserObj.version : 'noParser') + '" ?>'
         + this.orgXmlObj.getXML(this)
  },
  moveTo (srcUId, destUId, dir = 'left') {
    let srcObj = this.family[srcUId]
    let destObj = this.family[destUId]
    console.log('Editor - moveTo', srcObj, destObj, dir)
    if (srcObj && destObj) {
      let sPar = srcObj.parents[0]
      let dPar = destObj.parents[0]
      let sPos = srcObj.siblings.indexOf(srcObj)
      let dPos = destObj.siblings.indexOf(destObj)
      if (sPos > -1 && dPos > -1) {
        dPos = dPos + ((dir === 'right') ? 1 : 0) + ((sPar === dPar && sPos < dPos) ? -1 : 0)
        destObj.siblings.splice(dPos, 0, srcObj.siblings.splice(sPos, 1)[0])
        srcObj.updateParents([...destObj.parents])
        srcObj.orgXmlObj.root.moveTo(srcObj.orgXmlObj, destObj.orgXmlObj, dir)
        sPar.updateData(true)
        dPar.updateData(true)
        if (this.changeCall && typeof this.changeCall === 'function') {
          this.changeCall()
        }
      } else {
        console.log('Fehler! Verschieben kann nicht funktionieren! (Editor)')
      }
    }
  },
  getEditorObjById (aId) {
    return this.family.find((eObj) => {
      return eObj && eObj.parserObj && eObj.parserObj.options && eObj.parserObj.options.getOption('id') === aId
    })
  },
  getAllEditorObjById (aId) {
    return this.family.filter(eObj => {
      return eObj && eObj.parserObj && eObj.parserObj.options && eObj.parserObj.options.getOption('id') === aId
    })
  }
}

export default localFunctions
