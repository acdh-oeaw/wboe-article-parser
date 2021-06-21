import prototypeMultiple from '../aPrototypes/Multiple'
import prototypeParserBase from './prototypes/ParserBase'
import prototypeParserObject from './prototypes/ParserObject'
import prototypeParserObjectCheck from './prototypes/ParserObjectCheck'
import prototypeParserOptions from './prototypes/ParserOptions'
import prototypeParserPreviewObject from './prototypes/ParserPreviewObject'

const localFunctions = {
  ParserBase: function (xmlString, aFile, getAdditionalFile) {
    this.ready = false						// Ist das Objekt bereit?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = {}							// Fehler. Property = "ParserObject.uId" oder "-1" für "ParserBase"
    this.warnings = {}						// Warnungen. Property = "ParserObject.uId" oder "-1" für "ParserBase"
    this.content = []							// Enthaltene "ParserObject" Kinder
    this.system = []							// Enthaltene "ParserObject" Kinder
    this.header = null						// Wird als String bei der ausgegebenen XML-Datei eingefügt
    this.family = []							// Alle "ParserObject"e "Key" = "uId"
    this.idList = {}							// Alle "ParserObject"e mit "id". Property = "id"
    this.idOptions = {}						// Alle "optionsPreset". Property = "id"
    this.previewObj = []					// ParserPreviewObject
    this.orgString = null					// Original String für DOM
    this.orgFilename = null				// Original Dateiname
    this.orgPath = null						// Original Verzeichniss
    this.getAdditionalFile = getAdditionalFile	// Funktion zum laden zusätzlicher Dateien.
    this.orgDOM = null						// Original DOM über init generiert
    this.additionalFiles = {}			// Zusätzliche, benötigte Dateien
    this.type = 'unknown'					// Art des Parsers (lioe)
    this.version = 'unknown'			// Version des Parsers
    if (xmlString) {							// Wenn der "xmlString" übergeben wurde direkt initialisieren
      this.init(xmlString, aFile)
    }
  },
  ParserObject: function (root, parents, dom) {
    this.ready = false						// Ist das Objekt bereit?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = []							// Liste der Fehler
    this.warnings = []						// Liste der Warnungen
    this.childsWithErrors = false		// Gibt es Kinder mit Fehlern
    this.descendantsWithErrors = false		// Gibt es Nachfahren mit Fehlern
    this.uId = null								// Individuelle Nummer des ParserObjects
    this.name = null							// Tagname
    this.attributes = {}					// Attribute des Tags
    this.childs = []							// Enthaltene "ParserObject" Kinder
    this.parents = parents || []	// Liste der Eltern
    this.root = root							// Enthält die "ParserBase"
    this.options = new localFunctions.ParserOptions()	// Aktuelle Optionen als "ParserOptions"
    this.orgDOM = dom							// Original DOM
    this.isCopy = false						// Handelt es sich um eine Kopie?
    this.copyOptions = []					// Optionen die im zweiten Durchlauf angewendet werden müssen.
    this.siblings = ((this.parents.length > 0) ? this.parents[0].childs : this.root.content)		// Geschwister
    this.init()										// Immer dirket initialisieren
    // this.hasToBeHere(EditorObject)		// Ermitteln ob es sich um ein notwendiges Kind des "EditorObject"s handelt
    // this.match(XmlObject)					// Ermittelt die Übereinstimmung zwischen "ParserObjekt" und "XmlObjekt"
    // this.checkAttributes(attributes)	// Überprüft Attribute [{'attribut': 'value'}] -> gibt Array mit Fehlern zurück
    // this.checkAttribute(attribute, value)		// Überprüft Attribut	-> gibt Fehler zurück
  },
  ParserOptions: function () {
    this.ready = false						// Ist die Option bereit?
    this.useable = false					// Kann die Option zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = []							// Liste der Fehler
    this.warnings = []						// Liste der Warnungen
    this.options = {}							// Aktuelle Optionen
    this.$optionsCache = {}				// Cache für getOption
    this.init()										// Immer dirket initialisieren
    // this.initFromParserObject(ParserObject)	// Startwerte von "ParserObject" ermitteln
    // this.extendJSON(jsonString, errObj)		// Optionen erweitern durch JSON String
    // this.extendObj(optionObj)			// Optionen erweitern durch Objekt
    // this.get('x.y')								// Option nach Pfad ermitteln x -> y -> ...
  },
  ParserPreviewObject: function (dom) {
    this.ready = false						// Ist das PreviewObject bereit?
    this.useable = false					// Kann das PreviewObject verwendet werden? (Keine Fehler und Ready)
    this.errors = []							// Liste der Fehler
    this.warnings = []						// Liste der Warnungen
    this.orgDOM = dom							// Original DOM
    this.name = null							// Aktueller nodeName
    this.attributes = {}					// Aktuelle Attribute
    this.options = {}							// Aktuelle Optionen für PIN
    this.content = []							// Inhalt: Kann "string" oder "ParserPreviewObject" sein.
    this.type = null							// Typ des "ParserPreviewObject"s
    this.init()										// Immer dirket initialisieren
  },
}

