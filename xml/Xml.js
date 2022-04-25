import prototypeMultiple from '../aPrototypes/Multiple'
import prototypeXmlBase from './prototypes/XmlBase'
import prototypeXmlObject from './prototypes/XmlObject'

const localFunctions = {
  XmlBase: function (xmlString, cCall = null) {
    this.ready = false						// Ist das Objekt bereit?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = {}							// Fehler. Property = "XmlObject.uId" oder "-1" für "XmlBase"
    this.warnings = {}						// Warnungen. Property = "XmlObject.uId" oder "-1" für "XmlBase"
    this.content = []							// Enthaltene "XmlObject" Kinder
    this.family = []							// Alle "XmlObject"e "Key" = "uId"
    this.orgString = null					// Original String für DOM
    this.orgDOM = null						// Original DOM über init generiert
    this.changeCall = cCall				// Funktion die aufgerufen wird wenn es eine Änderung gibt
    if (xmlString) {							// Wenn der "xmlString" übergeben wurde direkt initialisieren
      this.init(xmlString)
      this.updateFamilyErrors()
    }
  },
  XmlObject: function (root, parents, dom, cCall = null) {
    this.ready = false						// Ist das Objekt bereit?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.parserIgnore = true			// Objekt beim parsen ignorieren! (comments, usw.)
    this.errors = []							// Liste der Fehler
    this.warnings = []						// Liste der Warnungen
    this.childsWithErrors = false		// Gibt es Kinder mit Fehlern
    this.descendantsWithErrors = false		// Gibt es Nachfahren mit Fehlern
    this.uId = null								// Individuelle Nummer des XmlObjects
    this.name = null							// Tagname
    this.type = null							// Node Type
    this.comments = []						// Kommentare (<?comment Text?>)
    this.value = null							// Inhalt des Tags falls Value
    this.attributes = {}					// Attribute des Tags
    this.childs = []							// Enthaltene "XmlObject" Kinder
    this.parents = parents || []	// Liste der Eltern
    this.root = root							// Enthält die "XmlBase"
    this.orgDOM = dom							// Original DOM
    this.siblings = ((this.parents.length > 0) ? this.parents[0].childs : this.root.content)		// Geschwister
    this.changeCall = cCall				// Funktion die aufgerufen wird wenn es eine Änderung gibt
    this.init()										// Immer dirket initialisieren
  },
}

// XmlBase Prototypen
localFunctions.XmlBase.prototype.addError = prototypeMultiple.addError
localFunctions.XmlBase.prototype.updateFamilyErrors = prototypeMultiple.updateFamilyErrors
localFunctions.XmlBase.prototype.init = prototypeXmlBase.init
localFunctions.XmlBase.prototype.getXML = prototypeXmlBase.getXML
localFunctions.XmlBase.prototype.addByParser = prototypeXmlBase.addByParser
localFunctions.XmlBase.prototype.moveTo = prototypeXmlBase.moveTo

// XmlObject Prototypen
localFunctions.XmlObject.prototype.addError = prototypeMultiple.addError
localFunctions.XmlObject.prototype.init = prototypeXmlObject.init
localFunctions.XmlObject.prototype.getValue = prototypeXmlObject.getValue
localFunctions.XmlObject.prototype.getRawValue = prototypeXmlObject.getRawValue
localFunctions.XmlObject.prototype.setValue = prototypeXmlObject.setValue
localFunctions.XmlObject.prototype.setAttribute = prototypeXmlObject.setAttribute
localFunctions.XmlObject.prototype.getXML = prototypeXmlObject.getXML
localFunctions.XmlObject.prototype.getValueByOption = prototypeXmlObject.getValueByOption
localFunctions.XmlObject.prototype.getChildsOfType = prototypeXmlObject.getChildsOfType
localFunctions.XmlObject.prototype.getChildsByName = prototypeXmlObject.getChildsByName
localFunctions.XmlObject.prototype.delete = prototypeXmlObject.delete
localFunctions.XmlObject.prototype.move = prototypeXmlObject.move
localFunctions.XmlObject.prototype.addByParser = prototypeXmlObject.addByParser
localFunctions.XmlObject.prototype.addAfterByParser = prototypeXmlObject.addAfterByParser
localFunctions.XmlObject.prototype.updateParents = prototypeXmlObject.updateParents

export default localFunctions
