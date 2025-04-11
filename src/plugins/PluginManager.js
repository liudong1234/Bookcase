// src/plugins/PluginManager.js
import { exists, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { BaseDirectory, join } from '@tauri-apps/api/path';
import { invoke } from "@tauri-apps/api/core";
import { directory } from "../utils/Tool";
class PluginManager {
  constructor() {
    this.themes = [];
    this.translations = {};
  }
 
  
  async loadPlugins() {
    try {

      await invoke('create_plugindir');
      let plugins = directory+'/plugins';
      const pluginsDir = await readDir(plugins);
      for (const entry of pluginsDir) {
        const configPath = `${plugins}/${entry.name}/plugin.json`;
        const config = JSON.parse(await readTextFile(configPath));
        
        // 动态加载插件入口文件
        const pluginCode = await readTextFile(`${plugins}/${entry.name}/${config.main}`);
        const module = { exports: {} };
        const fn = new Function('module', 'exports', `
          ${pluginCode}
          return module.exports;
        `);

        // 执行代码并获取导出的对象
        const plugin = fn(module, module.exports);

        // 初始化插件
        plugin.install({
          registerTheme: (theme) => this.themes.push(theme),
          addTranslation: (lang, data) => {
            this.translations[lang] = { ...this.translations[lang], ...data };
          }
        });
      }
    } catch (error) {
      console.error('插件加载失败:', error);
    }
  }
}

export const pluginManager = new PluginManager();