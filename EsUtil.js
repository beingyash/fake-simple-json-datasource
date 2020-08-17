const Log = require('lil-logger').getLogger(__filename);
const elasticsearch = require('elasticsearch');
const pluralise = require('pluralise');
const memoize = require('memoizee');
const uid = require('uid-promise');
const Bluebird = require('bluebird');

const {
  ES_URL,
  ES_LOG_LEVEL
} = process.env;

const client = new elasticsearch.Client({
  hosts: ES_URL.split(',') || ['http://elasticsearch:9200/'],
  log: ES_LOG_LEVEL || 'info',
  defer: function () {
    return Bluebird.defer();
  },
  requestTimeout: 30000 * 3
});

exports.indexDoc = async function indexDoc(index, type, id, body) {
  !type && (type = index);
  return await client.index({ index, type, id, body });
};

exports.createIndex = async function createIndex(index, type, id, body) {
  !type && (type = index);
  if (!id) {
    Log.debug({ msg: 'create index: id not found', arg1: index, arg2: type });
    id = await uid(20);
  }

  Log.debug({ msg: 'id: ', arg1: id, arg2: type });
  return await client.create({
    index,
    type,
    id,
    body
  });
};

exports.deleteIndex = function deleteIndex(index) {
  return client.indices.delete({ index });
};

exports.deleteById = function deleteById(index, type, id) {
  return client.delete({ index, type, id });
};

exports.createMappings = function createMappings(index, mappings) {
  return client.indices.create({
    index,
    body: {
      mappings
    }
  });
};

exports.updateIndex = function updateIndex(index, type, id, doc) {
  return client.update({ index, type, id, body: { doc } });
};

exports.bulkIndex = function bulk(index, type, body) {
  !type && (type = index);
  return client.bulk({ index, type, body });
};

exports.docExists = function docExists(index, type, id) {
  !type && (type = index);
  return client.exists({ index, type, id });
};

exports.getClient = function () {
  return client;
};

exports.getIndexType = memoize(function (collectionName) {
  const index = collectionName.toLowerCase();
  return {
    index,
    type: pluralise(0, index)
  };
});

exports.hashCode = function (s) {
  let ret;
  for (let ret = 0, i = 0, len = s.length; i < len; i++) {
    ret = (31 * ret + s.charCodeAt(i)) << 0;
  }
  return ret;
};

exports.getObjFromAggs = function getObjFromAggs(idBucket = [], nameBucket = []) {
  const ret = [];
  for (let i = 0; i < idBucket.length; i++) {
    const id = idBucket[i];

    ret.push({
      id: id.key,
      name: nameBucket[i].key,
      count: id.doc_count
    });
  }
  return ret;
};

exports.getArrFromAggs = function getArrFromAggs(idBucket = [], showDocCount = false) {
  const ret = [];
  for (let i = 0; i < idBucket.length; i++) {
    const { key, doc_count } = idBucket[i];
    ret.push(showDocCount ? { name: key, count: doc_count } : key);
  }
  return ret;
};

exports.buildArrayORQuery = function buildArrayORQuery(field, terms, mainQuery) {
  if (!terms) {
    return;
  }
  if (!Array.isArray(terms)) {
    terms = [terms];
  }
  if (terms && terms.length) {
    mainQuery.push(`${field}:(${terms.join(' OR ')})`);
  }
};