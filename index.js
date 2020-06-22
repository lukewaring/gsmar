require('dotenv').config()

const express = require('express')
const path = require('path')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

app.use(express.urlencoded({ extended: true }))
app.use('/static', express.static('public'))

app.use(require('express-session')({
  secret: process.env.APP_SECRET,
  resave: true,
  saveUninitialized: false
}))

// Check .env vars
const { ExpressOIDC } = require('@okta/oidc-middleware')
const oidc = new ExpressOIDC({
  issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  appBaseUrl: process.env.HOST_URL,
  redirect_uri: `${process.env.HOST_URL}/authorization-code/callback`,
  scope: 'openid profile'
})

app.use(oidc.router)

app.use('/register', require('./routes/register'))

app.get('/logout', (req, res) => {
  if (req.userContext) {
    const idToken = req.userContext.tokens.id_token
    const to = encodeURI(process.env.HOST_URL)
    const params = `id_token_hint=${idToken}&post_logout_redirect_uri=${to}`
    req.logout()
    res.redirect(`${process.env.OKTA_ORG_URL}/oauth2/default/v1/logout?${params}`)
  } else {
    res.redirect('/')
  }
})

// Only for MVP/testing; for production,
// will have nginx handle secured, static content
// Placeholder file
app.get('/download', function (req, res) {
  const file = './June_2020_Financial_Reports.pdf'
  res.download(file)
})

app.use('/', require('./routes/index'))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`App listening on port ${port}`))

// Check scripts
