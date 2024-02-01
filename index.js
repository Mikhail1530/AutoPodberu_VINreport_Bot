const TelegramApi = require('node-telegram-bot-api')
const token = '6838248687:AAE1ohr2ciZL26u1RtLsRqH9p0cd2EBmNdI'
const axios = require('axios')
const bot = new TelegramApi(token, {polling: true})


const tokenVin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJ1c2VyIjp7ImlkIjoyMDg1MTEsImVtYWlsIjoiYXV0b3BvZGJlcnUxKzFAZ21haWwuY29tIn0sInZlbmRvciI6eyJpZCI6MjczLCJzdGF0dXMiOiJhY3RpdmUiLCJpcCI6WyIxNzIuMjAuMTAuMyIsIjU0Ljg2LjUwLjEzOSIsIjE4NS4xMTUuNC4xNDciLCIxODUuMTE1LjUuMjgiLCI1LjE4OC4xMjkuMjM2Il19LCJpYXQiOjE3MDYwMTI1NzQsImV4cCI6MTcwODYwNDU3NH0.D5hOhF4CUOcMlyE4meRRPggfnZpKejKgDcHrlAWM6e4'
const tokenPayment = '381764678:TEST:77012'
const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
    responseType: "arraybuffer",
    headers: {
        Authorization: `Bearer ${tokenVin}`,
    },
});

// variables to dataBase
let listUsersWithCheckPoints = {}
let listChecksPerMonth = 0
let listChecksAll = 0
let listChatIdUsers = ['2133980094', '2133980092', '2133980194', '2133980192', '2133280194']
const danila_ID = 342056317
// const danila_ID = 2133980094


let success = 0
let notSend = 0
const resetFunction = () => {
    success = 0
    notSend = 0
}
const resetVarPerMonth = () => {
    setInterval(() => {
        listChecksPerMonth = 0
    }, 30 * 24 * 60 * 60)
}


