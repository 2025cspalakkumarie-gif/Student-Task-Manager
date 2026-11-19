from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "tasks.db")


# ---------------- DATABASE ----------------

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            priority TEXT,
            dueDate TEXT,
            description TEXT,
            completed INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


# ---------------- HOME ----------------

@app.route("/")
def home():
    return "Student Task Manager Backend is Running!"


# ---------------- GET ALL TASKS ----------------

@app.route("/tasks", methods=["GET"])
def get_tasks():

    conn = get_db()

    tasks = conn.execute(
        "SELECT * FROM tasks ORDER BY id DESC"
    ).fetchall()

    conn.close()

    result = []

    for task in tasks:
        result.append({
            "id": task["id"],
            "title": task["title"],
            "category": task["category"],
            "priority": task["priority"],
            "dueDate": task["dueDate"],
            "description": task["description"],
            "completed": bool(task["completed"])
        })

    return jsonify(result)


# ---------------- ADD TASK ----------------

@app.route("/tasks", methods=["POST"])
def add_task():

    data = request.get_json()

    title = data.get("title")
    category = data.get("category")
    priority = data.get("priority")
    dueDate = data.get("dueDate")
    description = data.get("description")
    completed = data.get("completed", False)

    if not title:
        return jsonify({
            "error": "Title is required"
        }), 400

    conn = get_db()

    cursor = conn.execute("""
        INSERT INTO tasks
        (title, category, priority, dueDate, description, completed)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        title,
        category,
        priority,
        dueDate,
        description,
        int(completed)
    ))

    conn.commit()

    task_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "message": "Task added successfully",
        "id": task_id
    }), 201


# ---------------- UPDATE TASK ----------------

@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    conn = get_db()

    existing = conn.execute(
        "SELECT * FROM tasks WHERE id = ?",
        (task_id,)
    ).fetchone()

    if not existing:
        conn.close()

        return jsonify({
            "error": "Task not found"
        }), 404

    title = data.get("title", existing["title"])
    category = data.get("category", existing["category"])
    priority = data.get("priority", existing["priority"])
    dueDate = data.get("dueDate", existing["dueDate"])
    description = data.get("description", existing["description"])
    completed = data.get("completed", bool(existing["completed"]))

    conn.execute("""
        UPDATE tasks
        SET title = ?,
            category = ?,
            priority = ?,
            dueDate = ?,
            description = ?,
            completed = ?
        WHERE id = ?
    """, (
        title,
        category,
        priority,
        dueDate,
        description,
        int(completed),
        task_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Task updated successfully"
    })


# ---------------- DELETE TASK ----------------

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    conn = get_db()

    cursor = conn.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    conn.commit()

    if cursor.rowcount == 0:
        conn.close()

        return jsonify({
            "error": "Task not found"
        }), 404

    conn.close()

    return jsonify({
        "message": "Task deleted successfully"
    })


# ---------------- RUN SERVER ----------------

if __name__ == "__main__":
    init_db()
   app.run(host="0.0.0.0", port=5000, debug=False)
