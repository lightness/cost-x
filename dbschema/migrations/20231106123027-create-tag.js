'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('tag', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    created_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('now()'),
    },
    updated_at: {
      type: 'datetime',
      notNull: true,
      defaultValue: new String('now()'),
    },
    title: {
      type: 'string',
      length: 100,
      notNull: true,
    },
  });
};

exports.down = function(db) {
  return db.dropTable('tag');
};

exports._meta = {
  "version": 1
};
