# Bookwalker client for Node.js

**NOTE**: Bookworm supports only manga releases!

## How to use

1. Install [Node.js](https://nodejs.org/).
2. [Download bookworm](https://github.com/Constellation39/bookworm.git) code. Extract it.

```
git clone https://github.com/Constellation39/bookworm.git
```

3. Install Dependencies

```
cd bookworm && npm install
```

4. Run the program

```
npm run start
```

## How to get bookwalker link
* It should be the information page of the comic
* It should look like this
    - https://global.bookwalker.jp/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  
## Cautions
1. The server enables reCAPTCHA when logins are too intensive, client use [2captcha](https://2captcha.com/), please put apikey in 2captcha-key.txt

## Env variables

- `BW_THROTTLE` `default: 10` - Throttle http requests per minute to bookwalker
- `BW_DONT_SAVE_AUTH` `default: 0` - Disable saving username/password to `auth.json`
- `BW_LINK` - Non-interactive way to set bookwalker link
- `BW_USERNAME` - Non-interactive way to set username
- `BW_PASSWORD` - Non-interactive way to set password
- `BW_BROWSER_ID` - Non-interactive way to set browser id
