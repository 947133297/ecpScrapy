const rf = require("fs");
const http = require('http');
const url = require('url');

rf.readFile("../log.txt", 'utf-8', function (err, data) {
    let arr = data.split("##6685##");
    handleSingleItem(arr[1]);
    let items = {};
    arr.forEach((val) => {
        if (val.trim().length === 0) {
            return;
        }
        let target = handleSingleItem(val);
        items[target.question] = target;
    });
    openSrv(Object.keys(items).map((val) => {
        return items[val];
    }));
});

function handleSingleItem(val) {
    let lines = val.trim().split('\r\n');
    let head = lines.splice(0, 1)[0];
    let answerIndex = head.lastIndexOf("正确答案");
    if(answerIndex === -1){
        answerIndex = head.length;
    }
    let question = head.substr(0, answerIndex);
    let answer = head.substr(answerIndex);
    let content = lines.reduce((res, val) => {
        return res + "<br />" + val;
    });
    return {
        question, answer, content
    }
}

function openSrv(items) {
    http.createServer(function (req, res) {
        if (req.url === "/size") {
            resp(res, {
                size: items.length
            })
        } else if (req.url.startsWith("/fetch")) {
            let index = url.parse(req.url, true).query.index;
            if(index < items.length && index >= 0){
                resp(res, items[index]);
            }else{
                resp(res,{})
            }
        } else if (req.url.startsWith("/page")) {
            let page = rf.readFileSync("index.html", "utf-8");
            respHtml(res, page);
        }

    }).listen(8888);

    console.log('服务器开启成功，访问http://localhost:8888/page');
}

function resp(res, json) {
    res.writeHeader(200, {
        'content-type': 'text/json;charset="utf-8"'
    });
    res.write(JSON.stringify(json));
    res.end();
}


function respHtml(res, page) {
    res.writeHeader(200, {
        'content-type': 'text/html;charset="utf-8"'
    });
    res.write(page);
    res.end();
}