const KEYBOARD = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['💳 Купить проверки ($)', '⚖ Проверить остаток проверок'],
            ['✅ VIN'],
        ],
        resize_keyboard: true
    })
}
const KEYBOARD_ADMIN = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['☎ Статистика проверок', '💌 Рассылка для контактов'],
            ['🤙 Статистика последних отправленных']
        ],
        resize_keyboard: true
    })
}
const checksOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Купить 1 проверку (5$)', callback_data: 'OneCheckVIN'}],
            [{text: 'Купить 3 проверки (14$)', callback_data: 'ThreeCheckVIN'}],
            [{text: 'Купить 5 проверок (20$)', callback_data: 'FiveCheckVIN'}]
        ]
    })
}
const start = () => {
    // reset variable (listChecksPerMonth) every 30 days
    resetVarPerMonth()

    bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
    ])
    bot.onText(/(.+)/, async (msg, match) => {

        if (match[0] == '/start' && msg.from.id === danila_ID) {
            return bot.sendMessage(msg.chat.id, 'Привет Danila 👋🏻', KEYBOARD_ADMIN)
        }

        if (match[0] == '/start') {
            !listChatIdUsers.includes(msg.chat.id) ? listChatIdUsers.push(msg.chat.id) : ''
            return bot.sendMessage(msg.chat.id, 'Привет кукушкин 👋🏻, залетай на покупки. Подпишись туда-сюда и дадим проверку еблантий ты нелепый', KEYBOARD)
        }

        if (match[0] == '💳 Купить проверки ($)') {
            return bot.sendMessage(msg.chat.id, 'Выберете нужное количество', checksOptions)
        }

        if (match[0] == '✅ VIN' && Object.keys(listUsersWithCheckPoints).includes(`${msg.from.id}`)) {
            return bot.sendMessage(msg.chat.id, 'Введите <b>VIN</b> авто (<i>17 символов</i>)', {parse_mode: 'HTML'})
        }

        if (match[0].length === 17 && Object.keys(listUsersWithCheckPoints).includes(`${msg.from.id}`)) {
            //  запрос за проверкой по VIN - сделать try catch
            await bot.sendMessage(msg.chat.id, 'Запрос сделан', KEYBOARD)
            // if request is valid -> listChecksAll += 1 and listChecksPerMonth += 1
            listUsersWithCheckPoints[msg.from.id] > 0 ? listUsersWithCheckPoints[msg.from.id] -= 1 : await bot.sendMessage(msg.chat.id, 'У вас не осталось проверок', KEYBOARD)
            listChecksAll += 1
            listChecksPerMonth += 1
        }

        if (match[0] == '⚖ Проверить остаток проверок') {
            const userChecks = listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] : 0
            return bot.sendMessage(msg.chat.id, `У вас осталось проверок: ${userChecks}`)
        }


        if (match[0] == '💌 Рассылка для контактов' && msg.from.id === danila_ID) {
            return bot.sendMessage(msg.chat.id, `\n<b>1) картинка и текст:</b> Отправляй фото и описание к ней.\n<b>2) просто текст:</b> Поставить звездочку (*) перед строкой.\n(<i>пример:</i> *куку галоши) `, {parse_mode: 'HTML'})
        }
        if (match[0] == '🤙 Статистика последних отправленных' && msg.from.id === danila_ID) {
            await bot.sendMessage(msg.from.id, `\n<i>Сообщения получено:</i> ${success}\n<i>Сообщений не доставлено:</i> ${notSend}`, {parse_mode: 'HTML'})
        }
        if (match[0] == '☎ Статистика проверок' && msg.from.id === danila_ID) {
            return bot.sendMessage(msg.chat.id, `\n<b>Всего проверок:</b> <i>${listChecksAll}</i>\n<b>Проверок за месяц:</b> <i>${listChecksPerMonth}</i>`, {parse_mode: 'HTML'})
        } else {
            msg.chat.id !== danila_ID ? await bot.sendMessage(msg.chat.id, 'Неизвестная команда, выберете команду в меню кнопок') : ''
        }
    })


    // block for sending messages (only for Danila) --------------
    bot.on('photo', async msg => {
        const chatId = msg.chat.id
        if (chatId === danila_ID) {
            resetFunction()
            listChatIdUsers.map(async (id, i) => {
                try {
                    await bot.sendPhoto(id, msg.photo[1].file_id, {caption: msg.caption}).then(res => success += 1)
                } catch (e) {
                    notSend += 1
                }
                listChatIdUsers.length - 1 === i ? await bot.sendMessage(chatId, 'Сообщения отправлены') : ''
            })
        }
    })
    bot.on('text', async msg => {
        const chatId = msg.chat.id
        if (chatId === danila_ID && msg.text.slice(0, 1) === '*') {
            resetFunction()
            listChatIdUsers.map(async (id, i) => {
                try {
                    await bot.sendMessage(id, msg.text.slice(1)).then(res => success += 1)
                } catch (e) {
                    notSend += 1
                }
                listChatIdUsers.length - 1 === i ? await bot.sendMessage(chatId, 'Сообщения отправлены') : ''
            })
        }
    })
    const payId = []

    // payment block -----------------------------
    bot.on('callback_query', async msg => {
        const data = msg.data
        const chatId = msg.message.chat.id

        if (data === 'OneCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '1 check VIN',
                'Одина раз вы можете получить информацию об авто по VIN номеру',
                'payload',
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 45000
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return bot.sendMessage(ctx.id, 'Ошибка платежа')
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (payId.includes(ctx.message_id)) {return}
                    payId.push(ctx.message_id)
                    await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                    await listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 1 : listUsersWithCheckPoints[msg.from.id] = 1
                    return bot.sendMessage(ctx.chat.id, 'Вы приобрели одну проверку по VIN номеру', KEYBOARD)
                } catch (error) {
                    await bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }


        if (data === 'ThreeCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '3 checks VIN',
                'Три раз вы можете получить информацию об авто по VIN номеру',
                'payload3',
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 89000
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return bot.sendMessage(ctx.id, 'Ошибка платежа')
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (payId.includes(ctx.message_id)) {return}
                    payId.push(ctx.message_id)
                    await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                    await listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 3 : listUsersWithCheckPoints[msg.from.id] = 3
                    return bot.sendMessage(chatId, 'Вы приобрели 3 проверки по VIN номеру', KEYBOARD)
                } catch (error) {
                    await bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }


        if (data === 'FiveCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '5 checks VIN',
                'Пять раз вы можете получить информацию об авто по VIN номеру',
                'payload5',
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 99000
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return bot.sendMessage(ctx.id, 'Ошибка платежа')
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (payId.includes(ctx.message_id)) {return}
                    payId.push(ctx.message_id)
                    await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                    await listUsersWithCheckPoints[msg.from.id] ? listUsersWithCheckPoints[msg.from.id] += 5 : listUsersWithCheckPoints[msg.from.id] = 5
                    return bot.sendMessage(chatId, 'Вы приобрели 5 проверок по VIN номеру', KEYBOARD)
                } catch (error) {
                    await bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }
    })
}
start()


