import Vue from 'vue'

const localFunctions = {
  addError (error, field = 'errors') {
    var aNr = -1
    var root = this
    if (this.uId || this.uId === 0) {		// Handelt es sich um ein "ParserObject"?
      aNr = this.uId
      if (Array.isArray(this[field])) {
        this[field].push({'err': error})
      }
      root = this.root
    }
    if (!Array.isArray(root[field][aNr])) {
      Vue.set(root[field], aNr, [])
    }
    root[field][aNr].push({'obj': this, 'err': error})
  },
  deleteErrors (field = 'errors') {
    var aNr = -1
    var root = this
    if (this.uId || this.uId === 0) {		// Handelt es sich um ein "ParserObject"?
      aNr = this.uId
      if (Array.isArray(this[field])) {
        this[field] = []
      }
      root = this.root
    }
    Vue.delete(root[field], aNr)
  },
  addWarning (warning) {
    localFunctions.addError.call(this, warning, 'warnings')
  },
  deleteWarnings () {
    localFunctions.deleteErrors.call(this, 'warnings')
  },
  getCompressedBaseError () {
    let cErrors = {}
    if (Object.keys(this.errors).length > 0) {
      let lErr = null
      let cErrKey = []
      Object.keys(this.errors).forEach(function (aErrKey) {
        if (lErr) {
          if (this.errors[aErrKey].length !== 1
            || lErr[0].err !== this.errors[aErrKey][0].err) {
            cErrors[cErrKey[0] + '-' + cErrKey[cErrKey.length - 1]] = lErr
            cErrKey = []
          }
        }
        lErr = this.errors[aErrKey]
        cErrKey.push(aErrKey)
      }, this)
      if (lErr) {
        cErrors[cErrKey[0] + '-' + cErrKey[cErrKey.length - 1]] = lErr
        cErrKey = []
      }
    }
    // console.log(cErrors)
    return cErrors
  },
  updateFamilyErrors () {
    if (this.family.length > 0) {
      this.comments = []
      this.family.forEach(function (aObj) {
        if (aObj) {
          aObj.childsWithErrors = false
          aObj.descendantsWithErrors = false
          if (aObj.orgXmlObj && aObj.orgXmlObj.comments && aObj.orgXmlObj.comments.length > 0) {
            let comment = {comments: aObj.orgXmlObj.comments}
            if (aObj.parserObj) {
              if (aObj.parserObj.name) {
                comment.name = aObj.parserObj.name
              }
              let cParserOptions = aObj.parserObj.options
              if (cParserOptions) {
                if (cParserOptions.getResult('title')) {
                  comment.title = cParserOptions.getResult('title')
                } else if (cParserOptions.getOption('tagAsTitle') || this.layoutBase === 'panel') {
                  comment.title = aObj.orgXmlObj.name
                }
              }
            }
            this.comments.push(comment)
          }
        }
      }, this)
      this.family.forEach(function (aObj) {
        if (aObj && aObj.errors.length > 0 && aObj.parents.length > 0) {
          aObj.parents[0].childsWithErrors = true
          aObj.parents.forEach(function (aPar) {
            aPar.descendantsWithErrors = true
          })
        }
      }, this)
    }
  },
}

export default localFunctions
