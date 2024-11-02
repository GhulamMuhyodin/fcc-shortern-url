require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlparser = require('url');
const validUrl = require('valid-url');
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortner");
const urls = db.collection("urls");

const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname,
   async (err,address)=>{
    if(!address){
       res.json({ error: 'invalid URL' });
    }else{
      const urlCount =  await urls.countDocuments({});
      const urlDoc = {
        url,
        shortUrl : urlCount
      }
      const result  = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

// Redirect to the original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({shortUrl : +shorturl})
  console.log(urlDoc);
  res.redirect(urlDoc.url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
