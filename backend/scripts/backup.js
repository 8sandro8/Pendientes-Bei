const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const KEEP_BACKUPS = parseInt(process.env.KEEP_BACKUPS) || 7;

const DATA_FILES = [
  'pendientes.json',
  'orders.json',
  'categories.json',
  'requests.json'
];

function log(message) {
  console.log(`[Backup] ${new Date().toISOString()} - ${message}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

function readJSONFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    log(`Error reading ${filePath}: ${err.message}`);
    return null;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    log(`Error writing ${filePath}: ${err.message}`);
    return false;
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();

    const toDelete = files.slice(KEEP_BACKUPS);
    toDelete.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      log(`Deleted old backup: ${file}`);
    });

    return toDelete.length;
  } catch (err) {
    log(`Error cleaning backups: ${err.message}`);
    return 0;
  }
}

async function createBackup() {
  log('Starting backup process...');

  ensureDir(BACKUP_DIR);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    files: {}
  };

  let successCount = 0;
  let errorCount = 0;

  for (const file of DATA_FILES) {
    const filePath = path.join(DATA_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      log(`WARNING: File not found: ${file}`);
      errorCount++;
      continue;
    }

    const data = readJSONFile(filePath);
    if (data !== null) {
      backupData.files[file] = data;
      log(`Backed up: ${file} (${Array.isArray(data) ? data.length : 'object'} items)`);
      successCount++;
    } else {
      errorCount++;
    }
  }

  if (successCount > 0) {
    writeJSONFile(backupFile, backupData);
    log(`Backup created: ${path.basename(backupFile)}`);
  }

  const deleted = cleanOldBackups();
  if (deleted > 0) {
    log(`Cleaned up ${deleted} old backup(s)`);
  }

  log(`Backup completed: ${successCount} files, ${errorCount} errors`);
  
  return {
    success: errorCount === 0,
    backupFile: backupFile,
    filesBackedUp: successCount,
    errors: errorCount
  };
}

if (require.main === module) {
  createBackup()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(err => {
      log(`Fatal error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { createBackup };