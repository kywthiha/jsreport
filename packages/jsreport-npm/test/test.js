require('should')
const fs = require('fs')
const path = require('path')
const Reporter = require('@jsreport/jsreport-core')

describe('npm', function () {
  let reporter

  beforeEach(async () => {
    reporter = Reporter({
      rootDirectory: process.cwd(),
      trustUserCode: true,
      workers: {
        numberOfWorkers: 1
      }
    })
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('../')())

    await reporter.init()
    if (fs.existsSync(path.join(reporter.options.tempDirectory, 'npm', 'modules'))) {
      fs.rmSync(path.join(reporter.options.tempDirectory, 'npm', 'modules'), { recursive: true })
    }
  })

  afterEach(() => reporter.close())

  it('jsreport.npm.require should work for packages dynamically installed to temp', async () => {
    const res = await reporter.render({
      template: {
        content: '{{test}}',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.25.3')

          function test() {
            return moment().format('YYYY-MM-DD')
          }
        `
      }
    })
    res.content.toString().should.be.eql(require('moment')().format('YYYY-MM-DD'))
    fs.existsSync(path.join(reporter.options.tempDirectory, 'npm', 'modules', 'moment@2.25.3')).should.be.ok()
  })

  it('jsreport.npm.require should support multiple package versions at the same time', async () => {
    const res = await reporter.render({
      template: {
        content: '{{test}}',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment1 = await jsreport.npm.require('moment@2.25.3')
          const moment2 = await jsreport.npm.require('moment@2.26.0')          

          function test() {
            return moment1 === moment2 ? 'equals' : 'not'
          }
        `
      }
    })
    res.content.toString().should.be.eql('not')
  })

  it('jsreport.npm.require should work for scoped packages and module path', async () => {
    const res = await reporter.render({
      template: {
        content: '{{test}}',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const defaults = await jsreport.npm.require('@jsreport/jsreport-core@3.11.4/lib/main/defaults')

          function test() {
            return defaults.getDefaultLoadConfig()
          }
        `
      }
    })
    res.content.toString().should.be.eql('false')
    fs.existsSync(path.join(reporter.options.tempDirectory, 'npm', 'modules', '@jsreport-jsreport-core@3.11.4')).should.be.ok()
  })

  it('jsreport.npm.require should be cleared from require cache in second request', async () => {
    await reporter.render({
      template: {
        content: 'foo',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.29.1')
          moment.foo = 'xxxx'
        `
      }
    })
    const res = await reporter.render({
      template: {
        content: '{{test}}',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.29.1')
          function test() {
            return moment.foo
          }
        `
      }
    })
    res.content.toString().should.not.be.eql('xxxx')
  })

  it('should expose npmModule helper', async () => {
    const res = await reporter.render({
      template: {
        content: '{{npmModule "moment@2.29.1"}}',
        engine: 'handlebars',
        recipe: 'html'
      }
    })
    res.content.toString().should.containEql('moment')
  })

  it('should expose npmModule helper working with scoped module and path', async () => {
    const res = await reporter.render({
      template: {
        content: '{{npmModule "@jsreport/jsreport-core@3.11.4/lib/main/defaults"}}',
        engine: 'handlebars',
        recipe: 'html'
      }
    })
    res.content.toString().should.containEql('jsreport')
  })
})

describe('npm with disabled trustUserCode', function () {
  let reporter

  beforeEach(() => {
    reporter = Reporter({
      rootDirectory: process.cwd(),
      trustUserCode: false
    })
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('../')())

    return reporter.init()
  })

  afterEach(() => reporter.close())

  it('jsreport.npm.require should be rejected', async () => {
    return reporter.render({
      template: {
        content: '',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.29.1')
        `
      }
    }).should.be.rejectedWith(/require/)
  })
})

describe('npm with disabled trustUserCode but enabled npm.allowedModules[]', function () {
  let reporter

  beforeEach(() => {
    reporter = Reporter({
      rootDirectory: process.cwd(),
      trustUserCode: false
    })
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('../')({
        allowedModules: ['moment']
      }))

    return reporter.init()
  })

  afterEach(() => reporter.close())

  it('jsreport.npm.require should work', async () => {
    await reporter.render({
      template: {
        content: '',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.29.1')
        `
      }
    })
  })
})

describe('npm with disabled trustUserCode but enabled npm.allowedModules=*', function () {
  let reporter

  beforeEach(() => {
    reporter = Reporter({
      rootDirectory: process.cwd(),
      trustUserCode: false
    })
      .use(require('@jsreport/jsreport-handlebars')())
      .use(require('../')({
        allowedModules: '*'
      }))

    return reporter.init()
  })

  afterEach(() => reporter.close())

  it('jsreport.npm.require should work', async () => {
    await reporter.render({
      template: {
        content: '',
        engine: 'handlebars',
        recipe: 'html',
        helpers: `
          const jsreport = require('jsreport-proxy')
          const moment = await jsreport.npm.require('moment@2.29.1')
        `
      }
    })
  })
})
