const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
const username = process.argv[2] || 'Admin';

db.run("UPDATE Users SET role='support' WHERE username=?", [username], function(err) {
  if (err) {
    console.error('Database Error:', err.message);
  } else if (this.changes > 0) {
    console.log(`\n SUCCESS! The user '${username}' has been upgraded to the 'support' team.\nMake sure they log out and log back in to see the new Status Dropdown!\n`);
  } else {
    console.log(`\n ERROR: No user found with the username '${username}'.\nPlease make sure they registered on the portal first.\n`);
  }
});

db.close();
