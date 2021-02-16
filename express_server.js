const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


function generateRandomString() {
  let string = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const characters_length = characters.length;
  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters_length));
  }
  return string;
};

// page displaying all shortURLs with their original, longURL
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.post("/urls", (req, res) => {
  const shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = req.body.longURL;
  res.redirect(`/urls/${shortenedURL}`);
})


// page to create a new shortURL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


// displays information for a specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {  // clicking shortURL links to longURL
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// post method using edit button to redirect to specified shortURL for editing purposes
app.post("/urls/:shortURL/edit", (req, res) => {
  console.log(`trying to edit!`)
  res.redirect(`/urls/${req.params.shortURL}`);
})


// post method with use of button (see urls_index.ejs for button incorportation) to delete any shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(`trying to delete!`)
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})



app.get("/", (req, res) => {
  res.send("Hello!");
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});