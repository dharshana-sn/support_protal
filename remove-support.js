const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
const username = process.argv[2];

if (!username) {
  console.log('\n USAGE: node remove-support.js <username>\n Example: node remove-support.js user@example.com\n');
  process.exit(1);
}

db.run("UPDATE Users SET role='user' WHERE username=?", [username], function(err) {
  if (err) {
    console.error('Database Error:', err.message);
  } else if (this.changes > 0) {
    console.log(`\n SUCCESS! The user '${username}' has been reverted to a regular 'user'.\nThey will no longer have access to all tickets.\n`);
  } else {
    console.log(`\n ERROR: No user found with the username '${username}'.\nPlease make sure the username is correct.\n`);
  }
});

db.close();
