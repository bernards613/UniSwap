import { useState, useEffect } from "react";

export default function PurchaseHistory({ token }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch("http://127.0.0.1:8000/users/purchases", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPurchases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div>Loading purchases...</div>;
  if (!purchases.length) return <div>No purchases yet</div>;

  return (
    <div>
      <h2>Purchase History</h2>
      <ul>
        {purchases.map((p) => (
          <li key={p.transactionid}>
            {p.category} - {p.location} - ${p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}