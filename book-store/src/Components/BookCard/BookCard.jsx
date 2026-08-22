import "./BookCard.css";

function BookCard({ title, author, price, image }) {
  return (
    <div className="book-card">
      <img src={image} alt={title} className="book-image" />
      <h3>{title}</h3>
      <p>{author}</p>
      <span className="price">${price}</span>
      <button className="btn">View Details</button>
    </div>
  );
}

export default BookCard;
