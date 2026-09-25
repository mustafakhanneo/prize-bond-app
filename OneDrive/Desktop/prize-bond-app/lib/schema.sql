-- 1. Official Winning Draws Table
CREATE TABLE IF NOT EXISTS winning_draws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denomination INTEGER NOT NULL,      -- 100, 200, 750, 1500, 25000, 40000
    draw_number INTEGER NOT NULL,       -- e.g., 53
    draw_date TEXT NOT NULL,            -- e.g., '2026-02-16'
    winning_number TEXT NOT NULL,       -- 6-digit string e.g., '482910'
    prize_position TEXT NOT NULL,       -- '1st', '2nd', '3rd'
    prize_amount INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_draws_lookup ON winning_draws(denomination, winning_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_draws_unique ON winning_draws(denomination, draw_number, winning_number, prize_position);

-- 2. User Accounts
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                -- UUID string
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Saved Bonds
CREATE TABLE IF NOT EXISTS user_bonds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    denomination INTEGER NOT NULL,
    bond_number TEXT NOT NULL,          -- 6-digit string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_bonds_id ON user_bonds(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_bonds_unique ON user_bonds(user_id, denomination, bond_number);
