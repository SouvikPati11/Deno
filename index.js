import { Telegraf } from "telegraf";
import express from "express";

// BOT CONFIG (Hardcoded for now, but use env in production)
const BOT_TOKEN = "6911970127:AAGTCEBWDs0frAABguZcu8_ih__WMZU4zX0";
const ADMIN_ID = "1862385036";
const BASE_URL = "deno-souvik-patis-projects.vercel.app"; // Vercel URL (e.g., https://your-app.vercel.app)

const bot = new Telegraf(BOT_TOKEN);

// In-memory database (replace with real DB later)
let users = {};
let bonusClaimed = {}; // Tracks last bonus claim time

// Start Command
bot.start((ctx) => {
    const userId = ctx.from.id;
    if (!users[userId]) {
        users[userId] = { points: 0, referredBy: null };
    }
    ctx.reply(`👋 Welcome ${ctx.from.first_name}!\n\nUse the buttons below:`, mainMenu());
});

// Main Menu Keyboard
function mainMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎁 Daily Bonus", callback_data: "bonus" }],
                [{ text: "👥 Refer & Earn", callback_data: "refer" }],
                [{ text: "💰 Buy Views/Reactions", callback_data: "buy" }],
                [{ text: "💳 Deposit Points", callback_data: "deposit" }],
            ],
        },
    };
}

// Bonus Button
bot.action("bonus", (ctx) => {
    const userId = ctx.from.id;
    const now = Date.now();
    const lastClaim = bonusClaimed[userId] || 0;

    if (now - lastClaim >= 24 * 60 * 60 * 1000) {
        bonusClaimed[userId] = now;
        users[userId].points += 50;
        ctx.answerCbQuery("🎉 You got 50 bonus points!");
        ctx.reply(`✅ Bonus added! Your points: ${users[userId].points}`);
    } else {
        ctx.answerCbQuery("❌ Bonus already claimed. Try again later.", { show_alert: true });
    }
});

// Refer Button
bot.action("refer", (ctx) => {
    const userId = ctx.from.id;
    const link = `https://t.me/${ctx.botInfo.username}?start=${userId}`;
    ctx.reply(`👥 Share this link with friends:\n${link}\n\nEarn 100 points per referral!`);
});

// Buy Views/Reactions
bot.action("buy", (ctx) => {
    ctx.reply(
        `📦 Buy Views/Reactions\n\n1. 100 Views = 50 points\n2. 100 Reactions = 70 points\n\nReply with your choice (e.g., "Buy 100 Views")`
    );
});

// Deposit (Manual)
bot.action("deposit", (ctx) => {
    ctx.reply(
        `💳 Manual Deposit\n\nSend payment screenshot to Admin: @YourAdminUsername.\nAdmin will add points manually.`
    );
});

// Handle referral
bot.start((ctx) => {
    const userId = ctx.from.id;
    const refId = ctx.message.text.split(" ")[1];
    if (!users[userId]) {
        users[userId] = { points: 0, referredBy: refId || null };
        if (refId && users[refId]) {
            users[refId].points += 100;
            ctx.telegram.sendMessage(refId, `🎉 You earned 100 points for referring ${ctx.from.first_name}`);
        }
    }
    ctx.reply("Welcome to the bot!", mainMenu());
});

// --- EXPRESS SERVER FOR VERCEL ---
const app = express();
app.use(express.json());

app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

app.get("/", (req, res) => {
    res.send("Bot is running!");
});

export default app;

// Setup webhook when bot is started
if (BASE_URL) {
    bot.telegram.setWebhook(`${BASE_URL}/webhook/${BOT_TOKEN}`);
}
