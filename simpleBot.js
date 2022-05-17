const { default: axios } = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');
const nodeTelegramBotApi = require('node-telegram-bot-api');
const log = console.log;

const TelegramBot = require('node-telegram-bot-api');
const token = '';
const bot = new TelegramBot(token, {polling: true});
const siteurl = "https://www.dogdrip.net/";
const board = "dogdrip";

let dogdrip_data = null;

/*
    Main: https://www.dogdrip.net/
    개드립: dogdrip
    유저개드립: userdog

    td > clsss: title
    td > class: author

    ver. 0.1
*/

const getHtml = async() => {
    try {
        return await axios.get(siteurl + board);
    } catch (error) {
        console.error(error);
    }
};


const getTitleArr = (arr) => {
    const resultArr = [];
    for (let i=0; i<arr.length - 19; i+= 19) {
        let tt = [];
        for (let j=i;j<i+19;j++) {
            if(arr[j] !== '') {
                tt.push(arr[j]);
            }
        }
        resultArr.push(tt);
    }
    return resultArr;
}

schedule.scheduleJob('*/10 * * * * *', () => {
    dogdrip();
    if(dogdrip_data?.length) {
        const data = dogdrip_data.split('+');
        bot.sendMessage(
            '@channel',
            '<strong>개드립 새글 알림</strong>\n' + data[0], 
            {
            reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "바로가기",
                        url: siteurl + board + '/' + data[1],
                      }
                    ],
                  ],
                }, 
               parse_mode: 'HTML'
            }
        )
    }

    console.log(dogdrip_data);
});

let prev_link = 0;

const dogdrip = () => getHtml().then((html) => {
    const $ = cheerio.load(html.data);
    let dogdrip_data = null;
    const link = $('tr:not(.notice) td.title span a').attr('href').split('/')[3];
    if((prev_link == 0) || (prev_link == link)) { 
        console.log('같지 않아요~~');
        prev_link = link;
        console.log(prev_link);
    } else {
        const tmp_nick = $('tr:not(.notice) td.author').text().replace(/[\t\s*]/g, '').split('\n');
        const username = getTitleArr(tmp_nick);
        const data = $('tr:not(.notice) td span.ed:not(.ed.text-primary)').text().replace(/[\t]/g, '').split('\n');
        const formatedArr = getTitleArr(data);
        dogdrip_data = formatedArr[0][0] + '+' + link;
        prev_link = link;
    } 

    return dogdrip_data;
}).then(res => dogdrip_data = res);
