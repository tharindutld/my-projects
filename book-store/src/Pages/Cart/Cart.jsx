import "./Cart.css";
import { useState } from "react";

function Cart() {
  const [cart, setCart] = useState([
    { id: 1, title: "Sample Book", price: 20, qty: 1, image: "/img1.jpg" }
  ]);

  const updateQty = (id, value) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + value } : item
      )
    );
  };

  const total = cart.reduce((t, item) => t + item.price * item.qty, 0);

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>

      {cart.map((item) => (
        <div className="cart-item" key={item.id}>
          <img src={item.image} alt={item.title} />

          <div className="cart-info">
            <h3>{item.title}</h3>
            <p>$ {item.price}</p>

            <div className="qty-box">
              <button onClick={() => updateQty(item.id, -1)}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item.id, 1)}>+</button>
            </div>
          </div>
        </div>
      ))}

      <h2 className="total">Total: $ {total}</h2>
      <button className="checkout-btn">Checkout</button>
    </div>
  );
}

export default Cart;
