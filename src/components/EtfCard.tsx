import type { Etf } from "../types";
import { formatFee, handleRowKeyDown } from "../utils";

export function EtfCard({
  etf,
  onOpen,
}: {
  etf: Etf;
  onOpen: (etf: Etf) => void;
}) {
  return (
    <tr
      className="clickableRow"
      tabIndex={0}
      role="button"
      onClick={() => onOpen(etf)}
      onKeyDown={(event) => handleRowKeyDown(event, etf, onOpen)}
    >
      <td>
        <span className="nameCell">
          <span className="name">{etf.한글종목약명}</span>
          <span className="fullName">{etf.기초지수명}</span>
        </span>
      </td>
      <td className="code">{etf.단축코드}</td>
      <td>{etf.운용사}</td>
      <td>{etf.기초시장분류}</td>
      <td>{etf.기초자산분류}</td>
      <td>{formatFee(etf.총보수)}</td>
      <td>{etf.과세유형}</td>
    </tr>
  );
}
