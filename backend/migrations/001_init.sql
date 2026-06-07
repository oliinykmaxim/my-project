CREATE TABLE IF NOT EXISTS Equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    userId INTEGER,
    createdAt TEXT NOT NULL,
    dateTo TEXT,
    comment TEXT
);