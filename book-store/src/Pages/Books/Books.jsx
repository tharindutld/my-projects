import "./Books.css";
import BookCard from "../../Components/BookCard/BookCard";
import { useState } from "react";
import { books } from "../../../src/Data/books";

function Books() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || book.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="books-container">
      <h2>Browse Books</h2>

      <div className="filter-section">
        <input
          type="text"
          placeholder="Search books or authors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>
          <option>Novel</option>
          <option>Education</option>
          <option>History</option>
          <option>Kids</option>
        </select>
      </div>

      <div className="books-grid">
        {filteredBooks.map((item) => (
          <BookCard
            key={item.id}
            title={item.title}
            author={item.author}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </div>
  );
}

export default Books;
