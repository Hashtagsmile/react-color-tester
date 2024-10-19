import "./Widget.css";
import { Chip } from "../Chip/Chip";

export const Widget = ({ title, rising, percentage, amount }) => {
  return (
    <div className="widget-card">
      <div className="top-content">
        <p className="title"> {title}</p>{" "}
        <Chip rising={rising} percentage={percentage} />
      </div>
      <div className="bottom-content">
        <p>€ {amount}</p>
      </div>
    </div>
  );
};
