const http = require('http');
const querystring = require('querystring');
const fs = require('fs');


const contents = querystring.stringify({
    ecp_token: '58391f6e8d264fe8bd6a849071394c0d',
    name: 'com.ygsoft.ecp.ecplive.service.context.IEcpServiceCenterQuestionQueryContext.queryRandomQuestion',
    params:'["wumansi@ygsoft.com",1,"开发","顺序模式","ECPONLINEQUESTION"]'
});

const queryOpt = {
    host: 'ecp.ygsoft.com',
    port:9080,
    // 这个长连接选项很关键，不加的话，几次请求之后，TCP连接就断开了，就会报错：read ECONNRESET
    Connection:"keep-alive",
    path: '/grm/ecp/webcore/remoteService',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Cookie':'JSESSIONID=crJTbQfJWx1hs5N1FvHNQ9zW6nHmh89xHLJdnHpCvBFTfJ7SzH2d!-1540634555; ecp_remember_userName=wumansi%40ygsoft.com; sk_id=97KrehM41pic; ecpDataContext.tokenId=58391f6e8d264fe8bd6a849071394c0d; ecp_login_companyCode=9999; ecp_login_companyName=%E8%BF%9C%E5%85%89%E8%BD%AF%E4%BB%B6%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8; ecp_login_userName=wumansi%40ygsoft.com; ecp_login_displayName=%E5%90%B4%E8%94%93%E6%80%9D',
        'Referer':'http://ecp.ygsoft.com:9080/grm/ecplearn/portal/pages/ecp_online_question.html',
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
    }
};

function queryQuestion(){
    return new Promise((resolve)=>{
        let req = http.request(queryOpt, function(res) {
            res.setEncoding('UTF-8');
            res.on('data', function (data) {
                data = JSON.parse(data)[0];
                resolve({
                    qText:data.questext,
                    sels:handleSelections(data),
                    exp:data.quesabout,
                    id:data.id,
                    answer:data.answer
                });
            });
        });

        req.write(contents);
        req.end();
    });
}

let ansOrder = ["A","B","C","D","E","F","G","H","I"];

function handleSelections(data){
    let ret = [];
    for(let key in data){
        if(key.startsWith("item")){
            var i = parseInt(key.substr(4)) - 1;
            ret.push(`${ansOrder[i]}:${data[key]}`);
        }
    }
    return ret;
}

function sendAns(data){
    return new Promise((resolve)=>{
        let req = http.request(queryOpt, function(res) {
            res.setEncoding('UTF-8');
            res.on('data', function (d) {
                resolve(data);
            });
        });

        req. write(querystring.stringify({
            ecp_token: '58391f6e8d264fe8bd6a849071394c0d',
            params:'["wumansi@ygsoft.com","'+data.id+'","'+data.answer+'","ECPONLINEQUESTION","开发"]',
            name:'com.ygsoft.ecp.ecplive.service.context.IEcpServiceCenterQuestionQueryContext.quesProcess'
        }));
        req.end();
    });
}

let count = 640;
function handleSingleAns(){
    return queryQuestion().then((data)=>{
       return sendAns(data);
       //  return data;
    }).then((data)=>{
        // console.log("发送答案成功");
        return append(data)
    }).then(()=>{
        count--;
    }).catch((e)=>{
        console.log(e)
    })
}

function append(item){
    return new Promise((res)=>{
        let text = `##6685##\r\n${item.qText} 正确答案：${item.answer}`;
        item.sels.forEach((answer)=>{
            text += `\r\n${answer}`;
        });
        text += `\r\n【解析】：${item.exp}\r\n##7785##\r\n\r\n`;

        fs.appendFile('./log.txt',text,'utf8',(e)=>{
            if(e){
                console.log(e);
            }
            res(true);
        });
    })
}



function beginFetch(){
    console.log(`剩余题目：${count}`);
    handleSingleAns().then(()=>{
        if(count <= 0){
            return ;
        }
        setTimeout(beginFetch,500);
    });
}

beginFetch();

//npm install -g forever 安装
//forever start index.js 启动
//forever list 查看日志文件