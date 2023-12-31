require('should')
const define = require('../lib/define.js')
const remove = require('../lib/remove.js')
const model = require('./model')
const sql = require('jsreport-sql-2')

describe('remove', function () {
  let table

  beforeEach(function () {
    const tables = define(model, 'mssql', '')
    sql.setDialect('mssql')
    table = sql.define(tables[0])
  })

  it('support remove by prop query', function () {
    remove(table, { _id: 'a' }, 'users', model).text.should.be.eql('DELETE FROM [UserType] WHERE ([UserType].[_id] = @1)')
  })

  it('support remove by prop with or query', function () {
    remove(table, { _id: 'a', $or: [{ int: 1 }, { int: 2 }] }, 'users', model).text.should.be.eql('DELETE FROM [UserType] WHERE (([UserType].[_id] = @1) AND (([UserType].[int] = @2) OR ([UserType].[int] = @3)))')
  })
})
