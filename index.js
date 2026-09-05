const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =========================================
// НАЛАШТУВАННЯ
// =========================================

const BOT_TOKEN = process.env.BOT_TOKEN;

const ADMIN_IDS = [
  "858491771"
];

const API_URL =
  "https://pocketinside-api.sgrebenuck-799.workers.dev";

// Партнерська реєстрація Pocket Partners
const REGISTER_URL =
  "https://po-ru4.click/register?utm_campaign=844070&utm_source=affiliate&utm_medium=sr&a=AL9nNcVsCGLdY5&al=1755713&ac=pocketinside&cid=953070";

// Mini App
const MINI_APP_URL =
  "https://tiny-wind-710a.sgrebenuck-799.workers.dev";

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
// ПОСИЛАННЯ НА РЕЄСТРАЦІЮ
// =========================================

function getRegistrationUrl(telegramId) {
  const url = new URL(REGISTER_URL);

  url.searchParams.set(
    "sub_id1",
    String(telegramId)
  );

  return url.toString();
}

// =========================================
// ПЕРЕВІРКА ДОСТУПУ
// =========================================

function isAdmin(telegramId) {
  return ADMIN_IDS.includes(String(telegramId));
}

async function checkRegistration(telegramId) {
  if (isAdmin(telegramId)) {
    return true;
  }

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
      "❌ Помилка перевірки:",
      error.message
    );

    return false;
  }
}

// =========================================
// КНОПКИ РЕЄСТРАЦІЇ
// =========================================

function registrationButtons(telegramId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📝 ЗАРЕЄСТРУВАТИСЯ",
        getRegistrationUrl(telegramId)
      ),
    ],
    [
      Markup.button.callback(
        "🔄 ПЕРЕВІРИТИ ДОСТУП",
        "check_registration"
      ),
    ],
  ]);
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

Для доступу до терміналу потрібно виконати умову партнерської програми.

Натисни «ЗАРЕЄСТРУВАТИСЯ», після чого виконай реєстрацію.

Якщо депозит буде підтверджений партнерською системою, бот автоматично відкриє доступ.`,
    registrationButtons(ctx.from.id)
  );
});

// =========================================
// ПЕРЕВІРКА ДОСТУПУ
// =========================================

bot.action("check_registration", async (ctx) => {
  await ctx.answerCbQuery("Перевіряю...");

  const telegramId = ctx.from.id;

  const registered =
    await checkRegistration(telegramId);

  if (!registered) {
    await ctx.reply(
      `⏳ Доступ ще не підтверджено.

Якщо ти вже виконав умову, зачекай трохи та натисни «Перевірити доступ» ще раз.`,
      registrationButtons(telegramId)
    );

    return;
  }

  await ctx.reply(
    `✅ ДОСТУП ПІДТВЕРДЖЕНО!

🚀 Тепер тобі доступний POCKET INSIDER.`,
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "⚡ ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
    ])
  );
});

// =========================================
// ВІДКРИТИ ТЕРМІНАЛ
// =========================================

bot.action("open_terminal", async (ctx) => {
  await ctx.answerCbQuery();

  const registered =
    await checkRegistration(ctx.from.id);

  if (!registered) {
    await ctx.reply(
      "🔒 Доступ ще не підтверджено.",
      registrationButtons(ctx.from.id)
    );

    return;
  }

  await ctx.reply(
    "🚀 Відкривай POCKET INSIDER:",
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
          "⚡ ВІДКРИТИ ТЕРМІНАЛ",
          MINI_APP_URL
        ),
      ],
    ])
  );
});

// =========================================
// /terminal
// =========================================

bot.command("terminal", async (ctx) => {
  const registered =
    await checkRegistration(ctx.from.id);

  if (!registered) {
    await ctx.reply(
      "🔒 Спочатку потрібно отримати доступ.",
      registrationButtons(ctx.from.id)
    );

    return;
  }

  await ctx.reply(
    "🚀 POCKET INSIDER готовий:",
    Markup.inlineKeyboard([
      [
        Markup.button.webApp(
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

// =========================================
// КОРЕКТНЕ ЗАВЕРШЕННЯ
// =========================================

process.once("SIGINT", () =>
  bot.stop("SIGINT")
);

process.once("SIGTERM", () =>
  bot.stop("SIGTERM")
