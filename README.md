# TaskBoard

Simple internal web application for tracking project tasks and notes.

## Features

- View list of projects
- View tasks for a project (status and notes)
- Open a task to see details and update status or notes
- Data is stored locally in a SQLite database

## Requirements

- Node.js 18 or higher
- npm

## Installation

```bash
cd taskboard
npm install
```

## Running

```bash
npm start
```

Then open http://localhost:3000 in your browser.

The application will create `taskboard.db` on first run with sample projects and tasks.

## Usage

1. Select a project from the list.
2. Click a task to view and edit its status and notes.
3. Click Save changes.
4. Use the back buttons to navigate.

All data is synthetic and for demonstration.

## Notes

This is a small single-process application. Restarting the server reloads data from the database file.# TaskBoard
