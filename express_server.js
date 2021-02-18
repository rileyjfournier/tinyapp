const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "yadayada"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "moreyada"
  }
};


function generateRandomString() {
  let string = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const characters_length = characters.length;
  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters_length));
  }
  return string;
}

// page displaying all shortURLs with their original, longURL
app.get("/urls", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
  console.log('Current User:', templateVars.currentUser.user_id)
});


// login && logout with cookie management 
app.post("/login", (req, res) => {
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


// registration button to link to registration page
app.post("/registerLink", (req, res) => {
  res.redirect("/register");
});


// registration page
app.get("/register", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userID);
  res.redirect("/urls");
});


// page to create a new shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/new", (req, res) => {
  const shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = req.body.longURL;
  res.redirect(`/urls/${shortenedURL}`);
});


// displays information for a specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {  // clicking shortURL links to longURL
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.body.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.body.shortURL}`);
});


// post method using edit button to redirect to specified shortURL for editing purposes
app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});


// post method with use of button (see urls_index.ejs for button incorportation) to delete any shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});





// other routes ...
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