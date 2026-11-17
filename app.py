from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)


def get_db_connection():
    conn = sqlite3.connect("tasks.db")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            completed INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


@app.route("/")
def home():
    return "Student Task Manager Backend is Running!"


@app.route("/tasks", methods=["GET"]) #Read the tasks
def get_tasks():

    conn = get_db_connection()

    tasks = conn.execute(
        "SELECT * FROM tasks"
    ).fetchall()

    conn.close()

    return jsonify([
        {
            "id": task["id"],
            "name": task["name"],
            "completed": bool(task["completed"])
        }
        for task in tasks
    ])


@app.route("/tasks", methods=["POST"]) #Create the tasks
def add_task():

    data = request.get_json()

    name = data.get("name")

    if not name:
        return jsonify({"error": "Task name is required"}), 400

    conn = get_db_connection()

    cursor = conn.execute(
        "INSERT INTO tasks (name, completed) VALUES (?, ?)",
        (name, 0)
    )

    conn.commit()

    task_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "id": task_id,
        "name": name,
        "completed": False
    }), 201

 #Updates the tasks
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json()

    name = data.get("name")
    completed = data.get("completed")

    if name is None and completed is None:
        return jsonify({"error": "No update data provided"}), 400

    conn = get_db_connection()

    task = conn.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone()

    if task is None:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    if name is not None:
        conn.execute(
            "UPDATE tasks SET name = ? WHERE id = ?",
            (name, task_id)
        )

    if completed is not None:
        conn.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?",
            (int(bool(completed)), task_id)
        )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Task updated successfully"
    }), 200


@app.route("/tasks/<int:task_id>", methods=["DELETE"])#Deletes the tasks
def delete_task(task_id):

    conn = get_db_connection()

    conn.execute(
        "DELETE FROM tasks WHERE id = ?",
        (task_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Task deleted successfully"
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True)