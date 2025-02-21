#[cfg_attr(mobile, tauri::mobile_entry_point)]
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use tauri::{command, State};

// 定义文件信息结构
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    pub name: String,
    pub content: String,
    pub size: u64,
}

// 定义应用状态
pub struct AppState {
    pub last_file: Mutex<Option<FileInfo>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            last_file: Mutex::new(None),
        }
    }

    // 修复：确保函数返回 Result<FileInfo, String>
    pub fn process_file(
        &self,
        file_content: String,
        file_name: String,
    ) -> Result<FileInfo, String> {
        let file_info = FileInfo {
            name: file_name.clone(),
            content: file_content.clone(),
            size: file_content.len() as u64,
        };

        // 使用 let 语句处理锁的获取
        let mut last_file = self.last_file.lock().map_err(|e| e.to_string())?;
        *last_file = Some(file_info.clone());

        // 写入文件并返回文件信息
        fs::write(format!("./uploadBooks/{}", file_name), file_content)
            .map_err(|e| e.to_string())?;

        Ok(file_info)
    }

    pub fn get_last_file(&self) -> Option<FileInfo> {
        self.last_file.lock().unwrap().clone()
    }
}

// Tauri 命令处理函数
#[command]
async fn process_file(
    file_content: String,
    file_name: String,
    state: State<'_, AppState>,
) -> Result<FileInfo, String> {
    state.process_file(file_content, file_name)
}

#[command]
fn get_last_file(state: State<'_, AppState>) -> Option<FileInfo> {
    state.get_last_file()
}

pub fn run() {
    fs::create_dir_all("./uploadBooks").expect("Failed to create directory");

    tauri::Builder::default()
        .manage(AppState {
            last_file: Mutex::new(None),
        }).invoke_handler(tauri::generate_handler![process_file, get_last_file])
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
