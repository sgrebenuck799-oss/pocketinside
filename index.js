const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;

const API_URL =
  process.env.API_URL || "https://pocketinside.pages.dev/api";

const MINI_APP_URL = "https://pocketinside.pages.dev";
const REGISTER_URL = "https://pocketinside.pages.dev/register";

const PORT = process.env.PORT || 10000;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не знайдений!");
  process.exit(1);
}

/* =========================================
   HTTP SERVER ДЛЯ RENDER
========================================= */

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("POCKET INSIDER BOT is running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server запущений на порту ${PORT}`);
});

/* =========================================
   TELEGRAM BOT
========================================= */

const bot = new Telegraf(BOT_TOKEN);

/* =========================================
   CHECK REGISTRATION
========================================= */

async function checkRegistration(telegramId) {
  try {
    const response = await fetch(
      `${API_URL}/check?telegram_id=${encodeURIComponent(
        telegramId
      )}`
    );

    if (!response.ok) {
      console.error(
        "❌ API відповів:",
        response.status
      );

      return false;
    }

    const data = await response.json();

    return data.registered === true;
  } catch (error) {
    console.error(
      "❌ Помилка API:",
      error.message
    );

    return false;
  }
}

/* =========================================
   REGISTRATION
========================================= */

async function sendRegistrationMessage(ctx) {
  await ctx.reply(
    `👋 Вітаємо в POCKET INSIDER!

🔒 Доступ до терміналу поки закритий.

Спочатку потрібно зареєструватися.

Після завершення реєстрації поверніться сюди та натисніть:

🔄 ПЕРЕВІРИТИ РЕЄСТРАЦІЮ`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🔐 ЗАРЕЄСТРУВАТИСЯ",
          REGISTER_URL
        ),
      ],
      [
        Markup.button.callback(
          "🔄 ПЕРЕВІРИТИ РЕЄСТРАЦІЮ",
          "check_registration"
        ),
      ],
    ])
  );
}

/* =========================================
   MAIN MENU
========================================= */

async function sendMainMenu(ctx) {
  await ctx.reply(
    `⚡ POCKET INSIDER

✅ Доступ активний.

Оберіть дію:`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
      [
        Markup.button.callback(
          "📊 МІЙ ПРОФІЛЬ",
          "profile"
        ),
      ],
      [
        Markup.button.callback(
          "ℹ️ ІНФОРМАЦІЯ",
          "info"
        ),
      ],
    ])
  );
}

/* =========================================
   START
========================================= */

bot.start(async (ctx) => {
  const telegramId = ctx.from.id;

  console.log(
    `👤 /start від Telegram ID: ${telegramId}`
  );

  const registered =
    await checkRegistration(telegramId);

  if (!registered) {
    return sendRegistrationMessage(ctx);
  }

  return sendMainMenu(ctx);
});

/* =========================================
   CHECK REGISTRATION BUTTON
========================================= */

bot.action(
  "check_registration",
  async (ctx) => {
    await ctx.answerCbQuery(
      "Перевіряємо реєстрацію..."
    );

    const telegramId = ctx.from.id;

    const registered =
      await checkRegistration(telegramId);

    if (!registered) {
      return ctx.reply(
        `❌ Реєстрацію не знайдено.

Завершіть реєстрацію на сайті та спробуйте ще раз.`,
        Markup.inlineKeyboard([
          [
            Markup.button.webApp(
              "🔐 ЗАРЕЄСТРУВАТИСЯ",
              REGISTER_URL
            ),
          ],
          [
            Markup.button.callback(
              "🔄 ПЕРЕВІРИТИ ЩЕ РАЗ",
              "check_registration"
            ),
          ],
        ])
      );
    }

    return ctx.reply(
      `✅ Реєстрацію підтверджено!

🎉 Доступ до POCKET INSIDER відкритий.`,
      Markup.inlineKeyboard([
        [
          Markup.button.webApp(
            "🚀 ВІДКРИТИ ТЕРМІНАЛ",
            MINI_APP_URL
          ),
        ],
      ])
    );
  }
);

/* =========================================
   PROFILE
========================================= */

bot.action("profile", async (ctx) => {
  await ctx.answerCbQuery();

  const telegramId = ctx.from.id;

  const registered =
    await checkRegistration(telegramId);

  if (!registered) {
    return sendRegistrationMessage(ctx);
  }

  await ctx.reply(
    `📊 МІЙ ПРОФІЛЬ

🆔 Telegram ID:
${telegramId}

🔐 Статус:
✅ Доступ активний`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "🚀 ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
    ])
  );
});

/* =========================================
   INFO
========================================= */

bot.action("info", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    `ℹ️ POCKET INSIDER

Telegram Mini App для аналізу валютних пар та технічних індикаторів.

Для використання терміналу потрібен активний доступ.`
  );
});

/* =========================================
   TERMINAL COMMAND
========================================= */

bot.command("terminal", async (ctx) => {
  const telegramId = ctx.from.id;

  const registered =
    await checkRegistration(telegramId);

  if (!registered) {
    return sendRegistrationMessage(ctx);
  }

  return sendMainMenu(ctx);
});

/* =========================================
   ERROR HANDLER
========================================= */

bot.catch((error) => {
  console.error(
    "❌ Telegram bot error:",
    error
  );
});

/* =========================================
   START BOT
========================================= */

bot.launch()
  .then(() => {
    console.log(
      "🚀 POCKET INSIDER BOT запущений"
    );
  })
  .catch((error) => {
    console.error(
      "❌ Не вдалося запустити Telegram бота:",
      error
    );

    process.exit(1);
  });

/* =========================================
   GRACEFUL SHUTDOWN
========================================= */

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  server.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  server.close();
});
