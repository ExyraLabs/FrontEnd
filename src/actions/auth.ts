import { getServerSession } from "next-auth";
import TwitterProvider, { TwitterProfile } from "next-auth/providers/twitter";
import DiscordProvider, { DiscordProfile } from "next-auth/providers/discord";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_ID as string,
      clientSecret: process.env.TWITTER_SECRET as string,
      version: "2.0",
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_ID as string,
      clientSecret: process.env.DISCORD_SECRET as string,
      profile(profile) {
        // Remove the email field if it exists
        console.log(profile, "discord progile");
        const { email, ...rest } = profile;
        return rest;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,

      // checks: "both",
    }),
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        id: { label: "Telegram ID", type: "text" },
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials) {
        // In a real scenario, verify credentials with Telegram API
        if (!credentials?.id || !credentials?.username) return null;
        return {
          id: credentials.id,
          name: credentials.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        if (account.provider === "twitter") {
          const twitterProfile = profile as TwitterProfile;

          token.x_id = twitterProfile.data.id;
          token.x_username = twitterProfile.data.username;
        } else if (account.provider === "discord") {
          const discordProfile = profile as DiscordProfile;
          token.discord_id = discordProfile.id;
          token.discord_username = discordProfile.username;
        } else if (account.provider === "google") {
          const googleProfile = profile as GoogleProfile;
          token.email = googleProfile.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      //eslint-disable-next-line
      const data: any = {
        user: { x_id: 0, x_username: "", discord_id: 0, discord_username: "" },
      };
      if (session.user) {
        data.user.x_id = token.x_id;
        data.user.x_username = token.x_username;
        data.user.discord_username = token.discord_username;
        data.user.discord_id = token.discord_id;
        data.user.email = token.email;
      }
      return data;
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
