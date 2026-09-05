```javascript
const { Telegraf, Markup } = require("telegraf");
const http = require("http");

// =========================================
// НАСТРОЙКИ
// =========================================

const BOT_TOKEN = process.env.BOT_TOKEN;

const ADMIN_IDS = [
  "858491771"
];

const API_URL =
  "https://pocketinside-api.sgrebenuck-799.workers.dev";

// Партнерская регистрация Pocket Partners
const REGISTER_URL =
  "https://po-ru4.click/register?utm_campaign=844070&utm_source=affiliate&utm_medium=sr&a=AL9nNcVsCGLdY5&al=1755713&ac=pocketinside&cid=953070";

// Mini App
const MINI_APP_URL =
  "https://tiny-wind-710a.sgrebenuck-799.workers.dev";

// =========================================
// ПРОВЕРКА ТОКЕНА
// =========================================

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN не найден!");
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
  console.log(`🌐 HTTP server запущен на порту ${PORT}`);
});

// =========================================
// ССЫЛКА НА РЕГИСТРАЦИЮ
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
// ПРОВЕРКА ДОСТУПА
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
      "❌ Ошибка проверки:",
      error.message
    );

    return false;
  }
}

// =========================================
// КНОПКИ РЕГИСТРАЦИИ
// =========================================

function registrationButtons(telegramId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📝 ЗАРЕГИСТРИРОВАТЬСЯ",
        getRegistrationUrl(telegramId)
      ),
    ],
    [
      Markup.button.callback(
        "🔄 ПРОВЕРИТЬ ДОСТУП",
        "check_registration"
      ),
    ],
  ]);
}

// =========================================
// КНОПКА MINI APP
// =========================================

function terminalButton() {
  return Markup.inlineKeyboard([
    [
      Markup.button.webApp(
        "⚡ ОТКРЫТЬ ТЕРМИНАЛ",
        MINI_APP_URL
      ),
    ],
  ]);
}

// =========================================
// START
// =========================================

bot.start(async (ctx) => {
  const name =
    ctx.from.first_name || "друг";

  await ctx.reply(
    `👋 Привет, ${name}!

⚡ POCKET INSIDER

Для доступа к терминалу нужно выполнить условие партнерской программы.

Нажми «ЗАРЕГИСТРИРОВАТЬСЯ», после чего пройди регистрацию.

Если депозит будет подтвержден партнерской системой, бот автоматически откроет доступ.`,
    registrationButtons(ctx.from.id)
  );
});

// =========================================
// ПРОВЕРКА ДОСТУПА
// =========================================

bot.action("check_registration", async (ctx) => {
  await ctx.answerCbQuery("Проверяю...");

  const telegramId = ctx.from.id;

  const registered =
    await checkRegistration(telegramId);

  if (!registered) {
    await ctx.reply(
      `⏳ Доступ еще не подтвержден.

Если ты уже выполнил условие, подожди немного и нажми «Проверить доступ» еще раз.`,
      registrationButtons(telegramId)
    );

    return;
  }

  await ctx.reply(
    `✅ ДОСТУП ПОДТВЕРЖДЕН!

🚀 Теперь тебе доступен POCKET INSIDER.`,
    terminalButton()
  );
});

// =========================================
// ОТКРЫТЬ ТЕРМИНАЛ
// =========================================

bot.action("open_terminal", async (ctx) => {
  await ctx.answerCbQuery();

  const registered =
    await checkRegistration(ctx.from.id);

  if (!registered) {
    await ctx.reply(
      "🔒 Доступ еще не подтвержден.",
      registrationButtons(ctx.from.id)
    );

    return;
  }

  await ctx.reply(
    "🚀 Открывай POCKET INSIDER:",
    terminalButton()
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
      "🔒 Сначала нужно получить доступ.",
      registrationButtons(ctx.from.id)
    );

    return;
  }

  await ctx.reply(
    "🚀 POCKET INSIDER готов:",
    terminalButton()
  );
});

// =========================================
// ОШИБКИ
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
      "🚀 POCKET INSIDER BOT запущен"
    );
  })
  .catch((error) => {
    console.error(
      "❌ Не удалось запустить Telegram-бота:",
      error
    );

    process.exit(1);
  });

// =========================================
// КОРРЕКТНОЕ ЗАВЕРШЕНИЕ
// =========================================

process.once("SIGINT", () =>
  bot.stop("SIGINT")
);

process.once("SIGTERM", () =>
  bot.stop("SIGTERM")
);
```
