export const SETTINGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

export const UPLOADS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    extracted_text TEXT,
    extraction_status TEXT NOT NULL,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

export const LESSONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    prompt TEXT,
    source_upload_id TEXT,
    source_type TEXT NOT NULL,
    language TEXT NOT NULL,
    generation_mode TEXT NOT NULL DEFAULT 'balanced',
    status TEXT NOT NULL,
    error_message TEXT,
    last_viewed_scene_order INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (source_upload_id) REFERENCES uploads(id) ON DELETE SET NULL
  );
`;

export const LESSON_JOBS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS lesson_jobs (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    status TEXT NOT NULL,
    stage TEXT NOT NULL,
    progress INTEGER NOT NULL,
    message TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );
`;

export const OUTLINE_ITEMS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS outline_items (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    title TEXT NOT NULL,
    goal TEXT,
    scene_type TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );
`;

export const SCENES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    outline_item_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    status TEXT NOT NULL,
    content_json TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (outline_item_id) REFERENCES outline_items(id) ON DELETE CASCADE
  );
`;

export const QUIZ_ATTEMPTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    score_correct INTEGER NOT NULL,
    score_total INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );
`;

export const QUIZ_ANSWERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS quiz_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_index INTEGER NOT NULL,
    correct_index INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
  );
`;

export const CHAT_MESSAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    scene_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL
  );
`;
