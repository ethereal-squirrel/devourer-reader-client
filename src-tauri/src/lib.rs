use serde_json;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use tauri_plugin_http::reqwest::Client;
use tauri_plugin_sql::{Migration, MigrationKind};
#[cfg(not(target_os = "android"))]
use unrar::Archive as UnrarArchive;
use zip::ZipArchive;

#[tauri::command]
async fn download_file(
    url: &str,
    path: &str,
    token: Option<String>,
    mode: Option<String>,
    target: Option<String>,
) -> Result<(), String> {
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("Client build error: {}", e))?;

    let request = if mode.as_deref() == Some("dropbox") {
        let dropbox_arg = serde_json::json!({ "path": target.unwrap_or_default() }).to_string();
        let auth_token = token.unwrap_or_default();

        client
            .post(url)
            .header("Authorization", format!("Bearer {}", auth_token))
            .header("Dropbox-API-Arg", dropbox_arg)
    } else {
        let mut request = client.get(url);
        if let Some(token_value) = token {
            request = request.header("Authorization", format!("Bearer {}", token_value));
        }
        request
    };

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response
            .text()
            .await
            .unwrap_or_else(|_| "Could not read error response".to_string());
        return Err(format!(
            "Failed to download file: HTTP {} - Response: {}",
            status, error_body
        ));
    }

    let mut file = File::create(path).map_err(|e| format!("File creation error: {}", e))?;
    let content = response
        .bytes()
        .await
        .map_err(|e| format!("Reading response error: {}", e))?;
    file.write_all(&content)
        .map_err(|e| format!("File write error: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn unzip_file(path: &str, destination: &str) -> Result<(), String> {
    let mut archive =
        ZipArchive::new(File::open(path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = Path::new(destination).join(file.name());

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = out_path.parent() {
                std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg(not(target_os = "android"))]
#[tauri::command]
async fn unrar_file(path: &str, destination: &str) -> Result<(), String> {
    println!("path: {}", path);
    println!("destination: {}", destination);

    let archive = UnrarArchive::new(path);
    let mut open_archive = archive.open_for_processing().map_err(|e| e.to_string())?;

    while let Some(header) = open_archive.read_header().map_err(|e| e.to_string())? {
        let filename = header.entry().filename.to_string_lossy();
        let out_path = Path::new(destination).join(filename.as_ref());

        println!("Processing: {}", filename);

        if header.entry().is_file() {
            if let Some(p) = out_path.parent() {
                std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
            }
            open_archive = header.extract_to(&out_path).map_err(|e| e.to_string())?;
            println!("Extracted file: {}", out_path.display());
        } else {
            std::fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            open_archive = header.skip().map_err(|e| e.to_string())?;
            println!("Created directory: {}", out_path.display());
        }
    }

    Ok(())
}

#[cfg(target_os = "android")]
#[tauri::command]
async fn unrar_file(_path: &str, _destination: &str) -> Result<(), String> {
    Err("RAR extraction not supported on Android".to_string())
}

#[tauri::command]
async fn get_files_in_directory(path: &str) -> Result<Vec<String>, String> {
    fn collect_files(dir: &Path, base_path: &Path, files: &mut Vec<String>) -> Result<(), String> {
        let entries =
            std::fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.is_file() {
                if let Ok(relative_path) = path.strip_prefix(base_path) {
                    if let Some(path_str) = relative_path.to_str() {
                        files.push(path_str.to_string());
                    }
                }
            } else if path.is_dir() {
                collect_files(&path, base_path, files)?;
            }
        }
        Ok(())
    }

    let base_path = Path::new(path);
    let mut files = Vec::new();
    collect_files(base_path, base_path, &mut files)?;
    files.sort();
    Ok(files)
}

#[tauri::command]
async fn zip_summary(
    file_name: &str,
    path: &str,
    unzip_path: &str,
) -> Result<(i32, Option<String>), String> {
    println!("file_name: {}", file_name);
    println!("path: {}", path);
    println!("unzip_path: {}", unzip_path);

    let mut archive =
        ZipArchive::new(File::open(path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;

    let mut image_count = 0;
    let mut first_image: Option<String> = None;

    let mut image_names: Vec<String> = Vec::new();

    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_lowercase();

        if name.ends_with(".jpg")
            || name.ends_with(".jpeg")
            || name.ends_with(".png")
            || name.ends_with(".webp")
            || name.ends_with(".bmp")
        {
            image_count += 1;
            image_names.push(file.name().to_string());
        }
    }

    image_names.sort();

    if let Some(first_image_name) = image_names.first() {
        let mut file = archive
            .by_name(first_image_name)
            .map_err(|e| e.to_string())?;

        let extension = Path::new(first_image_name)
            .extension()
            .and_then(|ext| ext.to_str())
            .ok_or_else(|| "Invalid file extension".to_string())?;

        let new_file_name = format!("{}.{}", file_name, extension);
        let out_path = Path::new(unzip_path).join(&new_file_name);

        if let Some(p) = out_path.parent() {
            std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
        }

        let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
        std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;

        first_image = Some(new_file_name);
    }

    Ok((image_count, first_image))
}

#[tauri::command]
async fn create_folder(path: &str) -> Result<(), String> {
    std::fs::create_dir_all(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn remove_folder(path: &str) -> Result<(), String> {
    std::fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: r#"
                -- Create Config table
                CREATE TABLE Config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL
                );

                -- Create Library table
                CREATE TABLE Library (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    path TEXT UNIQUE NOT NULL,
                    type TEXT NOT NULL,
                    server TEXT NOT NULL
                );

                -- Create BookFile table
                CREATE TABLE BookFile (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    path TEXT UNIQUE NOT NULL,
                    file_name TEXT NOT NULL,
                    file_format TEXT NOT NULL,
                    total_pages INTEGER NOT NULL,
                    current_page TEXT NOT NULL,
                    is_read BOOLEAN NOT NULL,
                    library_id INTEGER NOT NULL,
                    metadata TEXT NOT NULL,
                    server TEXT NOT NULL
                );

                -- Create MangaSeries table
                CREATE TABLE MangaSeries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    series_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    path TEXT UNIQUE NOT NULL,
                    cover TEXT NOT NULL,
                    library_id INTEGER NOT NULL,
                    manga_data TEXT NOT NULL,
                    server TEXT NOT NULL
                );

                -- Create MangaFile table
                CREATE TABLE MangaFile (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_id INTEGER NOT NULL,
                    path TEXT UNIQUE NOT NULL,
                    file_name TEXT NOT NULL,
                    file_format TEXT NOT NULL,
                    volume INTEGER NOT NULL,
                    chapter INTEGER NOT NULL,
                    total_pages INTEGER NOT NULL,
                    current_page INTEGER NOT NULL,
                    is_read BOOLEAN NOT NULL,
                    series_id INTEGER NOT NULL,
                    metadata TEXT NOT NULL,
                    server TEXT NOT NULL
                );

                -- Create RecentlyRead table
                CREATE TABLE RecentlyRead (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    is_local BOOLEAN NOT NULL,
                    library_id INTEGER NOT NULL,
                    series_id INTEGER NOT NULL,
                    file_id INTEGER NOT NULL,
                    current_page INTEGER NOT NULL,
                    total_pages INTEGER NOT NULL,
                    volume INTEGER NOT NULL,
                    chapter INTEGER NOT NULL
                );

                -- Create Collection table
                CREATE TABLE Collection (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    library_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    series TEXT NOT NULL
                );

                -- Create Zustand table
                CREATE TABLE zustand (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL
                );

                -- Create Cache table
                CREATE TABLE cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL
                );
            "#,
        kind: MigrationKind::Up,
    }];

    let mut builder = tauri::Builder::default();
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            // when defining deep link schemes at runtime, you must also check `argv` here
          }));
    }
    
    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:devourer.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            unzip_file,
            unrar_file, // Available on all platforms, but returns error on Android
            create_folder,
            remove_folder,
            zip_summary,
            get_files_in_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
