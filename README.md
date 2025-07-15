# Devourer (Reader)

A client designed to help manage and read your books, manga and comics.

### Features

- Handles both remote and local files via providers.
- Has the ability to edit metadata.
- SQLite powered storage.
- Supports libraries and collections. A library at the top level is either a collection of "books" or "comics"; a collection exists within this.
- Supports Windows, Linux, Mac, iOS and Android.

### Manga / Comic Features

- Supports .zip, .cbz, .rar and .cbr archives. More formats to follow shortly (such as folders of images and 7zip).

Note: .rar and .cbr files are currently unsupported on Android builds.

### Book Features

- Supports EPUB and PDF currently. More formats to follow shortly.
- Support for OPDS 1.2.

### Binary Releases

[Releases page](https://github.com/ethereal-squirrel/devourer-reader-client/releases)

### Manual Install

- Ensure you have Node.js installed.
- Ensure you have Rust installed.
- Clone this repository and cd into the folder.
- Install Dependencies: npm i
- To Run: npm run tauri dev