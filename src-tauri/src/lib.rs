#[cfg_attr(mobile, tauri::mobile_entry_point)]

mod db;

use db::{Database, Book, BookMetadata};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use tauri::{command, State};

struct AppState {
    db: Mutex<Database>,
}

#[command]
async fn save_book (
    state: State<'_, AppState>,
    mut book_data: Book,
    cover_data: Option<Vec<u8>>,
) -> Result<(), String> {
    let books_dir = Path::new("books");
    fs::create_dir_all(books_dir).map_err(|e| e.to_string())?;

    //复制书籍文件
    let dest_path = books_dir.join(&book_data.id);
    fs::copy(&book_data.file_path, &dest_path).map_err(|e| e.to_string())?;

    //更新书籍路径
    book_data.file_path = dest_path.to_string_lossy().into_owned();

    let cover_info = cover_data.as_ref().map(|data| (data.as_slice(), "image/jpeg"));
    state.db
    .lock()
    .unwrap()
    .save_book(&book_data, cover_info)
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
async fn get_cover(
    state: State<'_, AppState>,
    book_id: String
) -> Result<Option<Vec<u8>>, String> {
    // 从数据库获取封面
    let cover_result = state.db
        .lock()
        .unwrap()
        .get_cover(&book_id)
        .map_err(|e| e.to_string())?;
    
    Ok(cover_result.map(|(data, _)| data))
}

// #[command]
// async fn delete_book(
//     state: State<'_, AppState>,
//     book_id: String
// ) -> Result<(), String> {
//     let db = state.db.lock().unwrap();
    
//     // 删除书籍文件
//     if let Some(book) = db.get_book_by_id(&book_id).map_err(|e| e.to_string())? {
//         let book_path = Path::new(&book.file_path);
//         if book_path.exists() {
//             fs::remove_file(book_path).map_err(|e| e.to_string())?;
//         }
//     }

//     // 删除数据库记录（会通过外键约束自动删除封面）
//     db.delete_book(&book_id).map_err(|e| e.to_string())?;

//     Ok(())
// }

pub fn run() {
    fs::create_dir_all("./uploadBooks").expect("Failed to create directory");

    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(Database::new("books.db").unwrap()),
        })
        .invoke_handler(tauri::generate_handler![
            save_book,
            get_cover,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
