import { useServerSignal$0 } from "virtual:serverSignal$0";

export default () => {
  const clientCount = useServerSignal$0();
  console.log(clientCount);
  return (
    <div>
      <button
        onClick={() =>
          clientCount.setClientCount(clientCount.clientCount() + 1)
        }
      >
        +1
      </button>
      <button
        onClick={() => clientCount.setClientCount(clientCount.count() - 1)}
      >
        -1
      </button>
    </div>
  );
};
