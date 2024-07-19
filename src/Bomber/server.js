const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server is running on ws://localhost:8080');

const clients = new Map();

wss.on('connection', (ws) => {
    console.log('Player connected');

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'register') {
            const playerName = parsedMessage.name;
            clients.set(ws, playerName);
            broadcastMessage(JSON.stringify({
                type: 'playerConnected',
                name: playerName
            }), ws);
        } else if (parsedMessage.type === 'chat') {
            const playerName = clients.get(ws);
            const chatMessage = parsedMessage.message;
            broadcastMessage(JSON.stringify({
                type: 'chat',
                name: playerName,
                message: chatMessage
            }), ws);
        }
    });

    ws.on('close', () => {
        const playerName = clients.get(ws);
        clients.delete(ws);
        broadcastMessage(JSON.stringify({
            type: 'playerDisconnected',
            name: playerName
        }), ws);
    });
});

function broadcastMessage(message, senderWs) {
    const parsedMessage = JSON.parse(message);

    clients.forEach((_, client) => {
        if (parsedMessage.type === 'playerConnected' || parsedMessage.type === 'playerDisconnected') {
            if (client !== senderWs && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        } else if (parsedMessage.type === 'chat') {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });
}