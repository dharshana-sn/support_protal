const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE Users ADD COLUMN role VARCHAR(255) DEFAULT 'user'", (err) => {
    if (err) console.log("Users role column might already exist:", err.message);
    else console.log("Added role column to Users.");
  });
  
  db.run("ALTER TABLE SupportRequests ADD COLUMN status VARCHAR(255) DEFAULT 'Open'", (err) => {
    if (err) console.log("SupportRequests status column might already exist:", err.message);
    else console.log("Added status column to SupportRequests.");
  });
});

db.close(() => console.log("Done checking columns."));
