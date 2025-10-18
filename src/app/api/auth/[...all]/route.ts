import { auth } from "~/lib/auth/better-auth";
import { toNextJsHandler } from "better-auth/next-js";

const { GET, POST } = toNextJsHandler(auth);

export { GET, POST };
