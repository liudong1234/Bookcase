use std::fs;
use directories::BaseDirs;

pub fn create_plugindir() ->Result<(), String> {
   if let Some(user_dirs) = BaseDirs::new() {
    let data_dir = user_dirs.data_dir();
    let desc_dir = data_dir.join("plugins");
    fs::create_dir_all(desc_dir).map_err(|e| format!("创建插件目录失败: {}", e))?;

  }
  Ok(())
}