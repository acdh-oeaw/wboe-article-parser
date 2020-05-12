import Parser from '../Parser'

function domDescendantsPIN (dom) {
  let hasPIN = false
  if (dom.childNodes && dom.childNodes.length > 0) {
    dom.childNodes.forEach(function (aChild) {
      if (aChild.nodeType === aChild.PROCESSING_INSTRUCTION_NODE || domDescendantsPIN(aChild)) {
        hasPIN = true
      }
    }, this)
  }
  return hasPIN
}

const localFunctions = {
  init () {
    if (this.orgDOM.nodeType === this.orgDOM.PROCESSING_INSTRUCTION_NODE) {
      this.name = this.orgDOM.nodeName
      this.type = 'PIN'
      try {
        this.options = JSON.parse(this.orgDOM.nodeValue)
      } catch (err) {
        console.log(err)
        let errArr = [err.toString()]
        let errRange = errArr[0].match(/position (\d+)/mi)
        if (errRange.length > 1) {
          errArr.push('Fehlerbereich: ' + ((errRange[1] > 30) ? '...' : '') + this.orgDOM.nodeValue.substr(((errRange[1] > 30) ? errRange[1] - 30 : 0), 60).trim() + '...')
        }
        this.addError({'txt': 'Fehler im JSON-String! (preview)', 'err': errArr})
      }
    } else {
      this.type = 'HTML'
      if (domDescendantsPIN(this.orgDOM)) {
        this.name = this.orgDOM.nodeName
        let attr = this.orgDOM.attributes
        if (attr.length > 0) {
          for (var i = 0; i < attr.length; i++) {
            this.attributes[attr[i].nodeName] = attr[i].nodeValue
          }
        }
        if (this.orgDOM.childNodes.length > 0) {
          this.orgDOM.childNodes.forEach(function (previewChild) {
            let aHTML = previewChild.outerHTML
            if (previewChild.nodeType === previewChild.TEXT_NODE) {
              aHTML = previewChild.nodeValue
            }
            if (previewChild.nodeType === previewChild.PROCESSING_INSTRUCTION_NODE || domDescendantsPIN(previewChild)) {
              this.content.push(new Parser.ParserPreviewObject(previewChild))
            } else if ((aHTML && aHTML.trim().length > 0)) {
              let lPos = this.content.length - 1
              if (lPos >= 0 && typeof this.content[lPos] === 'string') {
                this.content[lPos] += ' ' + aHTML.trim()
              } else {
                this.content.push(aHTML.trim())
              }
            }
          }, this)
        }
      } else {
        let aHTML = this.orgDOM.outerHTML
        if (this.orgDOM.nodeType === this.orgDOM.TEXT_NODE) {
          aHTML = this.orgDOM.nodeValue
        }
        if (aHTML && aHTML.trim().length > 0) {
          this.content.push(aHTML.trim())
        }
      }
    }
    this.ready = true
    this.useable = true
    return true
  },
  attributesToText () {
    let attr = this.orgDOM.attributes
    let attrTxt = ''
    if (attr.length > 0) {
      for (var i = 0; i < attr.length; i++) {
        attrTxt += ' ' + attr[i].nodeName + '="' + attr[i].nodeValue + '"'
      }
    }
    return attrTxt
  },
}

export default localFunctions
