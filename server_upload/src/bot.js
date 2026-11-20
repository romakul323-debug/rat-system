const TelegramBot = require('node-telegram-bot-api');

function setupBot() {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;

    if (!token) {
        throw new Error('TELEGRAM_TOKEN is missing');
    }

    const bot = new TelegramBot(token, { polling: true });

    bot.on('message', (msg) => {
        if (msg.chat.id.toString() !== chatId) return;

        const text = msg.text;
        if (text === '/start') {
            bot.sendMessage(chatId, 'Бот запущен и готов к работе!\n\nКоманды:\n/ping\n/devices');
        } else if (text === '/ping') {
            bot.sendMessage(chatId, 'Pong!');
        } else if (text === '/devices') {
            bot.sendMessage(chatId, 'Устройств пока нет.');
        }
    });

    return bot;
}

module.exports = { setupBot };