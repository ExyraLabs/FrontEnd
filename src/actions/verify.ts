// "use server";
// import { ILeaderboard, IUser } from "@/types";
// import clientPromise from "@/lib/mongo";

// export const hasMessagedToday = async (userId: string): Promise<boolean> => {
//   const res = await fetch(`/verify/check-telegram-message?userId=${userId}`);
//   const data = await res.json();
//   if (data.hasMessaged) {
//     return true;
//   } else {
//     return false;
//   }
// };

// export const deductPoints = async (
//   address: string,
//   points: number,
//   type: string = "reward-claim",
//   iSKYOPS: boolean = false
// ): Promise<{ error: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");

//   try {
//     const user = await getUserDetails(address);
//     if (!user) {
//       return { error: true, message: "Wallet not registered" };
//     }

//     // If iSKYOPS, operate on tokens, else points
//     const field = iSKYOPS ? "tokens" : "points";
//     const userBalance = user[field] ?? 0;
//     if (userBalance < points) {
//       return { error: true, message: `Insufficient ${field}` };
//     }

//     const pointsEntry = {
//       date: new Date().toLocaleDateString("de-DE"),
//       type,
//       [field]: -points, // Log it as negative
//     };

//     const updateQuery: any = {
//       $inc: { [field]: -points },
//       // @ts-ignore
//       $push: { pointsHistory: pointsEntry },
//     };

//     // Double check atomicity
//     const matchQuery: any = { wallet: address };
//     matchQuery[field] = { $gte: points };

//     const result = await db
//       .collection("users")
//       .updateOne(matchQuery, updateQuery);

//     if (result.matchedCount === 0) {
//       return {
//         error: true,
//         message: `Deduction failed — not enough ${field} or user not found`,
//       };
//     }

//     return {
//       error: false,
//       message: `${iSKYOPS ? "Tokens" : "Points"} claimed successfully`,
//     };
//   } catch (err: any) {
//     return { error: true, message: `An error occurred: ${err.message}` };
//   }
// };

// export const addPoints = async (
//   address: string,
//   points: number,
//   type: string,
//   iSKYOPS: boolean = false
// ): Promise<{ error: boolean; message: string }> => {
//   try {
//     const client = await clientPromise;
//     const db = client.db("AIOps");
//     const user = await getUserDetails(address);
//     if (!user) {
//       return { error: true, message: "Wallet not registered" };
//     }

//     // If iSKYOPS, operate on tokens, else points
//     const field = iSKYOPS ? "tokens" : "points";
//     const pointsEntry = {
//       date: new Date().toLocaleDateString("de-DE"),
//       type: type,
//       [field]: points,
//     };

//     const updateQuery: any = {
//       $inc: { [field]: points },
//       // @ts-ignore
//       $push: { pointsHistory: pointsEntry },
//     };

//     const result = await db
//       .collection("users")
//       .updateOne({ wallet: address }, updateQuery);

//     if (result.matchedCount === 0) {
//       return {
//         error: true,
//         message: `Add ${field} failed — user not found`,
//       };
//     }

//     return {
//       error: false,
//       message: `${iSKYOPS ? "Tokens" : "Points"} added successfully`,
//     };
//   } catch (err: any) {
//     return { error: true, message: `An error occurred: ${err.message}` };
//   }
// };

