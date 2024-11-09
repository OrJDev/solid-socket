import { createServerSignal } from "../../socket/lib";

export const serverCount = createServerSignal("count", 10);
