// components/admin/QuickLinkButton.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/admin.css";

const QuickLinkButton = ({ title, path }) => {
  const navigate = useNavigate();
  return (
      <button className="link-btn" onClick={() => navigate(path)}>
        {title}
      </button>
  );
};

export default QuickLinkButton;
