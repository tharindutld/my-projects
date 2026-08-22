import "./BookDetails.css";
import { useParams } from "react-router-dom";
import { books } from "../../../src/Data/books";

function BookDetails() {
  const { id } = useParams();
  const book = books.find((b) => b.id === Number(id));

  if (!book) return <h2>Book Not Found</h2>;

  return (
    <div className="details-container">
      <img src={book.image} alt={book.title} className="details-image" />

      <div className="details-info">
        <h1>{book.title}</h1>
        <h3>By {book.author}</h3>
        <p className="price">$ {book.price}</p>
        <p className="description">{book.description}</p>

        <button className="btn">Add to Cart</button>
      </div>
    </div>
  );
}

export default BookDetails;
