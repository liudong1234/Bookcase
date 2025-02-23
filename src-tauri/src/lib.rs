#[cfg_attr(mobile, tauri::mobile_entry_point)]
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use tauri::{command, State};
// 定义文件信息结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    pub name: String,
    pub content: String,
    pub size: u64,
    pub path: String,
}

// 定义应用状态
pub struct AppState {
    pub last_file: Mutex<Option<FileInfo>>,
    pub last_file_path: Mutex<Option<String>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            last_file: Mutex::new(None),
            last_file_path: Mutex::new(None),
        }
    }

    pub fn upload_file_chunk(
        &self,
        chunk: Vec<u8>,
        file_name: String,
        chunk_index: usize,
        total_chunks: usize,
    ) -> Result<(), String> {
        let dir_path = "./uploadBooks/tmp/"; // 建议改为绝对路径（见下文优化）
        let file_path = format!("{}{}", dir_path, file_name);

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
            let source = Path::new(&file_path);

            // 获取父目录
            if let Some(parent) = source.parent() {
                // 计算目标路径，即文件移动到父目录
                let destination = parent
                    .parent()
                    .unwrap_or(parent)
                    .join(source.file_name().unwrap());

                // 执行移动操作
                fs::rename(source, &destination).map_err(|e| format!("移动文件失败: {}", e))?;
                // 保存最终路径
                let final_path = destination.to_string_lossy().to_string();
                *self.last_file_path.lock().unwrap() = Some(final_path);
            }
        }

        Ok(())
    }
    pub fn get_last_file_path(&self) -> Option<String> {
        self.last_file_path.lock().unwrap().clone()
    }

    pub fn get_last_file(&self) -> Option<FileInfo> {
        self.last_file.lock().unwrap().clone()
    }
}

// Tauri 命令处理函数
#[command]
async fn upload_file_chunk(
    chunk: Vec<u8>,
    file_name: String,
    chunk_index: usize,
    total_chunks: usize,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.upload_file_chunk(chunk, file_name, chunk_index, total_chunks)
}

#[command]
fn get_last_file(state: State<'_, AppState>) -> Option<FileInfo> {
    state.get_last_file()
}

#[command]
fn get_last_file_path(state: State<'_, AppState>) -> Option<String> {
    state.get_last_file_path()
}

pub fn run() {
    fs::create_dir_all("./uploadBooks").expect("Failed to create directory");

    tauri::Builder::default()
        .manage(AppState {
            last_file: Mutex::new(None),
            last_file_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            upload_file_chunk, 
            get_last_file,
            get_last_file_path,
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
