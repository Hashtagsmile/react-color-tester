import React, { useState } from "react";
import "./DropdownButton.css"; // Add your styles here

const DropdownButton = ({ options, onSelect, buttonTitle, selectedOption }) => {

    const handleSelect = (e) => {
        const selectedValue = e.target.value;
        onSelect(selectedValue); // Pass the selected option to the parent component
      };

  return (
    <div className="dropdown-button">
      <select value={selectedOption} onChange={handleSelect} className="dropdown">
        <option value="" disabled>{buttonTitle}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
        {/* Add an option for Custom Theme if it's selected since Custom THeme is not in the options array */}
        {selectedOption === "Custom theme" && (
                    <option value="Custom theme">Custom theme</option>
                )}
      </select>
    </div>
  );
};

export default DropdownButton;

