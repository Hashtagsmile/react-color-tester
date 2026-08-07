import { FiChevronDown } from "react-icons/fi";
import "./DropdownButton.css";

const DropdownButton = ({ options, onSelect, buttonTitle, selectedOption, customLabel }) => {
  const showCustom = customLabel && selectedOption === customLabel;

  return (
    <div className="dropdown-button">
      <select
        className="dropdown"
        value={selectedOption ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          {buttonTitle}
        </option>
        {showCustom && (
          <option value={customLabel} disabled>
            {customLabel}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FiChevronDown className="dropdown-caret" aria-hidden="true" />
    </div>
  );
};

export default DropdownButton;
