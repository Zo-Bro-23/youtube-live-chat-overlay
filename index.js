const zoauth = require('zoauth')
const express = require('express')
const app = express()
const fs = require('fs')
const cookieParser = require('cookie-parser')
const axios = require('axios')
let nextPageToken
let messages = []

app.listen(5210)
app.use(cookieParser())

app.get('/authorize', (req, resp) => {
    zoauth.setCredentials({
        google: {
            scope: ['https://www.googleapis.com/auth/youtube', 'profile', 'email'],
            grant_type: 'authorization_code'
        }
    })
    resp.redirect(zoauth.getAuthUrl('google', {access_type: 'offline', prompt: 'select_account'}))
})

app.get('/callback/google', (req, resp) => {
    zoauth.setCredentials({
        google: {
            scope: ['https://www.googleapis.com/auth/youtube', 'profile', 'email'],
            grant_type: 'authorization_code'
        }
    })

    zoauth.getToken('google', {code: req.query.code}).then(r1 => {
        zoauth.getApi('https://www.googleapis.com/oauth2/v1/userinfo', r1)
            .then(r2 => {
                fs.writeFileSync('index.html', `
                <html>
                <head>
                <title>
                You are logged in
                </title>
                </head>
                <body style='background-color: black;'>
                <p style="text-align: center;"><img style="border-radius: 50%;" src="${r2.picture.replace('s96', 's1920')}" alt="" width="244" height="244" /></p>
                <p style="text-align: center;"><span style="color: #00ccff; font-size: 36px;">Welcome,&nbsp${r2.name}</span></p>
                <p style="text-align: center;"><span style="color: #008000; font-size: 24px;">You are logged in...</span></p>
                </body>
                <script>
                setTimeout(() => window.location.replace('http://localhost:5210/nowClose'), 3000)
                </script>
                </html>
                `)
                resp.cookie('id', r2.id, {
                    path: '/',
                    expires: new Date(253402300799999)
                })
                let tokens = JSON.parse(fs.readFileSync('tokens.json'))
                for(item in tokens){
                    if(item == r2.id){
                        for(microItem in r1){
                            tokens[item][microItem] = r1[microItem]
                        }
                    }
                }
                if(!tokens[r2.id]){
                    tokens[r2.id] = r1
                }
                fs.writeFileSync('tokens.json', JSON.stringify(tokens, null, 4))
                resp.sendFile('index.html', {root: __dirname})
            })
            .catch(err2 => resp.send(err2))
    }).catch(err1 => resp.send(err1))
})

app.get('/chat', (req, resp) => {
    if(!req.cookies.id){
        resp.redirect('/authorize')
    }else if(!req.query.id){
        resp.status(400)
        resp.send('No id specified.')
        return
    }

    zoauth.setCredentials({
        google: {
            scope: ['https://www.googleapis.com/auth/youtube', 'profile', 'email'],
            grant_type: 'refresh_token'
        }
    })

    fs.writeFileSync(`${req.query.id}.html`, `
    <html>
    <head>
    <title>
    YouTube Live Chat
    </title>
    </head>
    <body id='body'>
    </body>
    </html>
    `)

    resp.sendFile(`${req.query.id}.html`, {root: __dirname})
})

app.get('/nowClose', (req, resp) => {
    resp.sendFile('now-close.html', {root: __dirname})
})

app.get('/obs/authorize', (req, resp) => {
    axios.post('https://oauth2.googleapis.com/device/code', {
        'client_id': '916671016794-g4m2ib4h0m7v7dac2ge4i8h9p92bfic9.apps.googleusercontent.com',
        'scope': 'https://www.googleapis.com/auth/youtube profile email'
    })
    
    .then(r1 => resp.send(r1.data)).catch(err1 => console.log(err1))
})