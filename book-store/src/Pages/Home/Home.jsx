import "./Home.css";
import BookCard from "../../Components/BookCard/BookCard";
import { books } from "../../../src/Data/books";

function Home() {
  return (
    <div className="home-container">
      <h1>Online Book Store</h1>
      <div className="book-list">
        {books.map((item) => (
          <BookCard className="book-card"
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

export default Home;