// export const getUserDetails = async (wallet: string): Promise<any> => {
//   if (!wallet || wallet.length < 2) {
//     return;
//   }
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await db.collection("users").findOne(
//     { wallet },
//     {
//       projection: {
//         _id: 0,
//         created_at: 0,
//         updated_at: 0,
//         pointsHistory: { _id: 0 },
//       },
//     }
//   );
//   if (user) {
//     const { _id, ...rest } = user;
//     return rest;
//   } else {
//     console.log("Wallet does not exist");
//     return {};
//   }
// };

// export const getAllUsers = async (): Promise<ILeaderboard[]> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const users = (await db
//     .collection("users")
//     .find(
//       {
//         wallet: { $exists: true, $ne: null },
//         points: { $gt: 0 },
//       },
//       { projection: { wallet: 1, points: 1, referee: 1, code: 1, _id: 0 } }
//     )
//     .sort({ points: -1 })
//     .toArray()) as unknown as ILeaderboard[];

//   // Add rank and referee fields after sorting
//   const usersWithRankAndReferee = await Promise.all(
//     users.map(async (user, index) => {
//       const refereeWallet = user.referee
//         ? await getUserByCode(user.referee)
//         : "";
//       return {
//         wallet: user.wallet,
//         points: user.points,
//         rank: index + 1,
//         referee: refereeWallet,
//       };
//     })
//   );

//   return usersWithRankAndReferee;
// };

// export const authenticateTwitter = async (
//   address: string,
//   id: number,
//   username: string
// ): Promise<{ ok: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await getUserDetails(address);
//   if (!user) {
//     return { ok: false, message: "Wallet not registered" };
//   }
//   if (user?.x_id) {
//     return { ok: true, message: "Connected" };
//   }

//   // Check if Twitter ID or username already exists for another user
//   const existingTwitterUser = await db.collection("users").findOne({
//     $or: [{ x_id: id }, { x_username: username }],
//     wallet: { $ne: address }, // Exclude the current user
//   });

//   if (existingTwitterUser) {
//     return {
//       ok: false,
//       message: "This Twitter account is already linked to another wallet",
//     };
//   }

//   const result = await db
//     .collection("users")
//     .updateOne(
//       { wallet: address },
//       { $set: { x_id: id, x_username: username } }
//     );

//   if (result.modifiedCount === 0) {
//     return { ok: false, message: "Failed to connect Twitter" };
//   }

//   // await addPoints(address, 15, "Connect Twitter");
//   return { ok: true, message: "Twitter connected successfully" };
// };

// export const authenticateDiscord = async (
//   address: string,
//   id: number,
//   username: string
// ): Promise<{ ok: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await getUserDetails(address);
//   if (!user) {
//     return { ok: false, message: "Wallet not registered" };
//   }
//   if (user?.discord_id) {
//     return { ok: true, message: "Connected" };
//   }

//   // Check if Discord ID or username already exists for another user
//   const existingDiscordUser = await db.collection("users").findOne({
//     $or: [{ discord_id: id }, { discord_username: username }],
//     wallet: { $ne: address }, // Exclude the current user
//   });

//   if (existingDiscordUser) {
//     return {
//       ok: false,
//       message: "This Discord account is already linked to another wallet",
//     };
//   }

//   const result = await db
//     .collection("users")
//     .updateOne(
//       { wallet: address },
//       { $set: { discord_id: id, discord_username: username } }
//     );

//   if (result.modifiedCount === 0) {
//     return { ok: false, message: "Failed to connect Discord" };
//   }

//   // await addPoints(address, 15, "Connect Discord");
//   return { ok: true, message: "Discord connected successfully" };
// };

// export const authenticateGmail = async (
//   address: string,
//   email: string
// ): Promise<{ ok: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await getUserDetails(address);
//   if (!user) {
//     return { ok: false, message: "Wallet not registered" };
//   }
//   if (user?.gmail) {
//     return { ok: true, message: "Connected" };
//   }

//   // Check if Gmail already exists for another user
//   const existingGmailUser = await db.collection("users").findOne({
//     gmail: email,
//     wallet: { $ne: address }, // Exclude the current user
//   });

//   if (existingGmailUser) {
//     return {
//       ok: false,
//       message: "This Gmail account is already linked to another wallet",
//     };
//   }

//   const result = await db
//     .collection("users")
//     .updateOne({ wallet: address }, { $set: { gmail: email } });

//   if (result.modifiedCount === 0) {
//     return { ok: false, message: "Failed to connect Gmail" };
//   }

//   // await addPoints(address, 15, "Connect Gmail");
//   return { ok: true, message: "Gmail connected successfully" };
// };

// export const authenticateTelegram = async (
//   address: string,
//   id: number,
//   username: string
// ): Promise<{ ok: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await getUserDetails(address);
//   if (!user) {
//     return { ok: false, message: "Wallet not registered" };
//   }
//   if (user?.tg_id) {
//     return { ok: true, message: "Connected" };
//   }

//   // Check if Telegram ID or username already exists for another user
//   const existingTelegramUser = await db.collection("users").findOne({
//     $or: [{ tg_id: id }, { tg_username: username }],
//     wallet: { $ne: address }, // Exclude the current user
//   });

//   if (existingTelegramUser) {
//     return {
//       ok: false,
//       message: "This Telegram account is already linked to another wallet",
//     };
//   }

//   const result = await db
//     .collection("users")
//     .updateOne(
//       { wallet: address },
//       { $set: { tg_id: id, tg_username: username } }
//     );

//   if (result.modifiedCount === 0) {
//     return { ok: false, message: "Failed to connect Telegram" };
//   }

//   // await addPoints(address, 15, "Connect Telegram");
//   return { ok: true, message: "Telegram connected successfully" };
// };

// export const getUserByCode = async (code: string): Promise<string> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");
//   const user = await db
//     .collection("users")
//     .findOne({ code }, { projection: { wallet: 1, _id: 0 } });
//   if (user) {
//     return user.wallet;
//   } else {
//     return "Invalid Referral Code";
//   }
// };

// // Add this function to your helpers file

// export const addPostToUser = async (
//   address: string,
//   post: { link: string; type: string }
// ): Promise<{ error: boolean; message: string }> => {
//   const client = await clientPromise;
//   const db = client.db("AIOps");

//   try {
//     // Sanitize input to prevent NoSQL injection
//     if (
//       typeof post.link !== "string" ||
//       post.link.includes("$") ||
//       post.link.includes("{") ||
//       post.link.includes("}")
//     ) {
//       return { error: true, message: "Invalid link format" };
//     }

//     const user = await getUserDetails(address);
//     if (!user) {
//       return { error: true, message: "Wallet not registered" };
//     }

//     // Check for duplicate link
//     const existing = await db.collection("users").findOne({
//       wallet: address,
//       posts: { $elemMatch: { link: post.link } },
//     });
//     if (existing) {
//       return { error: true, message: "Duplicate Link" };
//     }

//     const result = await db.collection("users").updateOne(
//       { wallet: address },
//       {
//         // @ts-ignore
//         $push: { posts: { ...post, date: new Date() } },
//       }
//     );

//     if (result.matchedCount === 0) {
//       return { error: true, message: "User not found" };
//     }

//     return { error: false, message: "Link Submitted successfully" };
//   } catch (err: any) {
//     return { error: true, message: `An error occurred: ${err.message}` };
//   }
// };
