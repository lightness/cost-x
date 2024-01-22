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
  return db.addIndex('item_tag', 'idx-unq-item_tag-item_id-tag_id', ['item_id', 'tag_id'], true);
};

exports.down = function(db) {
  return db.removeIndex('item_tag', 'idx-unq-item_tag-item_id-tag_id');
};

exports._meta = {
  "version": 1
};
