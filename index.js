const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = "https://pocketinside.pages.dev";
const REGISTER_URL = "https://pocketinside.pages.dev";

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не знайдений!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const USERS_FILE = "./users.json";

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUser(userId) {
  const users = loadUsers();

  if (!users[userId]) {
    users[userId] = {
      registered: false,
      createdAt: new Date().toISOString()
    };

    saveUsers(users);
  }

  return users[userId];
}

/* ================================
   START
================================ */

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const user = getUser(userId);

  if (!user.registered) {
    return ctx.reply(
      `👋 Вітаємо в POCKET INSIDER!

Для доступу до терміналу необхідно спочатку зареєструватися.

Після реєстрації натисніть кнопку «Я зареєструвався».`,
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "🔐 ЗАРЕЄСТРУВАТИСЯ",
            REGISTER_URL
          )
        ],
        [
          Markup.button.callback(
            "✅ Я ЗАРЕЄСТРУВАВСЯ",
            "check_registration"
          )
        ]
      ])
    );
  }

  return showMainMenu(ctx);
});

/* ================================
   MAIN MENU
================================ */

async function showMainMenu(ctx) {
  return ctx.reply(
    `⚡ POCKET INSIDER

Ваш доступ активний.

Оберіть дію:`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        )
      ],
      [
        Markup.button.callback(
          "📊 МІЙ ПРОФІЛЬ",
          "profile"
        )
      ],
      [
        Markup.button.callback(
          "ℹ️ ІНФОРМАЦІЯ",
          "info"
        )
      ]
    ])
  );
}

/* ================================
   REGISTRATION CHECK
================================ */

bot.action("check_registration", async (ctx) => {
  const userId = ctx.from.id;

  const users = loadUsers();

  if (!users[userId]) {
    users[userId] = {
      registered: false,
      createdAt: new Date().toISOString()
    };

    saveUsers(users);
  }

  /*
    ПОКИ ЩО ЦЕ ТЕСТОВА ПЕРЕВІРКА.

    Реальну автоматичну перевірку
    підключимо через сайт/API.
  */

  users[userId].registered = true;

  saveUsers(users);

  await ctx.answerCbQuery("Реєстрацію підтверджено!");

  await ctx.editMessageText(
    `✅ Реєстрацію підтверджено!

Доступ до POCKET INSIDER відкритий.`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        )
      ],
      [
        Markup.button.callback(
          "📊 МІЙ ПРОФІЛЬ",
          "profile"
        )
      ]
    ])
  );
});

/* ================================
   PROFILE
================================ */

bot.action("profile", async (ctx) => {
  const userId = ctx.from.id;
  const user = getUser(userId);

  await ctx.answerCbQuery();

  await ctx.reply(
    `📊 МІЙ ПРОФІЛЬ

🆔 Telegram ID: ${userId}

🔐 Статус:
${user.registered ? "✅ Доступ активний" : "🔒 Доступ заблокований"}

📅 Дата підключення:
${new Date(user.createdAt).toLocaleDateString("uk-UA")}`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        )
      ]
    ])
  );
});

/* ================================
   INFO
================================ */

bot.action("info", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `ℹ️ POCKET INSIDER

Аналітичний термінал із технічними індикаторами та сигналами.

Для роботи терміналу використовуйте кнопку:

🚀 ВІДКРИТИ ТЕРМІНАЛ`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        )
      ]
    ])
  );
});

/* ================================
   COMMANDS
================================ */

bot.command("terminal", async (ctx) => {
  const userId = ctx.from.id;
  const user = getUser(userId);

  if (!user.registered) {
    return ctx.reply(
      "🔒 Спочатку необхідно зареєструватися.",
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "🔐 ЗАРЕЄСТРУВАТИСЯ",
            REGISTER_URL
          )
        ],
        [
          Markup.button.callback(
            "✅ Я ЗАРЕЄСТРУВАВСЯ",
            "check_registration"
          )
        ]
      ])
    );
  }

  return showMainMenu(ctx);
});

/* ================================
   LAUNCH
================================ */

bot.launch();

console.log("🚀 POCKET INSIDER BOT запущений");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
