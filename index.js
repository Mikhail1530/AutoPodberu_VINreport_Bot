const TelegramApi = require('node-telegram-bot-api')
const token = '6838248687:AAE1ohr2ciZL26u1RtLsRqH9p0cd2EBmNdI'
const axios = require('axios')
const bot = new TelegramApi(token, {polling: true})


const tokenVin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJ1c2VyIjp7ImlkIjoyMDg1MTEsImVtYWlsIjoiYXV0b3BvZGJlcnUxKzFAZ21haWwuY29tIn0sInZlbmRvciI6eyJpZCI6MjczLCJzdGF0dXMiOiJhY3RpdmUiLCJpcCI6WyIxNzIuMjAuMTAuMyIsIjU0Ljg2LjUwLjEzOSIsIjE4NS4xMTUuNC4xNDciLCIxODUuMTE1LjUuMjgiLCI1LjE4OC4xMjkuMjM2Il19LCJpYXQiOjE3MDYwMTI1NzQsImV4cCI6MTcwODYwNDU3NH0.D5hOhF4CUOcMlyE4meRRPggfnZpKejKgDcHrlAWM6e4'
const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
    responseType: "arraybuffer",
    headers: {
        Authorization: `Bearer ${tokenVin}`,
    },
});


let listUsersWithCheckPoints = {}
let listChecksPerMonth = 0
let listChecksAll = 0
// const danila_ID = 342056317
const danila_ID = 2133980094

// ---add two buttons for Danila---
// let lastResetDate = new Date();
// function resetVariable() {
//     listChecksPerMonth = 0;
// }
// function shouldReset() {
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth();
//     const lastResetMonth = lastResetDate.getMonth();
//
//     if (currentMonth !== lastResetMonth) {
//         lastResetDate = currentDate;
//
//         resetVariable();
//     }
// }


const KEYBOARD = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['Купить проверки ($)', 'Проверить остаток проверок'],
            ['/VIN'],
        ],
        resize_keyboard: true
    })
}
const KEYBOARD_ADMIN = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['Статистика проверок', 'Рассылка']
        ],
        resize_keyboard: true
    })
}
const checksOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Купить 1 проверку (4$)', callback_data: 'OneCheckVIN'}],
            [{text: 'Купить 3 проверки (10$)', callback_data: 'ThreeCheckVIN'}],
            [{text: 'Купить 5 проверок (15$)', callback_data: 'FiveCheckVIN'}]
        ]
    })
}
const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
    ])
    bot.onText(/(.+)/, async (msg, match) => {

         if (match[0] == '/start' && msg.from.id === danila_ID) {
            return bot.sendMessage(msg.chat.id, 'Привет Danila', KEYBOARD_ADMIN)
        }
        if (match[0] == '/start') {
            return bot.sendMessage(msg.chat.id, 'Привет кукушкин, залетай на покупки. Подпишись туда-сюда и дадим проверку ёба', KEYBOARD)
        }
        if (match[0] == 'Купить проверки ($)') {
            return bot.sendMessage(msg.chat.id, 'Выберете нужное количество', checksOptions)
        }

        if (match[0] == '/VIN' && Object.keys(listUsersWithCheckPoints).includes(`${msg.from.id}`)) {
            return bot.sendMessage(msg.chat.id, 'Введите VIN авто (17 символов)', KEYBOARD)
        }
        if (match[0].length === 17 && Object.keys(listUsersWithCheckPoints).includes(`${msg.from.id}`)) {
            //  запрос за проверкой по VIN - сделать try catch
            await bot.sendMessage(msg.chat.id, 'Запрос сделан', KEYBOARD)
            // if request is valid -> listChecksAll += 1 and listChecksPerMonth += 1
            listUsersWithCheckPoints[msg.from.id] > 0 ? listUsersWithCheckPoints[msg.from.id] -= 1 : await bot.sendMessage(msg.chat.id, 'У вас не осталось проверок', KEYBOARD)
            listChecksAll += 1
            listChecksPerMonth += 1
        }
        if (match[0] == 'Проверить остаток проверок') {
            const userChecks = listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] : 0
            return bot.sendMessage(msg.chat.id, `У вас осталось проверок: ${userChecks}`,)
        }
        if (match[0] == 'Рассылка' && msg.from.id === danila_ID) {
            // send message to all
            return bot.sendMessage(msg.chat.id, 'Привет, Курчявенький', KEYBOARD_ADMIN)
        }
        if (match[0] == 'Статистика проверок' && msg.from.id === danila_ID) {
            return bot.sendMessage(msg.chat.id, `\n<b>Всего проверок:</b> <i>${listChecksAll}</i>\n<b>Проверок за месяц:</b> <i>${listChecksPerMonth}</i>`, {parse_mode: 'HTML'})
        } else {
            bot.sendMessage(msg.chat.id, 'Неизвестная команда')
        }
    })


    bot.on('callback_query', async msg => {
        const data = msg.data
        const chatId = msg.message.chat.id

        if (data === 'OneCheckVIN') {
            // await response success and add one point opposite id
            await listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 1 : listUsersWithCheckPoints[msg.from.id] = 1
            return bot.sendMessage(chatId, 'Вы приобрели одну проверку по VIN номеру', KEYBOARD)
        }
        if (data === 'ThreeCheckVIN') {
            // await response success and add one point opposite id
            listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 3 : listUsersWithCheckPoints[msg.from.id] = 3
            return bot.sendMessage(chatId, 'Вы приобрели 3 проверки по VIN номеру', KEYBOARD)
        }
        if (data === 'FiveCheckVIN') {
            // await response success and add one point opposite id
            listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 5 : listUsersWithCheckPoints[msg.from.id] = 5
            await bot.sendMessage(chatId, 'Вы приобрели 5 проверок по VIN номеру', KEYBOARD)

        }
    })
}
start()


