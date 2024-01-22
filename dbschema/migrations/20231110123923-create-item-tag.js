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
  return db.createTable('item_tag', {
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
    item_id: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'item_tag_item_id_fk',
        table: 'item',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
        },
      },
    },
    tag_id: {
      type: 'int',
      notNull: true,
      foreignKey: {
        name: 'item_tag_tag_id_fk',
        table: 'tag',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
        },
      },
    },
  });
};

exports.down = function(db) {
  return db.dropTable('item_tag');
};

exports._meta = {
  "version": 1
};
