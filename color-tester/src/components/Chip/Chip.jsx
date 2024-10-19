import "./Chip.css";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export const Chip = ({ rising, percentage }) => { // Destructure the props correctly
  const chipClass = rising ? "chip positive" : "chip negative";
  const Icon = rising ? FaArrowUp : FaArrowDown; // Choose the correct icon based on 'rising'

  return (
    <div className="chip">
      <div className={chipClass}>
        <Icon /> {percentage} %
      </div>
    </div>
  );
};
