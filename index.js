const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios')
const token = '6838248687:AAE1ohr2ciZL26u1RtLsRqH9p0cd2EBmNdI'
const bot = new TelegramApi(token, {polling: true})
const fsPromises = require('fs').promises
const sequelize = require('./db')
const Client = require('./models')
const pdf = require('html-pdf');

const tokenPayment = '381764678:TEST:77012'
const instance = axios.create({
    baseURL: "https://www.clearvin.com/rest/vendor/",
});

// static variables---------
const danila_ID = 342056317
const telegramChannelId = '-1001815620648'
const greetings = `<b>Приветствую тебя!</b> 👋 \n\nЯ - бот-специалист по отличным предложениям в выборе автомобиля, также я умею узнавать информацию об авто по VIN-номеру! \nБуду присылать тебе экспертные советы и интересные новости из мира авто. 🚗💨 \n\n<b><i><u>Подпишись на наш канал</u></i></b>, чтобы быть в курсе всех последних анонсов и эксклюзивных предложений + получи одну <b>бесплатную проверку</b> для авто. 💼🛣️\nt.me/autopodberu`

let success = 0
let notSend = 0

const tokenTest = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnZpcm9ubWVudCI6InRlc3QiLCJ1c2VyIjp7ImlkIjoyMDg1MTEsImVtYWlsIjoiYXV0b3BvZGJlcnUxKzFAZ21haWwuY29tIn0sInZlbmRvciI6eyJpZCI6MjczLCJzdGF0dXMiOiJhY3RpdmUiLCJpcCI6WyIxNzIuMjAuMTAuMyIsIjU0Ljg2LjUwLjEzOSIsIjE4NS4xMTUuNC4xNDciLCIxODUuMTE1LjUuMjgiLCI1LjE4OC4xMjkuMjM2Il19LCJpYXQiOjE3MDc5MzM1ODksImV4cCI6MTcxMDUyNTU4OX0.t89d5DSDpQisJtJ9CCr_ZBlihPn61UcGKS8riI30AGY'


const KEYBOARD = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['💳 Купить проверки ($)', '⚖ Узнать остаток проверок'],
            ['✅ VIN', '👍 Бесплатная проверка'],
        ],
        resize_keyboard: true,
    }),
    parse_mode: 'HTML'
}
const KEYBOARD_ADMIN = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['☎ Статистика проверок', '💌 Рассылка для контактов'],
            ['🤙 Статистика последних отправленных']
        ],
        resize_keyboard: true
    }),
    parse_mode: 'HTML'
}
const checksOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: '1 проверка (380р или 4$)', callback_data: 'OneCheckVIN'}],
            [{text: '3 проверки (1026р или 10.8$)', callback_data: 'ThreeCheckVIN'}],
            [{text: '5 проверок (1520р или 16$)', callback_data: 'FiveCheckVIN'}]
        ]
    }),
    parse_mode: "HTML"
}


