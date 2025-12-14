import NextAuth from "next-auth";
import { getServerSession } from "next-auth/next";
import config from "./auth.config";

const handler = NextAuth(config as any);

export const handlers = { GET: handler, POST: handler };

export async function auth() {
	return await getServerSession(config as any);
}