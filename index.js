import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function getCoverUrl(isbn) {
  if (!isbn) return "https://via.placeholder.com/150x220?text=No+Cover";
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

app.get("/", async (req, res) => {
  try {
    const sort = req.query.sort || "date_read";
    let orderBy = "date_read DESC";

    if (sort === "rating") orderBy = "rating DESC";
    if (sort === "title") orderBy = "title ASC";

    const result = await db.query(`SELECT * FROM books ORDER BY ${orderBy}`);

    res.render("index.ejs", {
      books: result.rows,
      getCoverUrl: getCoverUrl,
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading books.");
  }
});

app.post("/add", async (req, res) => {
  const { title, author, isbn, rating, review, date_read } = req.body;

  try {
    await db.query(
      "INSERT INTO books (title, author, isbn, rating, review, date_read) VALUES ($1, $2, $3, $4, $5, $6)",
      [title, author, isbn, rating, review, date_read]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error adding book.");
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.id;

  try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error deleting book.");
  }
});

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
    res.render("edit.ejs", { book: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.send("Error loading edit page.");
  }
});

app.post("/update", async (req, res) => {
  const { id, title, author, isbn, rating, review, date_read } = req.body;

  try {
    await db.query(
      "UPDATE books SET title=$1, author=$2, isbn=$3, rating=$4, review=$5, date_read=$6 WHERE id=$7",
      [title, author, isbn, rating, review, date_read, id]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error updating book.");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});