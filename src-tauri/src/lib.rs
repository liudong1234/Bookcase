#[cfg_attr(mobile, tauri::mobile_entry_point)]
mod db;
mod server;


use server::start_http_server;
use db::{Book, Database};
use directories::{BaseDirs, ProjectDirs};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{command, State};
struct AppState {
    db: Mutex<Database>,
}

pub fn get_appdata_dir() -> PathBuf {
    let proj_dirs = ProjectDirs::from("com", "", "Bookcase").expect("未找到应用程序目录");
    proj_dirs.data_dir().to_path_buf()
}

#[command]
async fn save_book(book_data: Book, state: State<'_, AppState>) -> Result<(), String> {
    state
        .db
        .lock()
        .unwrap()
        .save_book(&book_data)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
async fn save_cover(
    book_id: &str,
    cover_type: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .db
        .lock()
        .unwrap()
        .save_cover(&book_id, cover_type)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
async fn get_cover(book_id: String, state: State<'_, AppState>) -> Result<Option<String>, String> {
    // 从数据库获取封面
    let cover_result = state
        .db
        .lock()
        .unwrap()
        .get_cover(&book_id)
        .map_err(|e| e.to_string())?;

    Ok(cover_result)
}

#[command]
async fn collect_book(book_id: String, fav: bool, state: State<'_, AppState>) -> Result<(), String> {
    let collect_result = state
        .db
        .lock()
        .unwrap()
        .update_favbook(&book_id, fav)
        .map_err(|e| e.to_string())?;
    Ok(collect_result)
}

#[command]
async fn delete_book(book_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .db
        .lock()
        .unwrap()
        .delete_book(&book_id)
        .map_err(|e| e.to_string())?;

    state
        .db
        .lock()
        .unwrap()
        .delete_cover(&book_id)
        .map_err(|e| e.to_string())?;

    // 删除本地文件夹中的书籍和封面(在同一个文件夹)
    let path = get_appdata_dir().to_string_lossy().to_string();
    let file_path = format!("{}\\{}", path, book_id);
    let book_path = Path::new(&file_path);
    if book_path.exists() {
        fs::remove_dir_all(book_path)
            .map_err(|e| {
                print!("{}", e.to_string());
                e.to_string()
            })
            .expect_err("删除目录失败");
    }

    Ok(())
}

#[command]
async fn get_books(state: State<'_, AppState>) -> Result<Vec<Book>, String> {
    state
        .db
        .lock()
        .unwrap()
        .get_books()
        .map_err(|e| e.to_string())
}

#[command]
async fn get_book(book_id: String, state: State<'_, AppState>) -> Result<Option<Book>, String> {
    state
        .db
        .lock()
        .unwrap()
        .get_book_by_id(&book_id)
        .map_err(|e| e.to_string())
}

#[command]
fn upload_file_chunk(
    chunk: Vec<u8>,
    id: String,
    file_name: String,
    chunk_index: usize,
    total_chunks: usize,
) -> Result<String, String> {
    let path = get_appdata_dir().to_string_lossy().to_string();
    let dir_path = path.clone() + "\\tmp"; // 建议改为绝对路径（见下文优化）
    let file_path = format!("{}\\{}", dir_path, file_name);
    // 创建目录（如果不存在）
    fs::create_dir_all(dir_path).map_err(|e| format!("创建目录失败: {}", e))?;

    // 打开文件（追加模式）
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| format!("打开文件失败: {}", e))?;
    file.write_all(&chunk).map_err(|e| e.to_string())?;

    if chunk_index == total_chunks - 1 {
        // 计算目标路径，即文件移动到父目录
        let destination_path = format!("{}\\{}", path, id);
        let destination = format!("{}\\{}", destination_path, file_name);
        fs::create_dir_all(&destination_path).map_err(|e| format!("创建目录失败: {}", e))?;
        // 执行移动操作
        fs::rename(&file_path, &destination).map_err(|e| format!("移动文件失败: {}", e))?;
        // 保存最终路径
        return Ok(file_name);
    }
    Ok("".to_string())
}

#[command]
fn create_plugindir() -> Result<bool, String> {
    if let Some(app_dirs) = BaseDirs::new() {
        let data_dir = app_dirs.data_dir();
        let desc_dir = (data_dir.join("Bookcase")).join("plugins");
        fs::create_dir_all(desc_dir).map_err(|e| format!("创建插件目录失败: {}", e))?;

        
    }
    Ok(true)
}

#[command]
fn upload_bg_img(pic: Vec<u8>, file_name: &str) -> Result<bool, String> {
    if let Some(app_dirs) = BaseDirs::new() {
        let data_dir = app_dirs.data_dir();
        let desc_dir = (data_dir.join("Bookcase")).join("background");
        fs::create_dir_all(&desc_dir).map_err(|e| format!("创建背景目录失败: {}", e))?;
        let file_path = format!("{}\\{}", desc_dir.to_string_lossy().to_string(), file_name);

        let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| format!("打开文件失败: {}", e))?;
        file.write_all(&pic).map_err(|e| e.to_string())?;

    }
    Ok(true)
}

pub fn run() {
    start_http_server();
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            db: Mutex::new(Database::new("books.db").unwrap()),
        })
        .invoke_handler(tauri::generate_handler![
            save_book,
            save_cover,
            get_book,
            get_books,
            get_cover,
            delete_book,
            upload_file_chunk,
            create_plugindir,
            upload_bg_img,
            collect_book,
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
