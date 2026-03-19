try {
    const libsql = require('@libsql/client/sqlite3');
    console.log('--- @libsql/client/sqlite3 ---');
    console.log('Keys:', Object.keys(libsql));
    console.log('Is function?', typeof libsql === 'function');
    console.log('Database type:', typeof libsql.Database);
    
    // Test if the exports match what Sequelize expects for 'sqlite3'
    // Sequelize expects: new (require('sqlite3').Database)(...)
    const { Database } = libsql;
    const db = new Database(':memory:');
    console.log('Database instance created successfully');
} catch (e) {
    console.log('Error found in @libsql/client/sqlite3:', e.message);
    if (e.stack) console.log(e.stack);
}
