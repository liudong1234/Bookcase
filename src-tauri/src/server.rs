// src-tauri/src/main.rs
use std::fs::File;
// use std::path::PathBuf;
use crate::get_appdata_dir;
use multipart::server::Multipart;
use std::thread;
use tiny_http::Header;
use tiny_http::{Method, Request, Response, Server};

pub fn start_http_server() {
    let upload_dir = get_appdata_dir().to_string_lossy().to_string();

    thread::spawn(move || {
        let server = Server::http("0.0.0.0:8080").unwrap();
        for mut request in server.incoming_requests() {
            match (request.method(), request.url()) {
                (&Method::Get, "/upload.html") => {
                    let html = std::fs::read_to_string("E:/tauri/Bookcase/upload.html").unwrap();
                    let response = Response::from_string(html).with_header(
                        Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap(),
                    );
                    let _ = request.respond(response);
                }
                (&Method::Post, "/upload") => {
                    // Extract filename from Content-Disposition header if available
                    let mut filename = "default_file".to_string();

                    let boundary = match request
                        .headers()
                        .iter()
                        .find(|h| h.field.equiv("Content-Type"))
                        .and_then(|h| {
                            let value = h.value.as_str();
                            if let Some(idx) = value.find("boundary=") {
                                Some(value[idx + 9..].to_string())
                            } else {
                                None
                            }
                        }) {
                        Some(b) => b,
                        None => {
                            let _ = request.respond(
                                Response::from_string("Missing boundary").with_status_code(400),
                            );
                            return;
                        }
                    };
                    let mut multipart = Multipart::with_body(request.as_reader(), boundary);
                    let mut saved = false;

                    if let Err(err) = multipart.foreach_entry(|mut entry| {
                        if let Some(name) = &entry.headers.filename {
                            println!("Saving uploaded file: {}", name);
                            let safe_filename =
                                name.replace("..", "").replace("/", "_").replace("\\", "_");

                            let file_path = format!("{}/{}", upload_dir, safe_filename);

                            match File::create(&file_path) {
                                Ok(mut file) => match std::io::copy(&mut entry.data, &mut file) {
                                    Ok(size) => {
                                        println!("Saved {} bytes to {}", size, file_path);
                                        saved = true;
                                    }
                                    Err(e) => {
                                        eprintln!("Error writing to file: {}", e);
                                    }
                                },
                                Err(e) => {
                                    eprintln!("Error creating file: {}", e);
                                }
                            }
                        }
                    }) {
                        let _ = request.respond(
                            Response::from_string(format!("Upload error: {}", err))
                                .with_status_code(500),
                        );
                        return;
                    }

                    if saved {
                        let response = Response::from_string("上传成功！");
                        let _ = request.respond(response);
                    } else {
                        let response =
                            Response::from_string("没有有效的文件被上传").with_status_code(400);
                        let _ = request.respond(response);
                    }
                }
                _ => {
                    let response = Response::from_string("404 Not Found").with_status_code(404);
                    let _ = request.respond(response);
                }
            }
        }
    });
}
