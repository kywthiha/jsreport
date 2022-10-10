const headerFooterReferences = require('./headerFooterReferences')
const bookmark = require('./bookmark')
const style = require('./style')
const drawingObject = require('./drawingObject')
const link = require('./link')
const form = require('./form')
const watermark = require('./watermark')
const pageBreak = require('./pageBreak')
const toc = require('./toc')
const removeBlockHelper = require('./removeBlockHelper')
const html = require('./html')

module.exports = async (files, options) => {
  const newBookmarksMap = new Map()
  const headerFooterRefs = await headerFooterReferences(files)
  // we handle the html step as the first to ensure no other step
  // work with the attribute and comment we put for the <w:p> elements for the html handling
  await html(files, headerFooterRefs)
  await bookmark(files, headerFooterRefs, newBookmarksMap)
  await watermark(files)
  await pageBreak(files)
  style(files)
  await drawingObject(files, headerFooterRefs, newBookmarksMap, options)
  link(files)
  form(files)
  await toc(files)
  await removeBlockHelper(files)
}
