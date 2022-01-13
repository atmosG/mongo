const express = require('express');
const app = express();
const PORT = 8080
const CONNECT_STRING = 'mongodb://khg93:1q2w3e4r@cluster0-shard-00-00.dkcev.mongodb.net:27017,cluster0-shard-00-01.dkcev.mongodb.net:27017,cluster0-shard-00-02.dkcev.mongodb.net:27017/todoapp?ssl=true&replicaSet=atlas-um0pft-shard-0&authSource=admin&retryWrites=true&w=majority'

// 포트번호로 서버 열어주기
// app.listen(PORT, function(){
//     console.log('listening on 8080')
// })

// 몽고db 연결하기
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(CONNECT_STRING, function(에러, client){
    if (에러) return console.log(에러)

    const db = client.db('todoapp');
    const 저장할데이터 = { 이름 : 'Kim', 나이 : 20 };
    db.collection('post').insertOne(저장할데이터, function(에러, 결과){
        console.log('저장완료');
    });

    app.listen(PORT, function() {
        console.log('몽고db와 연뎔된 8080')
    })
    
})

app.use(express.static(`${__dirname}`))
// 내가 정한 경로로 들어오면 아래와 같은 응답을 보내주겠음
app.get('/', function(요청, 응답){
    응답.sendFile(`${__dirname}/index.html`)
})

app.get('/post', function(요청, 응답){
    응답.sendFile(`${__dirname}/post.html`)
})

// POST 처리하기
app.use(express.json());
app.use(express.urlencoded( {extended : true} ));

app.post('/add', function(요청, 응답){
    응답.send('전송완료')
    요청내용 = 요청.body
    console.log(요청내용, typeof 요청내용)
})


