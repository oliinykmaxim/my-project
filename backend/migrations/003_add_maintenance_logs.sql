CREATE TABLE IF NOT EXISTS MaintenanceLogs (
    id INTEGER PRIMARY KEY,
    equipmentId INTEGER NOT NULL,
    description TEXT NOT NULL,
    cost REAL NOT NULL CHECK (cost >= 0),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (equipmentId) REFERENCES Equipment (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_equipment_userId ON Equipment (userId);