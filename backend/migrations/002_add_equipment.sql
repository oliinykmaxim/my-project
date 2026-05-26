CREATE TABLE IF NOT EXISTS Equipment (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'broken')),
    userId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE RESTRICT
);