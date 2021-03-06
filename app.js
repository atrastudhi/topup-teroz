const axios = require('axios');
const cheerio = require('cheerio');
const tableParser = require('cheerio-tableparser');
const randomString = require('randomstring');
const currencyFormatter = require('currency-formatter');
const cors = require('cors');

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.post('/count', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const formData = `return_path=&login_id=${encodeURIComponent(email)}&login_password=${password}&x=107&y=8`;
    const Cookie = 'sid=' + randomString.generate(10);

    const login = await axios.post('https://jkt48.com/login?lang=id', formData, {
      headers: {
        Cookie
      }
    })

    if (login.data.includes('Alamat email atau Kata kunci salah')) {
      res.status(400).json({
        msg: 'alamat email atau password salah'
      });
    } else {
      const { data } = await axios.get('https://jkt48.com/mypage/point-history?lang=id', {
        headers: {
          Cookie
        }
      });
  
      const page = cheerio.load(data);
  
      tableParser(page);
  
      let parsed = page('table').parsetable();
  
      if (!parsed.length) {
  
        res.status(200).json({
          email,
          count: currencyFormatter.format(0, { code: 'IDR' }),
          number: 0
        });
  
      } else {
  
        let result = 0;
        let max = 0;
        let topupCount = 0;
  
        parsed[4].forEach((e, i) => {
          const splitted = e.split('Buy: ')[1];
          if (splitted) {
            const poin = splitted[splitted.length - 1] === 'P' ? splitted.split(' P')[0] : null;
            if (poin) {
              if (poin[0] === '+') {
                const num = Number(poin.split('+')[1].split(',').join(''));
                result += num;
                topupCount += 1;
                if (num > max) max = num;
              }
            }
          }
        });
  
        res.status(200).json({
          email,
          count: currencyFormatter.format(result, { code: 'IDR' }),
          number: result,
          max: currencyFormatter.format(max, { code: 'IDR' }),
          topupCount,
        });
  
      }
    }
  } catch (err) {
    res.status(500).json({
      msg: err
    });
  }
});

app.listen(4848);