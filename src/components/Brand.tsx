import { Link } from "react-router";
import Icon from "./Icon";

export default function Brand() {
  return (
    <Link className="brand" to="/" aria-label="JPUS 홈">
      <span className="brand-mark">
        <Icon name="users" size={22} />
      </span>
      <span>
        JPUS<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
