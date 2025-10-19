import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/lib/auth/better-auth";

const { GET, POST } = toNextJsHandler(auth);

export { GET, POST };
