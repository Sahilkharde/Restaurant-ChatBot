var config = require('../config/config');
var logger = require(global.appRoot + '/app/log');
var env = 'development';
var knex = require('knex')(config.db[env]);
knex.on('query', (query) => {
    logger.info('Executing Query:'+ query.sql);
});

knex.on('query-response', (response, query) => {
    logger.info('Query Completed:'+ query.sql);
});

knex.on('query-error', (error, query) => {
    logger.error('Query Error:'+ error+ ' in query: '+ query.sql);
});
module.exports = knex;
/* knex.migrate.latest([config.db]); */
