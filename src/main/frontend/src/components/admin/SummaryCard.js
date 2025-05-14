// components/admin/SummaryCard.js
import React from "react";
import "../../styles/admin/adminMain.css";

const SummaryCard = ({ label, value }) => (
    <div className="card">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
);

export default SummaryCard;
