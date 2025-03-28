use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Book {
    pub id: String,
    pub name: String,
    pub size: u64,
    pub file_type: String,
    pub last_modified: u64,
    pub file_path: String,
    pub has_cover: bool,
}

#[warn(dead_code)]
pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        //创建书籍表
        conn.execute(
            "create table if not exists books(
        id text primary key,
        name text not null,
        size integer not null,
        file_type text not null,
        last_modified integer not null,
        file_path text not null,
        has_cover boolean not null default 0
      )",
            [],
        )?;

        // 创建封面表
        conn.execute(
            "create table if not exists covers (
        book_id text primary key,
        mime_type text not null,
        foreign key(book_id) references books(id) on delete cascade
      )",
            [],
        )?;

        Ok(Database { conn })
    }

    pub fn get_book_by_id(&self, book_id: &str) -> Result<Option<Book>> {
        let mut stmt = self.conn.prepare(
        "select id, name, size, file_type, last_modified, metadata, file_path, has_cover from books where id=?1"
      )?;

        let mut books = stmt.query_map([book_id], |row| {
            Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                size: row.get(2)?,
                file_type: row.get(3)?,
                last_modified: row.get(4)?,
                file_path: row.get(5)?,
                has_cover: row.get(6)?,
            })
        })?;
        Ok(books.next().transpose()?)
    }

    pub fn get_books(&self) -> Result<Vec<Book>> {
        let mut stmt = self.conn.prepare(
            "select id, name, size, file_type, last_modified, file_path, has_cover from books",
        )?;

        let books = stmt.query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                size: row.get(2)?,
                file_type: row.get(3)?,
                last_modified: row.get(4)?,
                file_path: row.get(5)?,
                has_cover: row.get(6)?,
            })
        })?;
        books.collect()
    }

    pub fn get_cover(&self, book_id: &str) -> Result<Option<String>> {
        let mut stmt = self
            .conn
            .prepare("select mime_type from covers where book_id = ?1")?;

        let mut rows = stmt.query([book_id])?;
        if let Some(row) = rows.next()? {
            Ok(row.get(0)?)
        } else {
            Ok(None)
        }
    }

    pub fn save_cover(&mut self, id: &str, cover_type: String) -> Result<()> {
        let tx = self.conn.transaction()?;
        if !cover_type.is_empty() {
            tx.execute(
                "insert or replace into covers (
          book_id, mime_type) values(
          ?1, ?2)",
                (&id, &cover_type),
            )?;
        }
        tx.commit()?;
        Ok(())
    }

    pub fn save_book(&mut self, book: &Book) -> Result<()> {
        //开始事务
        let tx = self.conn.transaction()?;
        //保存书籍信息
        tx.execute(
            "insert or replace into books(
        id, name, size, file_type, last_modified, file_path, has_cover
      ) values(?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            (
                &book.id,
                &book.name,
                book.size,
                &book.file_type,
                book.last_modified,
                &book.file_path,
                book.has_cover,
            ),
        )?;
        //提交事务
        tx.commit()?;
        Ok(())
    }

    pub fn delete_cover(&self, book_id: &str) -> Result<()> {
        self.conn
            .execute("delete from covers where book_id = ?1", [book_id])?;

        self.conn
            .execute("update books set has_cover = 0 where id = ?1", [book_id])?;
        Ok(())
    }

    pub fn delete_book(&self, book_id: &str) -> Result<()> {
        self.conn
            .execute("delete from books where id = ?1", [book_id])?;
        Ok(())
    }
}
