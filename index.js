const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =========================================
// НАЛАШТУВАННЯ
// =========================================

const BOT_TOKEN = process.env.BOT_TOKEN;

// Cloudflare Worker
const API_URL =
  "https://pocketinside-api.sgrebenuck-799.workers.dev";

// Твій Mini App
const MINI_APP_URL =
  "https://pocketinside.pages.dev";

// =========================================
// ПЕРЕВІРКА ТОКЕНА
// =========================================

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не знайдений!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// =========================================
// HTTP SERVER ДЛЯ RENDER
// =========================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
  });

  res.end("POCKET INSIDER BOT is running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server запущений на порту ${PORT}`);
});

// =========================================
// ПЕРЕВІРКА РЕЄСТРАЦІЇ
// =========================================

async function checkRegistration(telegramId) {
  try {
    const response = await fetch(
      `${API_URL}/api/check?telegram_id=${encodeURIComponent(
        telegramId
      )}`
    );

    if (!response.ok) {
      console.error(
        "Worker check error:",
        response.status
      );

      return false;
    }

    const data = await response.json();

    return data.registered === true;
  } catch (error) {
    console.error(
      "Помилка перевірки реєстрації:",
      error.message
    );

    return false;
  }
}

// =========================================
// START
// =========================================

bot.start(async (ctx) => {
  const name =
    ctx.from.first_name || "друже";

  await ctx.reply(
    `👋 Привіт, ${name}!

⚡ POCKET INSIDER

Аналітичний термінал для отримання торгових сигналів.

Щоб отримати доступ до терміналу, спочатку потрібно зареєструватися.`,
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "📝 ЗАРЕЄСТРУВАТИСЯ",
          `${MINI_APP_URL}/?telegram_id=${ctx.from.id}&register=1`
        ),
      ],
      [
        Markup.button.callback(
          "✅ Я ЗАРЕЄСТРУВАВСЯ",
          "check_registration"
        ),
      ],
    ])
  );
});

// =========================================
// КНОПКА "ВІДКРИТИ ТЕРМІНАЛ"
// =========================================

bot.action("open_terminal", async (ctx) => {
  await ctx.answerCbQuery();

  const registered = await checkRegistration(
    ctx.from.id
  );

  if (!registered) {
    await ctx.reply(
      `🔒 Доступ закритий.

Спочатку зареєструйся на сайті, а потім натисни «Я ЗАРЕЄСТРУВАВСЯ».`,
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📝 РЕЄСТРАЦІЯ",
            `${MINI_APP_URL}/?telegram_id=${ctx.from.id}&register=1`
          ),
        ],
        [
          Markup.button.callback(
            "✅ ПЕРЕВІРИТИ",
            "check_registration"
          ),
        ],
      ])
    );

    return;
  }

  await ctx.reply(
    "🚀 Доступ дозволено!\n\nВідкривай POCKET INSIDER:",
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "⚡ ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
    ])
  );
});

// =========================================
// ПЕРЕВІРКА РЕЄСТРАЦІЇ
// =========================================

bot.action("check_registration", async (ctx) => {
  await ctx.answerCbQuery("Перевіряю...");

  const registered = await checkRegistration(
    ctx.from.id
  );

  if (registered) {
    await ctx.reply(
      `✅ Реєстрацію підтверджено!

Тепер тобі доступний POCKET INSIDER.`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "⚡ ВІДКРИТИ ТЕРМІНАЛ",
            "open_terminal"
          ),
        ],
      ])
    );
  } else {
    await ctx.reply(
      `❌ Реєстрацію не знайдено.

Спочатку зареєструйся на сайті, після цього натисни кнопку перевірки.`,
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📝 ЗАРЕЄСТРУВАТИСЯ",
            `${MINI_APP_URL}/?telegram_id=${ctx.from.id}&register=1`
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
});

// =========================================
// КОМАНДА /terminal
// =========================================

bot.command("terminal", async (ctx) => {
  const registered = await checkRegistration(
    ctx.from.id
  );

  if (!registered) {
    await ctx.reply(
      "🔒 Спочатку потрібно зареєструватися.",
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📝 РЕЄСТРАЦІЯ",
            `${MINI_APP_URL}/?telegram_id=${ctx.from.id}&register=1`
          ),
        ],
        [
          Markup.button.callback(
            "✅ ПЕРЕВІРИТИ",
            "check_registration"
          ),
        ],
      ])
    );

    return;
  }

  await ctx.reply(
    "🚀 POCKET INSIDER готовий до роботи.",
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "⚡ ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
    ])
  );
});

// =========================================
// ПОМИЛКИ
// =========================================

bot.catch((error) => {
  console.error(
    "❌ Telegram bot error:",
    error
  );
});

// =========================================
// ЗАПУСК
// =========================================

bot.launch()
  .then(() => {
    console.log(
      "🚀 POCKET INSIDER BOT запущений"
    );
  })
  .catch((error) => {
    console.error(
      "❌ Не вдалося запустити Telegram-бота:",
      error
    );
    process.exit(1);
  });

// Коректне завершення
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
