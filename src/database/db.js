import * as SQLite from 'expo-sqlite';

/**
 * Migration and Setup
 */
export async function migrateDb(db) {
  console.log('Starting migration...');
  try {
    // Individual table creation for maximum stability
    await db.execAsync('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT, color TEXT);');
    await db.execAsync('CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL NOT NULL, category_id INTEGER, description TEXT, date TEXT NOT NULL, type TEXT DEFAULT "expense");');
    await db.execAsync('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);');

    const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM categories');
    if (result && result.count === 0) {
      console.log('Seeding initial data...');
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Food', 'utensils', '#ff6b6b');");
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Transport', 'car', '#4dabf7');");
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Rent', 'home', '#51cf66');");
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Health', 'heart', '#f06595');");
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Shopping', 'shopping-bag', '#cc5de8');");
      await db.execAsync("INSERT INTO categories (name, icon, color) VALUES ('Others', 'more-horizontal', '#868e96');");

      await db.execAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('monthly_salary', '0');");
      await db.execAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('user_name', 'User');");
      await db.execAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('theme_mode', 'light');");
    }
    console.log('Migration complete.');
  } catch (e) {
    console.error('MIGRATION FATAL:', e);
  }
}

/**
 * Expense Operations
 */
export async function getExpenses(db) {
  try {
    return await db.getAllAsync(`
      SELECT e.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon 
      FROM expenses e 
      LEFT JOIN categories c ON e.category_id = c.id 
      ORDER BY e.date DESC, e.id DESC
    `);
  } catch (err) {
    console.error('QUERY ERROR:', err);
    return [];
  }
}

export async function addExpense(db, amount, categoryId, description, date) {
  try {
    return await db.runAsync(
      'INSERT INTO expenses (amount, category_id, description, date) VALUES (?, ?, ?, ?)',
      amount || 0,
      categoryId || 1,
      description || '',
      date || new Date().toISOString()
    );
  } catch (err) {
    console.error('ADD ERROR:', err);
  }
}

export async function deleteExpenseDb(db, id) {
  try {
    return await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
  } catch (e) { console.error(e); }
}

/**
 * Category Operations
 */
export async function getCategories(db) {
  try {
    return await db.getAllAsync('SELECT * FROM categories') || [];
  } catch (e) { return []; }
}

/**
 * Settings Operations
 */
export async function getSalaryDb(db) {
  try {
    const result = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', 'monthly_salary');
    return result ? parseFloat(result.value) : 0;
  } catch (e) { return 0; }
}

export async function updateSalaryDb(db, amount) {
  try {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'monthly_salary', (amount || 0).toString());
  } catch (e) { console.error(e); }
}

export async function getSettingDb(db, key, defaultValue = '') {
  try {
    const result = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
    return result ? result.value : defaultValue;
  } catch (e) { return defaultValue; }
}

export async function updateSettingDb(db, key, value) {
  try {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value.toString());
  } catch (e) { console.error(e); }
}
