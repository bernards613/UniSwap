import { useEffect, useState } from "react";

export default function PurchaseHistory({ token }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/users/purchases", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPurchases(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="listing-container">
      <h2>Purchase History</h2>
      {purchases.length === 0 && <p>No purchases yet.</p>}

      {purchases.map((item) => (
        <div key={item.transactionid} className="listing-item">
          {item.photo && <img src={item.photo} className="listing-img" />}
          <h3>{item.category}</h3>
          <p>{item.location}</p>
          <p>${item.price}</p>
          <p>{item.description}</p>
          <small>Purchased on: {item.transactiondate}</small>
        </div>
      ))}
    </div>
  );
}