// ParserBase Prototypen
localFunctions.ParserBase.prototype.addError = prototypeMultiple.addError
localFunctions.ParserBase.prototype.prescan = prototypeParserBase.prescan
localFunctions.ParserBase.prototype.init = prototypeParserBase.init
localFunctions.ParserBase.prototype.updateFamilyErrors = prototypeMultiple.updateFamilyErrors

// ParserObject Prototypen
localFunctions.ParserObject.prototype.addError = prototypeMultiple.addError
localFunctions.ParserObject.prototype.init = prototypeParserObject.init
localFunctions.ParserObject.prototype.makeCopy = prototypeParserObject.makeCopy
localFunctions.ParserObject.prototype.match = prototypeParserObject.match
localFunctions.ParserObject.prototype.getSiblings = prototypeParserObject.getSiblings
localFunctions.ParserObject.prototype.getChilds = prototypeParserObject.getChilds
localFunctions.ParserObject.prototype.getChildsByName = prototypeParserObject.getChildsByName
localFunctions.ParserObject.prototype.checkAttributes = prototypeParserObjectCheck.checkAttributes
localFunctions.ParserObject.prototype.checkAttribute = prototypeParserObjectCheck.checkAttribute
localFunctions.ParserObject.prototype.checkValue = prototypeParserObjectCheck.checkValue
localFunctions.ParserObject.prototype.checkPosition = prototypeParserObjectCheck.checkPosition
localFunctions.ParserObject.prototype.checkChilds = prototypeParserObjectCheck.checkChilds

// ParserOptions Prototypen
localFunctions.ParserOptions.prototype.addError = prototypeMultiple.addError
localFunctions.ParserOptions.prototype.init = prototypeParserOptions.init
localFunctions.ParserOptions.prototype.initFromParserObject = prototypeParserOptions.initFromParserObject
localFunctions.ParserOptions.prototype.decompressOptions = prototypeParserOptions.decompressOptions
localFunctions.ParserOptions.prototype.extendJSON = prototypeParserOptions.extendJSON
localFunctions.ParserOptions.prototype.extendObj = prototypeParserOptions.extendObj
localFunctions.ParserOptions.prototype.combineObj = prototypeParserOptions.combineObj
localFunctions.ParserOptions.prototype.getOption = prototypeParserOptions.getOption
localFunctions.ParserOptions.prototype.getResult = prototypeParserOptions.getResult
localFunctions.ParserOptions.prototype.extendPreviewLayout = prototypeParserOptions.extendPreviewLayout
localFunctions.ParserOptions.prototype.getOptionValue = prototypeParserOptions.getOptionValue

// ParserOptions Prototypen
localFunctions.ParserPreviewObject.prototype.addError = prototypeMultiple.addError
localFunctions.ParserPreviewObject.prototype.init = prototypeParserPreviewObject.init
localFunctions.ParserPreviewObject.prototype.attributesToText = prototypeParserPreviewObject.attributesToText

export default localFunctions
