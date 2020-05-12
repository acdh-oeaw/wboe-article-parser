import prototypeMultiple from '../aPrototypes/Multiple'
import prototypeEditorBase from './prototypes/EditorBase'
import prototypeEditorObject from './prototypes/EditorObject'

const localFunctions = {
  EditorBase (parserObj, xmlObj, cCall = null) {
    this.ready = false						// Ist das Objekt bereit?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = {}							// Fehler. Property = "EditorObject.uId" oder "-1" für "EditorBase"
    this.warnings = {}						// Warnungen. Property = "EditorObject.uId" oder "-1" für "EditorBase"
    this.comments = []						// Kommentare.
    this.contentObj = null				// Enthaltene "EditorObject"
    this.family = []							// Alle "EditorObject"e "Key" = "uId"
    this.parserObj = parserObj || null	// parserObj
    this.orgXmlObj = xmlObj || null			// Original von xmlObj
    this.xmlIds = {}							// Verwendete "xml:id"s auflisten
    this.changeCall = cCall				// Funktion die aufgerufen wird wenn es eine Änderung gibt
    this.init()										// Immer dirket initialisieren
    this.updateFamilyErrors()
  },
  EditorObject (root, parents, parser, xml, isRoot, ignoreChilds, dontInit, autoCreate) {
    this.parserObj = parser || null		// Aktuelles Parser Objekt
    this.orgXmlObj	= xml || null	// Original Xml Objekt
    this.ready = false						// Ist das Objekt bereit?
    this.refresh = true						// Neu zeichnen ...
    this.autoCreated = autoCreate		// Wurde dieses Objekt automatisch erstellt?
    this.useable = false					// Kann das Objekt zum parsen verwendet werden? (Keine Fehler und Ready)
    this.errors = []							// Liste der Fehler
    this.warnings = []						// Liste der Warnungen
    this.childsWithErrors = false		// Gibt es Kinder mit Fehlern
    this.descendantsWithErrors = false		// Gibt es Nachfahren mit Fehlern
    this.uId = null								// Individuelle Nummer des EditorObjects
    this.childs = []							// Enthaltene "EditorObject" Kinder
    this.ignoreChilds = ignoreChilds || false		// Sollen die Kinder ignoriert werden?
    this.parserUsed = {}					// Wie oft wurde jeder Parser bereits verwendet? { [uId] : [EditorObject, ...] }
    this.parserMatches = []				// Die "match"es
    this.parents = parents || []	// Liste der Eltern
    this.root = root							// Enthält die "EditorBase"
    this.isRoot = isRoot || false
    this.siblings = ((this.parents.length > 0) ? this.parents[0].childs : [this])		// Geschwister
    this.isMultiple = false				// Kann dieses Objekt öfter hinter einander vor kommen?
    this.isParserCopy = false			// Ist das ParserObject eine Kopie?
    this.parserCopyDeep = 0				// Tiefe ...
    this.fxFunction = null				// Spezielle Funktion
    this.fxData = {}							// Daten für spezielle Funktion
    // Werte die nach dem Setzen aller "EditorObject"e gesetzt werden. (updateData)
    this.count = 0								// Das wievielte Elment?
    this.countParser = 0					// Das wievielte Objekt mit diesem Parser innerhalb dieser Generation ist es?
    this.multipleNr = 0						// Position in der aktuellen "multiple"-Gruppe
    this.multipleLast = true			// Letzter der aktuellen "multiple"-Gruppe
    this.addableAfter = []				// Welche Objekte können nach diesem hinzugefügt werden?
    this.addableInner = []				// Welche Objekte können nach diesem hinzugefügt werden?
    if (!dontInit) {
      this.init()
    }
    // this.add(parser, pos, xml)			// Kind hinzufügen (XML hinzufügen falls nicht vorhanden!)
    // this.delete(pos)						// Kind löschen (Rekursion beachten)	(XML entfernen!)
    // this.getSiblings(mode, useable)		// Alle Geschwister
  },
}

// EditorBase Prototypen
localFunctions.EditorBase.prototype.addError = prototypeMultiple.addError
localFunctions.EditorBase.prototype.addWarning = prototypeMultiple.addWarning
localFunctions.EditorBase.prototype.getCompressedBaseError = prototypeMultiple.getCompressedBaseError
localFunctions.EditorBase.prototype.updateFamilyErrors = prototypeMultiple.updateFamilyErrors
localFunctions.EditorBase.prototype.init = prototypeEditorBase.init
localFunctions.EditorBase.prototype.getXML = prototypeEditorBase.getXML
localFunctions.EditorBase.prototype.moveTo = prototypeEditorBase.moveTo
localFunctions.EditorBase.prototype.getEditorObjById = prototypeEditorBase.getEditorObjById
localFunctions.EditorBase.prototype.checkXmlIds = prototypeEditorBase.checkXmlIds

// EditorObject Prototypen
localFunctions.EditorObject.prototype.addError = prototypeMultiple.addError
localFunctions.EditorObject.prototype.addWarning = prototypeMultiple.addWarning
localFunctions.EditorObject.prototype.deleteErrors = prototypeMultiple.deleteErrors
localFunctions.EditorObject.prototype.deleteWarnings = prototypeMultiple.deleteWarnings
localFunctions.EditorObject.prototype.init = prototypeEditorObject.init
localFunctions.EditorObject.prototype.add = prototypeEditorObject.add
localFunctions.EditorObject.prototype.addAfter = prototypeEditorObject.addAfter
localFunctions.EditorObject.prototype.getSiblings = prototypeEditorObject.getSiblings
localFunctions.EditorObject.prototype.getChilds = prototypeEditorObject.getChilds
localFunctions.EditorObject.prototype.checkParser = prototypeEditorObject.checkParser
localFunctions.EditorObject.prototype.updateAddable = prototypeEditorObject.updateAddable
localFunctions.EditorObject.prototype.updateData = prototypeEditorObject.updateData
localFunctions.EditorObject.prototype.delete = prototypeEditorObject.delete
localFunctions.EditorObject.prototype.move = prototypeEditorObject.move
localFunctions.EditorObject.prototype.updateParents = prototypeEditorObject.updateParents
localFunctions.EditorObject.prototype.checkXmlId = prototypeEditorObject.checkXmlId

export default localFunctions