const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Connect data failed', e)
    }

    await bot.setMyCommands([
        {command: '/start', description: 'Запустить бота'},
    ])

    bot.onText(/(.+)/, async (msg, match) => {
        const chatId = msg.chat.id


        try {
            if (match[0] === '/start' && chatId === danila_ID) {
                return bot.sendMessage(chatId, 'Здравствуй, курчявенький Данилкин 👋🏻', KEYBOARD_ADMIN)
            }
            if (match[0] === '/start') {
                try {
                    await Client.create({chatId: chatId})
                    return bot.sendMessage(chatId, greetings, KEYBOARD)
                } catch (e) {
                    const user = await Client.findOne({where: {chatId: chatId}})
                    return user && bot.sendMessage(chatId, 'Бот уже запущен', KEYBOARD)
                }
            }
            if (match[0] === '👍 Бесплатная проверка') {
                try {
                    const res = await bot.getChatMember(telegramChannelId, chatId)
                    const validFreeCheck = await Client.findOne({where: {chatId: chatId}})

                    if (res.status === 'member' && !validFreeCheck.freeCheck) {
                        try {
                            await Client.increment('checks', {by: 1, where: {chatId: chatId}})
                            await Client.update({freeCheck: true}, {where: {chatId: chatId}})
                            return bot.sendMessage(chatId, 'Вы подписаны на канал <b>AutoPodberu</b> и за это мы дарим вам одну <b>бесплатную проверку</b> по VIN номеру для авто', {parse_mode: 'HTML'})
                        } catch (e) {
                            console.log(e, 'Ошибка получения проверок за подписку')
                        }
                    }
                    if (res.status === 'member' && validFreeCheck.freeCheck) {
                        return bot.sendMessage(chatId, 'Вы уже получили бесплатную проверку за подписку на наш телеграм-канал <i><b>AutoPodberu</b></i>.\n\nНо вы всегда можете приобрести проверки нажав на кнопку <b>💳 Купить проверки ($)</b>', {parse_mode: 'HTML'})
                    }
                    if (res.status === 'left') {
                        return bot.sendMessage(chatId, "Вы не подписаны на канал <i><b>AutoPodberu</b></i>, чтобы получить бесплатну проверку по VIN номеру необходимо подписаться на наш телеграм-канал <b>t.me/autopodberu</b>\n\nПосле подписки снова нажмите на кнопку <b>'👍 Получить бесплатную проверку'</b>\n\n", {parse_mode: 'HTML'})
                    } else {
                        await bot.sendMessage(chatId, 'Попробуйте еще раз нажать на кнопку')
                    }
                } catch (e) {
                    return bot.sendMessage(chatId, 'Ошибка')
                }
            }
            if (match[0] === '💳 Купить проверки ($)') {
                return bot.sendMessage(chatId, '<i>Выберете нужное количество 🎳</i>', checksOptions)
            }
            if (match[0] === '✅ VIN') {
                return bot.sendMessage(chatId, 'Если у вас есть доступные проверки, то просто вбейте в строку ввода <b><i>VIN номер</i></b> (<i>17 символов</i>) и получите подробную информацию об автомобиле в <i>PDF-файле</i> 📂\n\nОстаток проверок можно узнать нажав на соответствующую кнопку ⚖', {parse_mode: 'HTML'})
            }
            if (match[0].length === 17) {
                const user = await Client.findOne({where: {chatId: chatId}})
                if (user.checks === 0) {
                    return bot.sendMessage(chatId, 'К сожалению, у вас нет доступных проверок по VIN номеру.\n\nНо вы всегда можете их приобрести нажав на кнопку <b>💳 Купить проверки ($)</b>', {parse_mode: 'HTML'})
                }

                if (user.checks > 0) {
                    await bot.sendMessage(chatId, 'Запрос займет немного времени, ожидайте')
                    const url = `report?vin=${msg.text}&format=pdf&reportTemplate=2021`

                    const objTokenDate = await fsPromises.readFile('../token.js', 'utf8')
                    const time = JSON.parse(objTokenDate).date
                    const timeNow = Math.floor(new Date().getTime() / 1000)

                    if ((timeNow - time) > 7140) {
                        const result = await instance.post('login', {
                            email: "autopodberu1+1@gmail.com",
                            password: "TViGgDAg"
                        })
                        const obj = JSON.stringify({token: result.data.token, date: timeNow})
                        await fsPromises.writeFile('../token.js', obj)
                    }

                    try {
                        const getToken = await fsPromises.readFile('../token.js', 'utf8')
                        const tokenVin = JSON.parse(getToken).token
                        const {data} = await instance.get(url, {
                            headers: {Authorization: `Bearer ${tokenVin}`},
                            responseType: "arraybuffer"
                        })
                        await fsPromises.writeFile(`./${chatId}file.pdf`, data, {encoding: 'binary'});
                        await bot.sendDocument(chatId, `./${chatId}file.pdf`, {}, {
                            filename: `${chatId}file.pdf`,
                            contentType: 'application/pdf'
                        })
                        await fsPromises.unlink(`./${chatId}file.pdf`)
                        await Client.decrement('checks', {by: 1, where: {chatId: chatId}})
                    } catch (e) {
                        await bot.sendMessage(chatId, 'Такого VIN номера в базе нет')
                    }
                }
            }
            if (match[0] === '⚖ Узнать остаток проверок') {
                const check = await Client.findOne({where: {chatId: chatId}})
                return bot.sendMessage(chatId, `У вас осталось проверок: <b>${check.checks}</b>`, {parse_mode: 'HTML'})
            }


            if (match[0] === 'convert') {
                const vin = '5TDYK3DC8DS290235'
                const url = `report?vin=${vin}&format=html&reportTemplate=2021&locale=ru`
                const {data} = await instance.get(url, {
                    headers: {Authorization: `Bearer ${tokenTest}`},
                })
                await fsPromises.writeFile(`./${chatId}file.html`, data.result.html_report);


                fsPromises.readFile(`./${chatId}file.html`, 'utf-8')
                    .then(htmlContent => {
                        // Convert HTML to PDF
                        return pdf.create(htmlContent).toFile(`./${chatId}file.pdf`);
                    })
                    .then(res => {
                        console.log('PDF created successfully:');
                    })
                    .catch(err => {
                        console.error('Error:', err);
                    });


                await bot.sendDocument(chatId, `./${chatId}file.pdf`, {}, {
                    filename: `${chatId}file.pdf`,
                    contentType: 'application/pdf'
                }).catch(e => console.log(e))

                await fsPromises.unlink(`./${chatId}file.html`)
                await fsPromises.unlink(`./${chatId}file.pdf`)
            }


            // Block options Danila
            if (match[0] === '💌 Рассылка для контактов' && chatId === danila_ID) {
                return bot.sendMessage(chatId, `\n<b>1) Чтобы разослать картинку и текст подписчикам:</b> <i>Просто отправляй фото и описание к ней.</i>\n\n<b>2) Чтобы отправить текст без картинки:</b> <i>Необходимо поставить две звездочки (**) перед сообщением. (например: **Привет человеки)</i>`, {parse_mode: 'HTML'})
            }
            if (match[0] === '🤙 Статистика последних отправленных' && chatId === danila_ID) {
                await bot.sendMessage(chatId, `\n<i>Сообщения получено:</i> ${success}\n<i>Сообщений не доставлено:</i> ${notSend}`, {parse_mode: 'HTML'})
            }
            if (match[0] === '☎ Статистика проверок' && chatId === danila_ID) {
                const res = await Client.findAll()
                const freeChecks = await Client.findAll({where: {freeCheck: true}})
                const allChecks = res.map(c => c['dataValues']['checks']).reduce((acc, cur) => {
                    acc += cur
                    return acc
                }, 0)
                // const freeChecks = res.map(c => c['dataValues']['freeChecks']).filter(c=>c === true)
                return bot.sendMessage(chatId, `\n<b>Всего проверок куплено:</b> <i>${allChecks - freeChecks.length}</i>\n<b>Активированные проверки за подписку:</b> <i>${freeChecks.length}</i>`, {parse_mode: 'HTML'})
            } else {
                chatId !== danila_ID ? await bot.sendMessage(chatId, 'Неизвестная команда, выберете доступные опции в меню кнопок') : ''
            }
        } catch (e) {
            await bot.sendMessage(chatId, 'Something crashed on the server')
        }
    })


    // block for sending messages (only Danila can) --------------
    bot.on('photo', async msg => {
        const chatId = msg.chat.id
        if (chatId === danila_ID) {
            success = 0
            notSend = 0
            const res = await Client.findAll()
            const listIdUsers = res.map(u => u["dataValues"]['chatId'])

            listIdUsers.map(async (id, i) => {
                try {
                    await bot.sendPhoto(id, msg.photo[1].file_id, {caption: msg.caption}).then(res => success += 1)
                } catch (e) {
                    notSend += 1
                }
                listIdUsers.length - 1 === i ? await bot.sendMessage(chatId, 'Сообщения отправлены') : ''
            })
        } else {
            return bot.sendMessage(chatId, 'Неизвестная команда, выберете доступные опции в меню кнопок')
        }
    })
    bot.on('text', async msg => {
        const chatId = msg.chat.id
        if (chatId === danila_ID && msg.text.slice(0, 2) === '**') {
            success = 0
            notSend = 0
            const res = await Client.findAll()
            const listIdUsers = res.map(u => u["dataValues"]['chatId'])
            listIdUsers.map(async (id, i) => {
                try {
                    await bot.sendMessage(id, msg.text.slice(2)).then(res => success += 1)
                } catch (e) {
                    notSend += 1
                }
                listIdUsers.length - 1 === i ? await bot.sendMessage(chatId, 'Сообщения отправлены') : ''
            })
        }
    })


    // payment block -----------------------------
    bot.on('callback_query', async (msg) => {
        const data = msg.data
        const chatId = msg.message.chat.id
        if (data === 'OneCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '1 check VIN',
                'После оплаты вы сможете один раз получить информацию об авто по VIN номеру',
                msg.id,
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 38000
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return error ? bot.sendMessage(ctx.id, 'Ошибка платежной системы') : ''
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (ctx.successful_payment.invoice_payload === msg.id) {
                        await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                        await Client.increment('checks', {by: 1, where: {chatId: chatId}})
                        return bot.sendMessage(ctx.chat.id, 'Вы приобрели одну проверку по VIN номеру')
                    }
                } catch (error) {
                    return bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }


        if (data === 'ThreeCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '3 checks VIN',
                'После оплаты вы сможете три раза получить информацию об авто по VIN номеру',
                msg.id,
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 102600
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return bot.sendMessage(ctx.id, 'Ошибка платежной системы')
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (ctx.successful_payment.invoice_payload === msg.id) {
                        await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                        await Client.increment('checks', {by: 3, where: {chatId: chatId}})
                        return bot.sendMessage(chatId, 'Вы приобрели 3 проверки по VIN номеру', KEYBOARD)
                    }
                } catch (error) {
                    await bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }


        if (data === 'FiveCheckVIN') {
            await bot.sendInvoice(
                chatId,
                '5 checks VIN',
                'После оплаты вы сможете пять раз запросить информацию об авто по VIN номеру',
                msg.id,
                tokenPayment,
                'RUB',
                [{
                    label: 'check',
                    amount: 152000
                }]
            )
            await bot.on('pre_checkout_query', async ctx => {
                try {
                    return bot.answerPreCheckoutQuery(ctx.id, true)
                } catch (error) {
                    return bot.sendMessage(ctx.id, 'Ошибка платежной системы')
                }
            })
            await bot.on('successful_payment', async ctx => {
                try {
                    if (ctx.successful_payment.invoice_payload === msg.id) {
                        await bot.sendMessage(ctx.chat.id, `Спасибо за оплату`)
                        await Client.increment('checks', {by: 5, where: {chatId: chatId}})
                        return bot.sendMessage(chatId, 'Вы приобрели 5 проверок по VIN номеру', KEYBOARD)
                    }
                } catch (error) {
                    await bot.sendMessage(ctx.chat.id, `Ошибка оплаты`)
                }
            })
        }
    })
}
start()


