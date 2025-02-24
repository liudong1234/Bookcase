use rusqlite::{Connection, Result};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Book {
  pub id: String,
  pub name: String,
  pub size: u64,
  pub file_type: String,
  pub last_modified: u64,
  pub metadata: BookMetadata,
  pub file_path: String,
  pub has_cover: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BookMetadata {
  pub title: Option<String>,
  pub cover: Option<String>,
}

#[warn(dead_code)]
pub struct Database {
  conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
      let conn = Connection::open(db_path)?;

      //创建书籍表
      conn.execute("create table if not exists books(
        id text primary key,
        name text not null,
        size integer not null,
        file_type text not null,
        last_modified integer not null,
        file_path text not null,
        has_cover boolean not null default 0
      )", [])?;

      // 创建封面表
      conn.execute("create table if not exists covers (
        book_id text primary key,
        data blob not null,
        mime_type text not null,
        created_at integer not null,
        froeign key(book_id) references books(id) on delete cascade
      )",[])?;

      Ok(Database {conn})
    }

    pub fn save_book(&mut self, book: &Book, cover_data: Option<(&[u8], &str)>) -> Result<()> {
      //开始事务
      let tx = self.conn.transaction()?;
      //保存书籍信息
      tx.execute("insert or replace into books(
        id, name, size, file_type, last_modified, metadata, file_path, has_cover
      ) values(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)", (
        &book.id,
        &book.name,
        book.size,
        &book.file_type,
        book.last_modified,
        serde_json::to_string(&book.metadata).map_err(|e| {
          rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e),
        )
        })?,
        &book.file_path,
        cover_data.is_some(),
      ),)?;

      // 如果有封面数据，保存封面
      if let Some((cover_bytes, mime_type)) = cover_data {
          tx.execute("insert or replace into covers (
            book_id, data, mime_type, created_at) values(
            ?1, ?2, ?3, ?4)", (
              &book.id,
              cover_bytes,
              mime_type,
              chrono::Utc::now().timestamp(),
            ))?;
      }
      //提交事务
      tx.commit()?;
      Ok(())
    }

    pub fn get_cover(&self, book_id: &str) -> Result<Option<(Vec<u8>, String)>> {
      let mut stmt = self.conn.prepare(
        "select data, mime_type from covers where book_id = ?1"
      )?;

      let mut rows = stmt.query([book_id])?;
      if let Some(row) = rows.next()? {
        Ok(Some((row.get(0)?, row.get(1)?)))
      }else {
        Ok(None)
      }
    }

    pub fn delete_cover(&self, book_id: &str) -> Result<()> {
      self.conn.execute("delete from covers where book_id = ?1", [book_id])?;

      self.conn.execute("update books set has_cover = 0 where id = ?1", [book_id])?;
      Ok(())
    }

    pub fn get_books(&self) -> Result<Vec<Book>> {
      let mut stmt = self.conn.prepare(
        "select id, name, size, file_type, last_modified, metadata, file_path, has_cover from books"
      )?;

      let books = stmt.query_map([], |row| {
        let metadata_str: String = row.get(5)?;
        let metadata: BookMetadata = serde_json::from_str(&metadata_str)
        .map_err(|e| {
          rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e),
        )
        })?;

        Ok(Book {
          id: row.get(0)?,
          name: row.get(1)?,
          size: row.get(2)?,
          file_type: row.get(3)?,
          last_modified: row.get(4)?,
          metadata,
          file_path: row.get(6)?,
          has_cover: row.get(7)?,
        })
      })?;
      books.collect()
    }

    pub fn delete_books(&self, book_id: &str) -> Result<()> {
      self.conn.execute("delete from books where book_id = ?1", [book_id])?;
      Ok(())
    }

  }


