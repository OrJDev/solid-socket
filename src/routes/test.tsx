import { createServerSignal } from "../../socket/lib";

export default () => {
  const clientCount = createServerSignal("clientCount", 2);
  return (
    <div>
      <button onClick={() => clientCount.setClientCount((prev) => prev + 1)}>
        +1
      </button>
      <span>{clientCount.clientCount()}</span>
      <button onClick={() => clientCount.setClientCount((prev) => prev - 1)}>
        -1
      </button>
    </div>
  );
};
